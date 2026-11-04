/**
 * 会话面板接口：控制台读写「本会话的子代理模型选择」。
 *
 * 与 settings-api 分开的理由：那条链路读写的是插件配置与路由表文件，带 revision 乐观锁；
 * 这条链路只读写当前会话的选择，语义和失败模式都不同，混在一个 handler 里会让
 * 「保存配置」「保存规则」「保存会话选择」三种意图互相纠缠。
 */

import type { Context } from '@deepseek-ai/cordis'
import {
  SESSION_PATH,
  type CatalogProviderGroup,
  type SessionMode,
  type SessionSnapshot,
} from '../shared/settings'
import { normalizeSessionRecord, resolveEffective, type SessionRecord } from '../shared/overrides'
import type { RouteSpec } from '../shared/yaml-utils'
import { resolveConfig } from './config'
import { OverrideStore, routeOf } from './overrides'
import { loadRouteTable, matchRouteWithPath, RouteTableError } from './routes'
import { readTableSettings, saveTableSettings, SettingsError } from './settings'
import { serializeRouteTable } from '../shared/yaml-utils'

/** 会话元信息读取面：本插件只需要 id 对应的当前目录。 */
export interface SessionLookup {
  /** 返回会话的当前工作目录；会话不存在时返回 undefined。 */
  directory(sessionId: string): string | undefined
}

interface Connection {
  fetch: {
    register(route: {
      path: string
      methods: string[]
      requestBody: 'buffered'
      fetch(request: Request): Promise<Response>
    }): unknown
  }
}

const MAX_REQUEST_BYTES = 64 * 1024
const MAX_SESSION_ID_LENGTH = 256
const MAX_PATH_LENGTH = 4096

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function record(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
}

function readSessionId(value: unknown): string {
  if (typeof value !== 'string') throw new SettingsError('sessionId 必须是字符串')
  const trimmed = value.trim()
  if (trimmed === '') throw new SettingsError('sessionId 不能为空')
  if (trimmed.length > MAX_SESSION_ID_LENGTH) throw new SettingsError('sessionId 过长', 413)
  return trimmed
}

const SESSION_MODES: readonly SessionMode[] = ['follow', 'inherit', 'custom']

function readMode(value: unknown): SessionMode {
  if (value === undefined) return 'follow'
  if (typeof value !== 'string' || !SESSION_MODES.includes(value as SessionMode)) {
    throw new SettingsError('mode 必须是 follow / inherit / custom 之一')
  }
  return value as SessionMode
}

/** 读取路由字段；未出现的键视为「没有指定」，空串也按未指定处理。 */
function readRoute(raw: unknown): { provider?: string; model?: string; reasoningEffort?: string } {
  const source = record(raw)
  const pick = (key: string): string | undefined => {
    const value = source[key]
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'string') throw new SettingsError(`${key} 必须是字符串`)
    if (value.length > 512) throw new SettingsError(`${key} 过长`, 413)
    return value
  }
  return {
    provider: pick('provider'),
    model: pick('model'),
    reasoningEffort: pick('reasoningEffort'),
  }
}

export interface SessionHandlerOptions {
  rawConfig: unknown
  store: OverrideStore
  lookup?: SessionLookup
  warn: (message: string) => void
  getCatalog?: () => Promise<CatalogProviderGroup[] | undefined>
}

/** 把持久化记录展开成界面需要的三态。 */
function modeOf(session: SessionRecord | undefined): SessionMode {
  if (session === undefined) return 'follow'
  return session.mode === 'inherit' ? 'inherit' : 'custom'
}

/**
 * 组装一次会话快照：目录、工作区规则命中、会话选择与最终生效结果。
 *
 * 每次都重读路由表与选择文件：控制台看到的就是「下一次派活会得到什么」，
 * 不维护第二个缓存副本。
 */
export function buildSessionSnapshot(
  sessionId: string,
  options: Pick<SessionHandlerOptions, 'rawConfig' | 'store' | 'lookup' | 'warn'>,
): SessionSnapshot {
  const config = resolveConfig(options.rawConfig)
  const session = options.store.get(sessionId)
  const directory = options.lookup?.directory(sessionId)

  let workspace: SessionSnapshot['workspace']
  let tableAvailable = true
  // 路由表状态与会话目录无关：即使拿不到目录，也要如实报告表是否可解析，
  // 否则面板会在表已损坏时仍然显示「规则正常」。
  try {
    const table = loadRouteTable(config.routesFile)
    // 全局策略是继承时规则根本不会被用到，不该让面板展示一个注定不生效的命中。
    if (directory !== undefined && config.fallbackPolicy === 'rules') {
      workspace = matchRouteWithPath(table, directory)
    }
  } catch (error) {
    tableAvailable = false
    const message = error instanceof RouteTableError ? error.message : String(error)
    options.warn(`subagent-routes: ${message}`)
  }

  const input = {
    ...(session === undefined ? {} : { session }),
    ...(workspace === undefined ? {} : { workspace }),
    defaultPolicy: config.fallbackPolicy,
  }
  const effective = resolveEffective(input)

  return {
    sessionId,
    ...(session === undefined ? {} : { session }),
    mode: modeOf(session),
    ...(workspace === undefined ? {} : { workspace }),
    ...(directory === undefined ? {} : { directory }),
    tableAvailable,
    enabled: config.enabled,
    defaultPolicy: config.fallbackPolicy,
    ...(effective === undefined ? {} : { effective }),
  }
}

export function createSessionHandler(options: SessionHandlerOptions): (request: Request) => Promise<Response> {
  const { warn } = options

  return async request => {
    try {
      if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method not allowed' }, 405)

      if (request.method === 'GET') {
        const url = new URL(request.url)
        const sessionId = readSessionId(url.searchParams.get('sessionId'))
        const snapshot = buildSessionSnapshot(sessionId, options)
        if (options.getCatalog) {
          try {
            snapshot.catalog = await options.getCatalog()
          } catch {
            // 目录获取失败不该让面板整体不可用：选择器会退回手动输入。
          }
        }
        return json(snapshot)
      }

      if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
        return json({ error: '请求必须使用 application/json' }, 415)
      }
      const body = await request.arrayBuffer()
      if (body.byteLength > MAX_REQUEST_BYTES) throw new SettingsError('请求体超过大小限制', 413)
      let payload: Record<string, unknown>
      try {
        const parsed: unknown = JSON.parse(new TextDecoder().decode(body))
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object')
        payload = parsed as Record<string, unknown>
      } catch {
        throw new SettingsError('请求参数必须是合法 JSON 对象')
      }

      const { action } = payload
      if (action === 'save') return json(saveSelection(payload, options))
      if (action === 'freeze') return json(freezeToWorkspace(payload, options))
      throw new SettingsError('请求参数只接受 action=save 或 action=freeze')
    } catch (error) {
      if (error instanceof SettingsError) return json({ error: error.message }, error.status)
      if (error instanceof RouteTableError) return json({ error: error.message }, 400)
      warn(`subagent-routes: 会话设置读写失败：${String(error)}`)
      return json({ error: '读取或保存会话设置失败，请查看 DSH 日志' }, 500)
    }
  }
}

/** 保存或清除会话选择，返回保存后的最新快照。 */
function saveSelection(
  payload: Record<string, unknown>,
  options: Pick<SessionHandlerOptions, 'rawConfig' | 'store' | 'lookup' | 'warn'>,
): SessionSnapshot {
  const sessionId = readSessionId(payload.sessionId)
  const mode = readMode(payload.mode)
  const raw = payload.override
  // mode=custom 才需要路由字段；缺字段是客户端写错了，而不是「清除」。
  if (mode === 'custom' && raw === undefined) {
    throw new SettingsError('mode=custom 时必须提供 override 字段')
  }
  let normalized: SessionRecord | undefined
  try {
    const spec: RouteSpec | undefined =
      raw === undefined || raw === null ? undefined : readRoute(raw)
    normalized = normalizeSessionRecord(mode, spec)
  } catch (error) {
    // 规范化里的校验失败属于请求问题，不该报成 500。
    throw new SettingsError(error instanceof Error ? error.message : String(error))
  }
  options.store.set(sessionId, normalized)
  return buildSessionSnapshot(sessionId, options)
}

/**
 * 把当前会话的指定固化为工作区规则。
 *
 * 语义是「保存为该项目以后的默认」：写入路由表后清除会话选择，
 * 否则同一效果会被两处声明，用户改规则时会困惑于哪个在起作用。
 */
function freezeToWorkspace(
  payload: Record<string, unknown>,
  options: Pick<SessionHandlerOptions, 'rawConfig' | 'store' | 'lookup' | 'warn'>,
): SessionSnapshot {
  const sessionId = readSessionId(payload.sessionId)
  const session = options.store.get(sessionId)
  const override = routeOf(session)
  if (override === undefined) throw new SettingsError('当前会话没有临时指定，无法固化为项目规则')

  const config = resolveConfig(options.rawConfig)
  const explicitPath = payload.path
  if (explicitPath !== undefined && typeof explicitPath !== 'string') {
    throw new SettingsError('path 必须是字符串')
  }
  const path = (typeof explicitPath === 'string' ? explicitPath.trim() : '') ||
    options.lookup?.directory(sessionId)
  if (path === undefined || path === '') {
    throw new SettingsError('无法确定会话所在目录，请在请求中显式提供 path')
  }
  if (path.length > MAX_PATH_LENGTH) throw new SettingsError('path 过长', 413)

  const current = readTableSettings(config.routesFile)
  if (current.validationError !== undefined) {
    // 表已损坏时不动手：贸然重写会把用户已有的规则整份覆盖掉。
    throw new SettingsError(`路由表当前无法解析，请先修复后再固化：${current.validationError}`)
  }

  const nextRoutes = [...(current.parsed?.routes ?? [])]
  const existing = nextRoutes.findIndex(route => route.path === path)
  const entry = {
    path,
    ...(override.provider === undefined ? {} : { provider: override.provider }),
    ...(override.model === undefined ? {} : { model: override.model }),
    ...(override.reasoningEffort === undefined ? {} : { reasoningEffort: override.reasoningEffort }),
  }
  if (existing >= 0) nextRoutes[existing] = entry
  else nextRoutes.push(entry)

  const text = serializeRouteTable(current.parsed?.fallback, nextRoutes)
  saveTableSettings(config.routesFile, { text, revision: current.revision })
  // 规则已经承载同一效果，会话选择到此为止。
  options.store.set(sessionId, undefined)
  return buildSessionSnapshot(sessionId, options)
}

/** 复用宿主的认证、Origin fence、owner 限制及注册生命周期，不另挂裸 webServer 路由。 */
export function registerSessionApi(
  ctx: Context,
  rawConfig: unknown,
  options: { store: OverrideStore; lookup?: SessionLookup; getCatalog?: () => Promise<CatalogProviderGroup[] | undefined> },
): void {
  ctx.inject(['connection'], (injected: Context) => {
    const connection = injected.get('connection') as Connection | undefined
    if (connection?.fetch?.register === undefined) {
      ctx.logger.warn('subagent-routes: 当前宿主不支持安全会话接口')
      return
    }
    connection.fetch.register({
      path: SESSION_PATH,
      methods: ['GET', 'PUT'],
      requestBody: 'buffered',
      fetch: createSessionHandler({
        rawConfig,
        store: options.store,
        ...(options.lookup === undefined ? {} : { lookup: options.lookup }),
        warn: message => ctx.logger.warn(message),
        ...(options.getCatalog === undefined ? {} : { getCatalog: options.getCatalog }),
      }),
    })
  })
}
