/**
 * 会话级路由覆盖的优先级判定。
 *
 * 三层来源，从高到低：调用方显式参数 > 会话覆盖 > 工作区路由表。
 * 最终注入的字段一律是「调用方没给过的那些」——调用方给过的字段永远不被改写，
 * 因此这里返回的是一份**增量**，由 mergeAgentOptions 原样合并进请求。
 *
 * 宿主用它决定注入什么，客户端用它解释「为什么是这个结果」，两侧共用同一份判定，
 * 避免各自实现一套优先级而悄悄分叉。
 */

import type { RouteSpec } from './yaml-utils'

/** 生效来源，按优先级从高到低。 */
export type EffectiveSource = 'caller' | 'session' | 'workspace' | 'fallback' | 'inherit'

/** 一条会话覆盖：路由字段加上最近写入时间，后者用于淘汰超限会话。 */
export interface SessionOverride extends RouteSpec {
  updatedAt: number
}

/** 会话 id → 该会话的覆盖。 */
export type OverrideTable = Readonly<Record<string, SessionOverride>>

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
  /** 当前会话的覆盖。 */
  override?: RouteSpec
  /** 工作区路由表的匹配结果；`path` 缺失表示命中的是全局 default。 */
  workspace?: { spec: RouteSpec; path?: string }
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
 * 会话覆盖/工作区规则里的 provider+model 与调用方的思考等级可以共存——
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
 * 返回 `undefined` 表示不做任何改写：调用方自己决定了模型，或三层都没有可用内容。
 */
export function resolveEffective(input: EffectiveInput): EffectiveRoute | undefined {
  const { explicit, override, workspace } = input

  // 调用方点名了 provider/model：整体让位。
  if (isRoutePinned(explicit)) return undefined

  // 会话覆盖：用户刚在控制台里做的决定，排在项目规则之前。
  if (!isEmptyRoute(override)) {
    const spec = deltaOf(override as RouteSpec, explicit)
    if (!isEmptyRoute(spec)) return { source: 'session', spec }
  }

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

/**
 * 规范化一份覆盖：去空白、拒绝半套路由、全空视为「清除」。
 *
 * provider 与 model 必须成对出现：只有一半的覆盖会让派活落进一个无法解析的模型 id。
 */
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
