import {
  SESSION_PATH,
  SETTINGS_PATH,
  type PluginConfig,
  type RouteSpec,
  type SaveSessionSelection,
  type SaveTableSettings,
  type SessionMode,
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
  /** 保存会话选择；`mode: 'follow'` 表示回到全局策略。 */
  save(sessionId: string, selection: { mode: SessionMode; override?: RouteSpec | null }): Promise<SessionSnapshot>
  /** 把当前覆盖固化为工作区规则。 */
  freeze(sessionId: string): Promise<SessionSnapshot>
  /** 成功写入后重新读取 Host；不在 Client 缓存或推算生效路由。 */
  subscribe?(listener: () => void): () => void
}

const sessionListeners = new Set<() => void>()

function notifySessionChange(): void {
  for (const listener of sessionListeners) listener()
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
  saveTable: async value => {
    const table = await send<TableSettings>(SETTINGS_PATH, put({ kind: 'table', ...value }))
    notifySessionChange()
    return table
  },
  saveConfig: async (config, revision) => {
    await send(SETTINGS_PATH, put({ kind: 'config', config, revision }))
    notifySessionChange()
  },
}

export const sessionApi: SessionApi = {
  load: (sessionId, signal) =>
    send<SessionSnapshot>(`${SESSION_PATH}?sessionId=${encodeURIComponent(sessionId)}`, { signal }),
  save: async (sessionId, selection) => {
    const payload: { action: 'save'; sessionId: string; mode: SessionMode; override?: RouteSpec | null } = {
      action: 'save',
      sessionId,
      mode: selection.mode,
      ...(selection.override !== undefined ? { override: selection.override } : {}),
    }
    const snapshot = await send<SessionSnapshot>(SESSION_PATH, put(payload))
    notifySessionChange()
    return snapshot
  },
  freeze: async sessionId => {
    const snapshot = await send<SessionSnapshot>(SESSION_PATH, put({ action: 'freeze', sessionId }))
    notifySessionChange()
    return snapshot
  },
  subscribe: listener => {
    sessionListeners.add(listener)
    return () => { sessionListeners.delete(listener) }
  },
}
