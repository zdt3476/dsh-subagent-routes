import { isMap, isNode, isPair, isScalar, isSeq, parseDocument, stringify, YAMLMap, YAMLSeq, type Document, type Node } from 'yaml'

export interface RouteSpec {
  provider?: string
  model?: string
  reasoningEffort?: string
}

export interface WorkspaceRoute extends RouteSpec {
  path: string
}

export interface ParsedRouteTable {
  fallback?: RouteSpec
  routes: WorkspaceRoute[]
}

export type RouteYamlEdit =
  | { kind: 'fallback'; spec?: RouteSpec }
  | { kind: 'route'; index: number; route: WorkspaceRoute }
  | { kind: 'delete-route'; index: number }

export class RouteYamlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RouteYamlError'
  }
}

const SPEC_KEYS = ['provider', 'model', 'reasoningEffort'] as const
const ROUTE_KEYS = ['path', ...SPEC_KEYS] as const

function routeDocument(text: string): Document {
  const doc = parseDocument(text)
  const error = doc.errors[0]
  if (error !== undefined) throw new RouteYamlError(`路由表不是合法 YAML：${error.message}`)
  return doc
}

function readMap(raw: unknown, keys: readonly string[], context: string): Map<string, unknown> {
  if (!(raw instanceof Map)) throw new RouteYamlError(`${context} 必须是对象`)
  for (const key of raw.keys()) {
    if (typeof key !== 'string' || !keys.includes(key)) {
      throw new RouteYamlError(`${context} 含未知字段 "${String(key)}"，只接受 ${keys.join('/')}`)
    }
  }
  return raw as Map<string, unknown>
}

function optionalText(source: Map<string, unknown>, key: string, context: string): string | undefined {
  if (!source.has(key)) return undefined
  const value = source.get(key)
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RouteYamlError(`${context} 的 ${key} 必须是非空字符串`)
  }
  return value.trim()
}

function readSpec(source: Map<string, unknown>, context: string): RouteSpec {
  const provider = optionalText(source, 'provider', context)
  const model = optionalText(source, 'model', context)
  const reasoningEffort = optionalText(source, 'reasoningEffort', context)
  if ((provider === undefined) !== (model === undefined)) {
    throw new RouteYamlError(`${context} 的 provider 与 model 必须同时出现或同时省略`)
  }
  if (provider === undefined && reasoningEffort === undefined) {
    throw new RouteYamlError(`${context} 至少要指定 provider/model 或 reasoningEffort`)
  }
  return {
    ...(provider === undefined ? {} : { provider }),
    ...(model === undefined ? {} : { model }),
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
  }
}

function readRoute(raw: unknown, index: number): WorkspaceRoute {
  const context = `routes[${index}]`
  const source = readMap(raw, ROUTE_KEYS, context)
  const path = source.get('path')
  if (typeof path !== 'string') throw new RouteYamlError(`${context} 缺少字符串字段 path`)
  if (path.trim() === '') throw new RouteYamlError('路由条目的 path 不能为空')
  return { path, ...readSpec(source, context) }
}

function readDocument(doc: Document): ParsedRouteTable {
  let raw: unknown
  try {
    raw = doc.toJS({ mapAsMap: true })
  } catch (error) {
    throw new RouteYamlError(`路由表不是合法 YAML：${error instanceof Error ? error.message : String(error)}`)
  }
  if (raw == null) return { fallback: undefined, routes: [] }
  const root = readMap(raw, ['default', 'routes'], '路由表根节点')
  const rawDefault = root.get('default')
  const fallback = rawDefault == null ? undefined : readSpec(readMap(rawDefault, SPEC_KEYS, 'default'), 'default')
  const rawRoutes = root.get('routes')
  if (rawRoutes == null) return { fallback, routes: [] }
  if (!Array.isArray(rawRoutes)) throw new RouteYamlError('routes 必须是数组')
  return { fallback, routes: rawRoutes.map(readRoute) }
}

/** 共享 YAML 语法及字段校验。目录的原生路径校验和规范化由 Host 负责。 */
export function parseRouteYaml(text: string): ParsedRouteTable {
  return readDocument(routeDocument(text))
}

function definedEntries(value: object): Map<string, unknown> {
  return new Map(Object.entries(value).filter(([, field]) => field !== undefined))
}

function keepComments<T extends Node>(next: T, previous: unknown): T {
  if (isNode(previous)) {
    next.comment = previous.comment
    next.commentBefore = previous.commentBefore
    next.spaceBefore = previous.spaceBefore
  }
  return next
}

type RouteFields = RouteSpec & { path?: string }

/** 保留现有标量节点的样式和注释，只增、删、改本条规则变化的字段。 */
function updateFields(node: YAMLMap, before: RouteFields, after: RouteFields): void {
  for (const field of ROUTE_KEYS) {
    if (before[field] === after[field]) continue
    if (after[field] === undefined) node.delete(field)
    else node.set(field, after[field])
  }
}

/** 编辑单个节点。可保留其他节点的注释与值。YAML 的缩进和空格可随文档重排。 */
export function editRouteYaml(text: string, edit: RouteYamlEdit): string {
  const doc = routeDocument(text)
  const table = readDocument(doc)
  const warning = doc.warnings[0]
  if (warning !== undefined) throw new RouteYamlError(`无法安全编辑该 YAML，请在原始模式修改：${warning.message}`)
  if (!isMap(doc.contents)) doc.contents = keepComments(new YAMLMap(doc.schema), doc.contents)

  if (edit.kind === 'fallback') {
    if (edit.spec === undefined) {
      if (table.fallback === undefined) return text
      const first = doc.contents.items[0]
      if (isPair(first) && isScalar(first.key) && first.key.value === 'default' && first.key.commentBefore) {
        doc.commentBefore = [doc.commentBefore, first.key.commentBefore].filter(Boolean).join('\n')
      }
      doc.delete('default')
      table.fallback = undefined
    } else {
      const next = readSpec(readMap(definedEntries(edit.spec), SPEC_KEYS, 'default'), 'default')
      const current = doc.get('default', true)
      if (isMap(current) && table.fallback !== undefined) updateFields(current, table.fallback, next)
      else doc.set('default', keepComments(doc.createNode(definedEntries(next)), current))
      table.fallback = next
    }
  } else {
    const { index } = edit
    if (!Number.isInteger(index) || index < 0 || index > table.routes.length ||
        (edit.kind === 'delete-route' && index === table.routes.length)) {
      throw new RouteYamlError('项目规则位置无效，请重新读取路由表')
    }
    const current = doc.get('routes', true)
    const seq = isSeq(current) ? current : keepComments(new YAMLSeq(doc.schema), current)
    if (!isSeq(current)) {
      if (table.routes.length !== 0 || (current !== undefined && !(isScalar(current) && current.value === null))) {
        throw new RouteYamlError('无法安全编辑由别名或合并键引用的 routes，请在原始模式修改')
      }
      doc.set('routes', seq)
    }

    if (edit.kind === 'delete-route') {
      seq.delete(index)
      table.routes.splice(index, 1)
    } else {
      const next = readRoute(definedEntries(edit.route), index)
      const node = seq.get(index, true)
      const previous = table.routes[index]
      if (previous !== undefined && isMap(node)) updateFields(node, previous, next)
      else seq.set(index, keepComments(doc.createNode(definedEntries(next)), node))
      table.routes[index] = next
    }
  }

  let result: string
  try {
    result = doc.toString({ lineWidth: 0 })
    // 锚点可能被其他规则引用。只有本次目标改动的结果与重新解析完全一致才返回。
    if (JSON.stringify(parseRouteYaml(result)) !== JSON.stringify(table)) throw new Error('编辑会改变非目标字段的值')
  } catch (error) {
    throw new RouteYamlError(`无法安全编辑该 YAML，请在原始模式修改：${error instanceof Error ? error.message : String(error)}`)
  }
  return result
}

/** 兼容旧调用方从结构化数据生成新表。编辑现有表请用 editRouteYaml。 */
export function serializeRouteTable(fallback?: RouteSpec, routes: WorkspaceRoute[] = []): string {
  const hasFallback = fallback && (fallback.provider || fallback.model || fallback.reasoningEffort)
  const table = {
    ...(hasFallback ? { default: fallback } : {}),
    ...(routes.length > 0 || !hasFallback ? { routes } : {}),
  }
  return `# 子代理工作区路由表\n# 最长前缀匹配优先；未匹配项目回落至全局兜底配置（若有）。\n${stringify(table, { lineWidth: 0 })}`
}

/** 兼容旧调用方的非抛错 API。 */
export function parseSimpleRouteYaml(text: string): { data?: ParsedRouteTable; error?: string } {
  try {
    return { data: parseRouteYaml(text) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
