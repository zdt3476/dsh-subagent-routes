import type { EffectiveRoute } from './overrides'
import type { ParsedRouteTable, RouteSpec } from './yaml-utils'
export type { ParsedRouteTable, RouteSpec, WorkspaceRoute } from './yaml-utils'

export const PACKAGE_NAME = '@zdt3476/dsh-subagent-routes'
export const PLUGIN_ID = 'subagent-routes'
export const SETTINGS_PATH = '/api/subagent-routes/settings'
/** 会话级覆盖的读写路径；只接受 GET 与 PUT。 */
export const SESSION_PATH = '/api/subagent-routes/session'
export const MAX_TABLE_BYTES = 256 * 1024

export interface TableSettings {
  file: string
  exists: boolean
  text: string
  revision: string
  validationError?: string
  parsed?: ParsedRouteTable
}

export interface SaveTableSettings {
  text: string
  revision: string
}

export interface PluginConfig {
  routesFile: string
  enabled: boolean
  preflight: boolean
}

export interface ModelReasoningEffort {
  id: string
  name: string
  description?: string
}

export interface ModelReasoningInfo {
  efforts: ModelReasoningEffort[]
  defaultEffort?: string
}

export interface CatalogModel {
  id: string
  name: string
  description?: string
  reasoning?: ModelReasoningInfo
}

export interface CatalogProviderGroup {
  id: string
  name: string
  models: CatalogModel[]
}

/** 宿主已登记的工作区，用于在设置页直接挑选项目目录。 */
export interface WorkspaceEntry {
  path: string
  title: string
}

export interface SettingsSnapshot {
  config: PluginConfig
  configRevision: string
  canEditConfig: boolean
  table: TableSettings | null
  tableError?: string
  catalog?: CatalogProviderGroup[]
  workspaces?: WorkspaceEntry[]
}

/** 侧边栏控制台看到的会话状态。 */
export interface SessionSnapshot {
  sessionId: string
  /** 该会话当前生效的路由；undefined 表示继承父会话模型。 */
  effective?: EffectiveRoute
  /** 该会话的临时覆盖；undefined 表示跟随工作区规则。 */
  override?: RouteSpec
  /** 当前会话所在目录解析出的工作区规则；undefined 表示只剩全局兜底或没有规则。 */
  workspace?: { spec: RouteSpec; path?: string }
  /** 解析出的工作目录；拿不到时为 undefined，此时只有会话覆盖能生效。 */
  directory?: string
  /** 路由表是否可读；不可读时面板需要说明「工作区规则暂不可用」。 */
  tableAvailable: boolean
  /** 插件总开关关闭时，覆盖与规则都不生效，面板据此禁用编辑。 */
  enabled: boolean
  /** 宿主探测到的模型目录，供三级联动使用。 */
  catalog?: CatalogProviderGroup[]
}

/** 保存会话覆盖；`override` 为 null 表示清除并回到工作区规则。 */
export interface SaveSessionOverride {
  sessionId: string
  override: RouteSpec | null
}

/** 把当前会话覆盖固化为工作区规则。 */
export interface FreezeSessionWorkspace {
  sessionId: string
  /** 目标目录；缺省用会话当前目录。 */
  path?: string
}

/** 会话接口接受的写操作：两种意图共用一个 PUT，靠 action 区分。 */
export type SessionAction =
  | ({ action: 'save' } & SaveSessionOverride)
  | ({ action: 'freeze' } & FreezeSessionWorkspace)
