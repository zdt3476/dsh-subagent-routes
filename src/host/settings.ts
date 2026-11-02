import { createHash, randomUUID } from 'node:crypto'
import { chmodSync, closeSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { MAX_TABLE_BYTES, type TableSettings } from '../shared/settings'
import { parseRouteTable, RouteTableError } from './routes'

export class SettingsError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'SettingsError'
  }
}

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'ENOENT'
}

function snapshot(file: string): TableSettings {
  let text = ''
  let exists = true
  try {
    const info = statSync(file)
    if (!info.isFile()) throw new SettingsError('路由表必须是普通文件')
    if (info.size > MAX_TABLE_BYTES) throw new SettingsError('路由表超过 256 KiB 大小限制', 413)
    text = readFileSync(file, 'utf8')
    if (Buffer.byteLength(text, 'utf8') > MAX_TABLE_BYTES) throw new SettingsError('路由表超过 256 KiB 大小限制', 413)
  } catch (error) {
    if (!isMissing(error)) throw error
    exists = false
  }
  const revision = createHash('sha256').update(JSON.stringify([resolve(file), exists, text])).digest('hex')
  return { file: resolve(file), exists, text, revision }
}

export function readTableSettings(file: string): TableSettings {
  const state = snapshot(file)
  try {
    const table = parseRouteTable(state.text)
    return {
      ...state,
      parsed: {
        fallback: table.fallback,
        routes: [...table.routes],
      },
    }
  } catch (error) {
    if (!(error instanceof RouteTableError)) throw error
    return { ...state, validationError: error.message }
  }
}

function rejectSymlink(file: string): void {
  try {
    if (lstatSync(file).isSymbolicLink()) {
      throw new SettingsError('为避免替换符号链接，请直接编辑其目标文件，或将 routesFile 配置为目标路径')
    }
  } catch (error) {
    if (!isMissing(error)) throw error
  }
}

/** 只写当前配置文件；保存前与原子替换前检查内容版本，避免覆盖已检测到的外部编辑。 */
export function saveTableSettings(file: string, raw: unknown): TableSettings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SettingsError('保存参数必须是对象')
  const payload = raw as Record<string, unknown>
  if (Object.keys(payload).some(key => key !== 'text' && key !== 'revision') ||
      typeof payload.text !== 'string' || typeof payload.revision !== 'string') {
    throw new SettingsError('保存参数只接受 text 与 revision 字符串')
  }
  if (Buffer.byteLength(payload.text, 'utf8') > MAX_TABLE_BYTES) {
    throw new SettingsError('路由表超过 256 KiB 大小限制', 413)
  }
  const current = snapshot(file)
  if (current.revision !== payload.revision) throw new SettingsError('文件已被修改，请重新读取后合并修改再保存', 409)
  parseRouteTable(payload.text)

  const target = resolve(file)
  const folder = dirname(target)
  rejectSymlink(target)
  const mode = current.exists ? statSync(target).mode & 0o777 : 0o600
  mkdirSync(folder, { recursive: true })
  const temporary = join(folder, `.${basename(target)}.${randomUUID()}.tmp`)
  // 临时文件与目标在同一目录；写完再替换，避免派活读到半份 YAML。
  let descriptor: number | undefined
  let created = false
  try {
    descriptor = openSync(temporary, 'wx', 0o600)
    created = true
    writeFileSync(descriptor, payload.text, { encoding: 'utf8' })
    closeSync(descriptor)
    descriptor = undefined
    chmodSync(temporary, mode)
    rejectSymlink(target)
    if (snapshot(file).revision !== payload.revision) {
      throw new SettingsError('文件已被修改，请重新读取后合并修改再保存', 409)
    }
    renameSync(temporary, target)
    created = false
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
    if (created) unlinkSync(temporary)
  }
  return readTableSettings(file)
}
