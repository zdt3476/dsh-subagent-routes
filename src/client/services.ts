import { SETTINGS_PATH, type PluginConfig, type SaveTableSettings, type SettingsSnapshot, type TableSettings } from '../shared/settings'

export interface SettingsApi {
  load(signal?: AbortSignal): Promise<SettingsSnapshot>
  saveTable(value: SaveTableSettings): Promise<TableSettings>
  saveConfig(config: PluginConfig, revision: string): Promise<void>
}

async function request<T>(init?: RequestInit): Promise<T> {
  const response = await fetch(SETTINGS_PATH, { credentials: 'same-origin', cache: 'no-store', ...init })
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error(`宿主设置接口不可用（HTTP ${response.status}），请重载插件后重试`)
  }
  if (!response.ok) {
    const error = (body as { error?: unknown } | null)?.error
    throw new Error(typeof error === 'string' ? error : `设置请求失败（HTTP ${response.status}）`)
  }
  return body as T
}

function put(payload: unknown): RequestInit {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

export const settingsApi: SettingsApi = {
  load: signal => request<SettingsSnapshot>({ signal }),
  saveTable: value => request<TableSettings>(put({ kind: 'table', ...value })),
  saveConfig: async (config, revision) => { await request(put({ kind: 'config', config, revision })) },
}
