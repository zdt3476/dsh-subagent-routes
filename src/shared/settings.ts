import type { ParsedRouteTable } from './yaml-utils'
export type { ParsedRouteTable, RouteSpec, WorkspaceRoute } from './yaml-utils'

export const PACKAGE_NAME = '@zdt3476/dsh-subagent-routes'
export const PLUGIN_ID = 'subagent-routes'
export const SETTINGS_PATH = '/api/subagent-routes/settings'
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
