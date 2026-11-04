/**
 * 子代理模型来源的优先级判定。
 *
 * 四层来源，从高到低：调用方显式参数 > 会话选择 > 工作区路由表 > 全局默认策略。
 * 最终注入的字段一律是「调用方没给过的那些」——调用方给过的字段永远不被改写，
 * 因此这里返回的是一份**增量**，由 mergeAgentOptions 原样合并进请求。
 *
 * 全局默认策略只决定**最后一层**：没有任何规则命中时，是让子代理继承主代理的模型，
 * 还是按路由表（含全局兜底）给出通用的子代理模型。会话选择可以压过它，
 * 因此「全局继承 + 单个会话用规则」和「全局规则 + 单个会话继承」都能表达。
 *
 * 宿主用它决定注入什么，客户端用它解释「为什么是这个结果」，两侧共用同一份判定，
 * 避免各自实现一套优先级而悄悄分叉。
 */

import type { RouteSpec } from './yaml-utils'

/** 生效来源，按优先级从高到低。 */
export type EffectiveSource = 'caller' | 'session' | 'workspace' | 'fallback' | 'inherit'

/** 没有任何规则命中时的全局默认策略：继承主代理模型，还是照常查路由表。 */
export type RouteDefaultPolicy = 'inherit' | 'rules'

/** 会话级三态：跟随全局策略 / 强制继承主代理模型 / 指定一套。 */
export type SessionMode = 'follow' | 'inherit' | 'custom'

/**
 * 会话记录（持久化形态）：只有 inherit 与 custom 两种，follow 靠删除记录表达。
 *
 * 用带判别字段的联合而不是 `{mode, provider?}` 的松散对象，
 * 是为了让「inherit 却带着 provider」这种自相矛盾的记录无法被构造出来。
 */
export type SessionRecord = { mode: 'inherit' } | ({ mode: 'custom' } & RouteSpec)

/** 会话 id → 该会话的记录。 */
export type OverrideTable = Readonly<Record<string, SessionRecord>>

/** 一次派活实际会注入的路由，以及它是从哪一层来的。 */
export interface EffectiveRoute {
  source: EffectiveSource
  /** 待合并的增量：只含调用方未指定的字段。 */
  spec: RouteSpec
  /** 命中工作区规则时的目录前缀；其余来源为空。 */
  workspacePath?: string
}

/** 判定输入：各层各自解析出的候选。 */
export interface EffectiveInput {
  /** 调用方显式给出的 agentOptions（工具参数或上游插件）。 */
  explicit?: RouteSpec
  /** 当前会话的选择；缺省表示跟随全局策略。 */
  session?: SessionRecord
  /** 工作区路由表的匹配结果；`path` 缺失表示命中的是全局 default。 */
  workspace?: { spec: RouteSpec; path?: string }
  /** 全局默认策略；缺省按 'rules' 处理，保持未配置时的既有行为。 */
  defaultPolicy?: RouteDefaultPolicy
}

/** 一个 RouteSpec 是否为空（没有任何会被注入的字段）。 */
export function isEmptyRoute(spec: RouteSpec | undefined): boolean {
  return (
    spec === undefined ||
    (spec.provider === undefined && spec.model === undefined && spec.reasoningEffort === undefined)
  )
}

/**
 * 调用方是否「点名了路由」。
 *
 * 任一侧给了 provider 或 model 都算：调用方已经表态要自己决定模型。
 * 换掉其中一半会让请求落进一个不存在的组合，因此整体让位而不是补另一半。
 */
export function isRoutePinned(spec: RouteSpec | undefined): boolean {
  return spec?.provider !== undefined || spec?.model !== undefined
}

/**
 * 取该层的增量：调用方给过的字段不重复注入。
 *
 * 会话指定/工作区规则里的 provider+model 与调用方的思考等级可以共存——
 * 它们是模型上互不冲突的两个维度；反过来，调用方点名的模型连等级也不覆盖，
 * 因为那是为另一套模型配的等级，套上去可能不被支持。
 */
function deltaOf(spec: RouteSpec, explicit: RouteSpec | undefined): RouteSpec {
  return {
    ...(explicit?.provider === undefined && spec.provider !== undefined ? { provider: spec.provider } : {}),
    ...(explicit?.model === undefined && spec.model !== undefined ? { model: spec.model } : {}),
    ...(explicit?.reasoningEffort === undefined && spec.reasoningEffort !== undefined
      ? { reasoningEffort: spec.reasoningEffort }
      : {}),
  }
}

/**
 * 计算一次派活应当注入的路由增量。
 *
 * 返回 `undefined` 表示不做任何改写：调用方自己决定了模型、会话选择继承主代理模型，
 * 或全局策略是继承且没有任何更具体的层给出内容。
 */
export function resolveEffective(input: EffectiveInput): EffectiveRoute | undefined {
  const { explicit, session, workspace, defaultPolicy = 'rules' } = input

  // 调用方点名了 provider/model：整体让位。
  if (isRoutePinned(explicit)) return undefined

  // 会话选择：用户在控制台里刚做的决定，排在全局策略与项目规则之前。
  if (session?.mode === 'inherit') return undefined
  if (session?.mode === 'custom') {
    const spec = deltaOf(session, explicit)
    if (!isEmptyRoute(spec)) return { source: 'session', spec }
  }

  // 全局策略为继承：不查路由表，子代理直接拿到主代理的模型。
  if (defaultPolicy === 'inherit') return undefined

  if (workspace !== undefined && !isEmptyRoute(workspace.spec)) {
    const spec = deltaOf(workspace.spec, explicit)
    if (!isEmptyRoute(spec)) {
      return {
        source: workspace.path === undefined ? 'fallback' : 'workspace',
        spec,
        ...(workspace.path === undefined ? {} : { workspacePath: workspace.path }),
      }
    }
  }

  return undefined
}

/** 来源的稳定排序键：面板按优先级从高到低展示候选。 */
export const SOURCE_ORDER: readonly EffectiveSource[] = ['caller', 'session', 'workspace', 'fallback', 'inherit']

/** 规范化一份会话指定：去空白、拒绝半套路由、全空视为「没有指定」。 */
export function normalizeOverride(spec: RouteSpec): RouteSpec | undefined {
  const provider = spec.provider?.trim() || undefined
  const model = spec.model?.trim() || undefined
  const reasoningEffort = spec.reasoningEffort?.trim() || undefined
  if ((provider === undefined) !== (model === undefined)) {
    throw new Error('provider 与 model 必须同时提供或同时留空')
  }
  if (provider === undefined && model === undefined && reasoningEffort === undefined) return undefined
  return {
    ...(provider === undefined ? {} : { provider }),
    ...(model === undefined ? {} : { model }),
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
  }
}

/**
 * 把「模式 + 指定值」规范化成一条会话记录。
 *
 * `follow` 与空 `custom` 都表示回到跟随全局策略，返回 undefined；
 * `inherit` 不接受任何指定值——那样的记录自己否认自己。
 */
export function normalizeSessionRecord(mode: SessionMode, spec?: RouteSpec | null): SessionRecord | undefined {
  const given = spec !== null && spec !== undefined && !isEmptyRoute(spec)
  if (mode === 'follow') {
    if (given) throw new Error('跟随全局策略时不能同时指定 provider / model / reasoningEffort')
    return undefined
  }
  if (mode === 'inherit') {
    if (given) throw new Error('继承主代理模型时不能同时指定 provider / model / reasoningEffort')
    return { mode: 'inherit' }
  }
  if (mode !== 'custom') {
    throw new Error(`未知的会话模式 "${String(mode)}"`)
  }
  const normalized = normalizeOverride(spec ?? {})
  if (normalized === undefined) return undefined
  return { mode: 'custom', ...normalized }
}
