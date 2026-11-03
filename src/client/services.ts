import {
  SESSION_PATH,
  SETTINGS_PATH,
  type PluginConfig,
  type RouteSpec,
  type SaveTableSettings,
  type SessionSnapshot,
  type SettingsSnapshot,
  type TableSettings,
} from '../shared/settings'

export interface SettingsApi {
  load(signal?: AbortSignal): Promise<SettingsSnapshot>
  saveTable(value: SaveTableSettings): Promise<TableSettings>
  saveConfig(config: PluginConfig, revision: string): Promise<void>
}

/** 侧边栏控制台的数据面。 */
export interface SessionApi {
  load(sessionId: string, signal?: AbortSignal): Promise<SessionSnapshot>
  /** 保存或清除会话覆盖；`null` 表示回到工作区规则。 */
  save(sessionId: string, override: RouteSpec | null): Promise<SessionSnapshot>
  /** 把当前覆盖固化为工作区规则。 */
  freeze(sessionId: string): Promise<SessionSnapshot>
}

async function send<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init })
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error(`宿主接口不可用（HTTP ${response.status}），请重载插件后重试`)
  }
  if (!response.ok) {
    const error = (body as { error?: unknown } | null)?.error
    throw new Error(typeof error === 'string' ? error : `请求失败（HTTP ${response.status}）`)
  }
  return body as T
}

function put(payload: unknown): RequestInit {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

export const settingsApi: SettingsApi = {
  load: signal => send<SettingsSnapshot>(SETTINGS_PATH, { signal }),
  saveTable: value => send<TableSettings>(SETTINGS_PATH, put({ kind: 'table', ...value })),
  saveConfig: async (config, revision) => { await send(SETTINGS_PATH, put({ kind: 'config', config, revision })) },
}

export const sessionApi: SessionApi = {
  load: (sessionId, signal) =>
    send<SessionSnapshot>(`${SESSION_PATH}?sessionId=${encodeURIComponent(sessionId)}`, { signal }),
  save: (sessionId, override) =>
    send<SessionSnapshot>(SESSION_PATH, put({ action: 'save', sessionId, override })),
  freeze: sessionId => send<SessionSnapshot>(SESSION_PATH, put({ action: 'freeze', sessionId })),
}
