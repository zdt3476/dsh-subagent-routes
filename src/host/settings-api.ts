import type { Context } from '@deepseek-ai/cordis'
import { createHash } from 'node:crypto'
import {
  MAX_TABLE_BYTES,
  PACKAGE_NAME,
  PLUGIN_ID,
  SETTINGS_PATH,
  type CatalogModel,
  type CatalogProviderGroup,
  type PluginConfig,
  type SettingsSnapshot,
  type WorkspaceEntry,
} from '../shared/settings'
import { resolveConfig } from './config'
import { RouteTableError } from './routes'
import { readTableSettings, saveTableSettings, SettingsError } from './settings'

export interface LlmCatalogService {
  listProviders?(): Array<{ id: string; name: string }>
  listModels?(providerId: string): Promise<Array<{ id: string; name: string; description?: string }>>
  resolveModelInfo?(providerId: string, modelId: string): Promise<{
    reasoning?: {
      efforts: Array<{ id: string; name: string; description?: string }>
      defaultEffort?: string
    }
  }>
}

/** 工作区注册表的最小结构，仅用于枚举宿主已登记的项目目录。 */
export interface WorkspaceRegistryService {
  list?(): Array<{ path: string; title: string }>
}

/** 读取宿主已登记的工作区；不依赖持久化细节，读取失败时安静降级为空列表。 */
export function collectWorkspaces(registry?: WorkspaceRegistryService): WorkspaceEntry[] | undefined {
  if (!registry || typeof registry.list !== 'function') return undefined
  try {
    const entries = registry.list()
    const seen = new Set<string>()
    const workspaces: WorkspaceEntry[] = []
    for (const entry of entries) {
      if (typeof entry?.path !== 'string' || entry.path === '' || seen.has(entry.path)) continue
      seen.add(entry.path)
      workspaces.push({ path: entry.path, title: typeof entry.title === 'string' ? entry.title : entry.path })
    }
    return workspaces.length > 0 ? workspaces : undefined
  } catch {
    return undefined
  }
}

export async function buildCatalogFromLlm(llm?: LlmCatalogService): Promise<CatalogProviderGroup[] | undefined> {
  if (!llm || typeof llm.listProviders !== 'function') return undefined
  try {
    const providers = llm.listProviders()
    const groups: CatalogProviderGroup[] = []
    for (const p of providers) {
      try {
        const models = typeof llm.listModels === 'function' ? await llm.listModels(p.id) : []
        const entries = await Promise.all(models.map(async (m): Promise<CatalogModel> => {
          let reasoning: CatalogModel['reasoning']
          if (typeof llm.resolveModelInfo === 'function') {
            try {
              const info = await llm.resolveModelInfo(p.id, m.id)
              if (info?.reasoning?.efforts?.length) {
                reasoning = {
                  efforts: info.reasoning.efforts.map(e => ({ id: e.id, name: e.name, description: e.description })),
                  defaultEffort: info.reasoning.defaultEffort,
                }
              }
            } catch {
              // 单个模型失败不影响其他模型
            }
          }
          return { id: m.id, name: m.name, description: m.description, reasoning }
        }))
        groups.push({ id: p.id, name: p.name, models: entries })
      } catch {
        // 单个 provider 失败不影响其他 provider
      }
    }
    return groups.length > 0 ? groups : undefined
  } catch {
    return undefined
  }
}

interface ConfigEntry {
  options: { id?: string; name?: string; config?: unknown }
}

interface ConfigEditor {
  entries(): ConfigEntry[]
  edit(entry: ConfigEntry, change: (raw: unknown) => unknown): Promise<void>
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

const MAX_REQUEST_BYTES = MAX_TABLE_BYTES * 6 + 4096

function record(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
}

function editableConfig(raw: unknown): PluginConfig {
  const source = record(raw)
  const config = resolveConfig(source)
  return {
    routesFile: typeof source.routesFile === 'string' ? source.routesFile.trim() : '',
    enabled: config.enabled,
    preflight: config.preflight,
  }
}

function configRevision(raw: unknown): string {
  return createHash('sha256').update(JSON.stringify(editableConfig(raw))).digest('hex')
}

function validateConfig(raw: unknown): PluginConfig {
  const source = record(raw)
  if (Object.keys(source).length !== 3 ||
      Object.keys(source).some(key => !['routesFile', 'enabled', 'preflight'].includes(key)) ||
      typeof source.routesFile !== 'string' || source.routesFile.length > 4096 || source.routesFile.includes('\0') ||
      typeof source.enabled !== 'boolean' || typeof source.preflight !== 'boolean') {
    throw new SettingsError('配置参数必须包含 routesFile 字符串、enabled 和 preflight 布尔值')
  }
  return { routesFile: source.routesFile.trim(), enabled: source.enabled, preflight: source.preflight }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function createSettingsHandler(
  rawConfig: unknown,
  editor: ConfigEditor | undefined,
  warn: (message: string) => void,
  getCatalog?: () => Promise<CatalogProviderGroup[] | undefined>,
  getWorkspaces?: () => WorkspaceEntry[] | undefined,
): (request: Request) => Promise<Response> {
  const findEntry = () => editor?.entries().find(entry => entry.options.id === PLUGIN_ID && entry.options.name === PACKAGE_NAME)
  return async request => {
    try {
      if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method not allowed' }, 405)
      const entry = findEntry()
      const raw = entry?.options.config ?? rawConfig
      const config = resolveConfig(raw)
      if (request.method === 'GET') {
        const state: SettingsSnapshot = {
          config: editableConfig(raw), configRevision: configRevision(raw), canEditConfig: entry !== undefined,
          table: null,
        }
        try {
          state.table = readTableSettings(config.routesFile)
        } catch (error) {
          warn(`subagent-routes: 路由表读取失败：${String(error)}`)
          state.tableError = error instanceof SettingsError ? error.message : '无法读取路由表，请检查文件权限或修改基础设置中的路径'
        }
        if (getCatalog) {
          try {
            state.catalog = await getCatalog()
          } catch {
            // 忽略获取 catalog 错误
          }
        }
        if (getWorkspaces) {
          try {
            state.workspaces = getWorkspaces()
          } catch {
            // 宿主未提供工作区注册表时，设置页退回手动填写路径
          }
        }
        return json(state)
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
      const { kind, ...data } = payload
      if (kind === 'table') {
        const latest = resolveConfig(findEntry()?.options.config ?? rawConfig)
        if (latest.routesFile !== config.routesFile) throw new SettingsError('路由表路径已被修改，请重新读取设置后再保存', 409)
        return json(saveTableSettings(latest.routesFile, data))
      }
      if (kind !== 'config' || Object.keys(data).length !== 2 || !Object.hasOwn(data, 'config') || typeof data.revision !== 'string') {
        throw new SettingsError('请求参数只接受 kind=table 或 kind=config 及对应数据')
      }
      const next = validateConfig(data.config)
      if (editor === undefined || entry === undefined) throw new SettingsError('当前宿主不支持编辑此插件的 profile 配置', 503)
      await editor.edit(entry, current => {
        if (configRevision(current) !== data.revision) throw new SettingsError('配置已被修改，请重新读取后再保存', 409)
        return { ...record(current), ...next }
      })
      // configEditor 会正常重建插件；不要再用旧闭包读取已切换的 routesFile。
      return json({ saved: true })
    } catch (error) {
      if (error instanceof SettingsError) return json({ error: error.message }, error.status)
      if (error instanceof RouteTableError) return json({ error: error.message }, 400)
      warn(`subagent-routes: 设置读写失败：${String(error)}`)
      return json({ error: '读取或保存设置失败，请查看 DSH 日志' }, 500)
    }
  }
}

/** 复用宿主的认证、Origin fence、owner 限制及注册生命周期，不另挂裸 webServer 路由。 */
export function registerSettings(ctx: Context, rawConfig: unknown): void {
  ctx.inject(['connection'], (injected: Context) => {
    const connection = injected.get('connection') as Connection | undefined
    if (connection?.fetch?.register === undefined) {
      ctx.logger.warn('subagent-routes: 当前宿主不支持安全设置接口')
      return
    }
    const editor = injected.get('configEditor') as ConfigEditor | undefined
    const getCatalog = () => buildCatalogFromLlm(injected.get('llm') as LlmCatalogService | undefined)
    const getWorkspaces = () => collectWorkspaces(injected.get('workspaceRegistry') as WorkspaceRegistryService | undefined)
    connection.fetch.register({
      path: SETTINGS_PATH,
      methods: ['GET', 'PUT'],
      requestBody: 'buffered',
      fetch: createSettingsHandler(rawConfig, editor, message => ctx.logger.warn(message), getCatalog, getWorkspaces),
    })
  })
}
