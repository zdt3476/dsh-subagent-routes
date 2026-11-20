/**
 * 工作区路由表的读取、校验与前缀匹配。
 *
 * 路由表是插件唯一的事实来源：它不写会话事件、不改 profile，只在派活时
 * 被查询一次。文件不存在视为「没有配置任何路由」，不是错误。
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, resolve, sep } from 'node:path'
import { parseRouteYaml, RouteYamlError, type RouteSpec, type WorkspaceRoute } from '../shared/yaml-utils'

export type { RouteSpec, WorkspaceRoute } from '../shared/yaml-utils'

/** 解析后的路由表：全局兜底与按目录匹配的条目分开保存。 */
export interface RouteTable {
  readonly fallback: RouteSpec | undefined
  readonly routes: readonly WorkspaceRoute[]
}

const EMPTY_TABLE: RouteTable = { fallback: undefined, routes: [] }

export class RouteTableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RouteTableError'
  }
}

/** 展开 `~` 前缀并规范化；非绝对路径直接拒绝，避免相对路径随 cwd 漂移。 */
export function normalizePath(raw: string, home: string = homedir()): string {
  const trimmed = raw.trim()
  if (trimmed === '') throw new RouteTableError('路由条目的 path 不能为空')
  let expanded = trimmed
  if (trimmed === '~') expanded = home
  else if (trimmed.startsWith('~/') || trimmed.startsWith(`~${sep}`)) expanded = `${home}${trimmed.slice(1)}`
  if (!isAbsolute(expanded)) {
    throw new RouteTableError(`路由条目的 path 必须是绝对路径（或以 ~ 开头），收到 "${raw}"`)
  }
  // resolve 顺带去掉尾部分隔符，使 `/a/b/` 与 `/a/b` 等价。
  return resolve(expanded)
}

/** 宽容规范化运行期工作目录：绝对路径或 ~ 前缀按统一口径规范化，空白视为缺失，不抛错。 */
export function normalizeDirectory(raw: string | undefined, home: string = homedir()): string | undefined {
  if (raw === undefined) return undefined
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const homeRelative = trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith(`~${sep}`)
  if (homeRelative || isAbsolute(trimmed)) return normalizePath(trimmed, home)
  return trimmed
}

/** 共享 YAML 校验后，使用 Host 的原生路径规则完成规范化和查重。 */
export function parseRouteTable(text: string, home: string = homedir()): RouteTable {
  try {
    const { fallback, routes } = parseRouteYaml(text)
    const normalized = routes.map(route => ({ ...route, path: normalizePath(route.path, home) }))
    assertNoDuplicates(normalized)
    return { fallback, routes: normalized }
  } catch (error) {
    if (error instanceof RouteYamlError) throw new RouteTableError(error.message)
    throw error
  }
}

function assertNoDuplicates(routes: readonly WorkspaceRoute[]): void {
  const seen = new Set<string>()
  for (const route of routes) {
    if (seen.has(route.path)) throw new RouteTableError(`路由表重复声明了目录 "${route.path}"`)
    seen.add(route.path)
  }
}

/**
 * 从磁盘读取路由表。
 *
 * 文件不存在时返回空表而不是抛错：插件应该在没配置过的 profile 里安静地不做事。
 */
export function loadRouteTable(file: string, home: string = homedir()): RouteTable {
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch (error) {
    if (isMissingFile(error)) return EMPTY_TABLE
    throw new RouteTableError(`读取路由表失败：${error instanceof Error ? error.message : String(error)}`)
  }
  return parseRouteTable(text, home)
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'ENOENT'
}

/**
 * 判断 `target` 是否等于 `prefix` 或位于其下。
 *
 * 必须按路径分隔符边界比较：`/a/bc` 不属于 `/a/b`，否则相邻目录会互相串味。
 */
export function isUnder(target: string, prefix: string): boolean {
  if (target === prefix) return true
  const base = prefix.endsWith(sep) ? prefix : `${prefix}${sep}`
  return target.startsWith(base)
}

/**
 * 按最长前缀匹配选出该目录的路由，并保留命中的目录。
 *
 * 最长前缀优先，使 `/repo/legacy` 能覆盖 `/repo`；没有匹配时回落到 fallback
 * （此时 `path` 为 undefined，用来区分「命中了项目规则」与「只是全局兜底」）。
 */
export function matchRouteWithPath(
  table: RouteTable,
  directory: string,
): { spec: RouteSpec; path?: string } | undefined {
  let best: WorkspaceRoute | undefined
  for (const route of table.routes) {
    if (!isUnder(directory, route.path)) continue
    if (best === undefined || route.path.length > best.path.length) best = route
  }
  if (best !== undefined) return { spec: best, path: best.path }
  return table.fallback === undefined ? undefined : { spec: table.fallback }
}

/**
 * 按最长前缀匹配选出该目录的路由。
 *
 * 最长前缀优先，使 `/repo/legacy` 能覆盖 `/repo`；没有匹配时回落到 fallback。
 */
export function matchRoute(table: RouteTable, directory: string): RouteSpec | undefined {
  return matchRouteWithPath(table, directory)?.spec
}
