/**
 * 会话级选择的持久化。
 *
 * 为什么不用 ctx.storageDomain：那个服务要求领域声明方与消费方同时在场，
 * 且带 schema 版本闸门；本插件只需要一个小 JSON，直接用原子写更省事，
 * 也不必把插件绑定到 storage 家族是否出现在 profile 里。
 *
 * 文件是唯一事实源；读取失败一律退回空表而不是抛错——会话选择没了只是回落到
 * 全局策略，不该让整个派活路径失败。
 */

import { chmodSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { SessionRecord } from '../shared/overrides'
import type { RouteSpec } from '../shared/yaml-utils'

/** 单条记录的大小上限；超过就说明不是本插件写的。 */
const MAX_ENTRY_BYTES = 4096

/** 保留的会话条数上限。超限时淘汰最久未更新的条目，避免文件无限增长。 */
export const MAX_SESSIONS = 100

/** 一条会话记录加上淘汰用的时间戳。 */
export type StoredRecord = SessionRecord & { updatedAt: number }

interface StoredFile {
  version: 2
  sessions: Record<string, StoredRecord>
}

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'ENOENT'
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/**
 * 校验并规范化一条记录。
 *
 * 读取旧文件时可能遇到字段被手改坏的情况；逐条丢弃坏记录、保留好记录，
 * 而不是让一份坏数据把整个文件判废。没有 mode 字段的老记录按 custom 迁移，
 * 它们在升级前的语义就是「本会话指定了一套路由」。
 */
function parseRecord(raw: unknown): StoredRecord | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const source = raw as Record<string, unknown>
  const updatedAt = typeof source.updatedAt === 'number' && Number.isFinite(source.updatedAt) ? source.updatedAt : 0
  const mode = source.mode === 'inherit' ? 'inherit' : source.mode === 'custom' || source.mode === undefined ? 'custom' : undefined
  if (mode === undefined) return undefined
  if (mode === 'inherit') return { mode, updatedAt }

  const provider = text(source.provider)
  const model = text(source.model)
  const reasoningEffort = text(source.reasoningEffort)
  // provider/model 半套无法构成路由，直接丢弃该条。
  if ((provider === undefined) !== (model === undefined)) return undefined
  if (provider === undefined && reasoningEffort === undefined) return undefined
  return {
    mode: 'custom',
    ...(provider === undefined ? {} : { provider }),
    ...(model === undefined ? {} : { model }),
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    updatedAt,
  }
}

/** 去掉时间戳，得到可直接注入 agentOptions 的会话记录。 */
function toRecord(record: StoredRecord): SessionRecord {
  if (record.mode === 'inherit') return { mode: 'inherit' }
  return {
    mode: 'custom',
    ...(record.provider === undefined ? {} : { provider: record.provider }),
    ...(record.model === undefined ? {} : { model: record.model }),
    ...(record.reasoningEffort === undefined ? {} : { reasoningEffort: record.reasoningEffort }),
  }
}

export class OverrideStore {
  constructor(private readonly file: string) {}

  /** 读取整张内部表；文件缺失、损坏或结构不符时返回空表。 */
  read(): Record<string, StoredRecord> {
    let raw: string
    try {
      const info = statSync(this.file)
      if (!info.isFile() || info.size > MAX_SESSIONS * MAX_ENTRY_BYTES) return {}
      raw = readFileSync(this.file, 'utf8')
    } catch (error) {
      if (isMissing(error)) return {}
      return {}
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {}
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const sessions = (parsed as Partial<StoredFile>).sessions
    if (typeof sessions !== 'object' || sessions === null || Array.isArray(sessions)) return {}
    const table: Record<string, StoredRecord> = {}
    for (const [sessionId, value] of Object.entries(sessions as Record<string, unknown>)) {
      if (sessionId === '') continue
      const record = parseRecord(value)
      if (record !== undefined) table[sessionId] = record
    }
    return table
  }

  /** 读取单个会话的选择（不含内部时间戳）。 */
  get(sessionId: string): SessionRecord | undefined {
    const record = this.read()[sessionId]
    return record === undefined ? undefined : toRecord(record)
  }

  /**
   * 写入单个会话的选择；`undefined` 表示清除该会话（回到跟随全局策略）。
   *
   * 写盘前先把整表读出来再合并：并发派活不该让两次写入互相覆盖。
   */
  set(sessionId: string, record: SessionRecord | undefined): void {
    const table = { ...this.read() }
    if (record === undefined) delete table[sessionId]
    else table[sessionId] = { ...record, updatedAt: Date.now() } as StoredRecord
    this.write(table)
  }

  /** 把整表裁剪到上限并原子落盘。 */
  private write(table: Record<string, StoredRecord>): void {
    const entries = Object.entries(table)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS)
    const payload: StoredFile = { version: 2, sessions: Object.fromEntries(entries) }

    const target = this.file
    const folder = dirname(target)
    mkdirSync(folder, { recursive: true })
    const temporary = join(folder, `.${basename(target)}.${randomUUID()}.tmp`)
    let created = false
    try {
      writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
      created = true
      chmodSync(temporary, 0o600)
      // 临时文件与目标同目录：rename 是原子的，读侧不会看到半份 JSON。
      renameSync(temporary, target)
      created = false
    } finally {
      if (created) {
        try {
          unlinkSync(temporary)
        } catch {
          // 临时文件清理失败不影响已落盘结果；下次写入会另建新临时文件。
        }
      }
    }
  }
}

/** 从会话记录里取出可注入的路由字段；inherit 没有路由字段。 */
export function routeOf(record: SessionRecord | undefined): RouteSpec | undefined {
  if (record === undefined || record.mode !== 'custom') return undefined
  return {
    ...(record.provider === undefined ? {} : { provider: record.provider }),
    ...(record.model === undefined ? {} : { model: record.model }),
    ...(record.reasoningEffort === undefined ? {} : { reasoningEffort: record.reasoningEffort }),
  }
}
