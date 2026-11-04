/**
 * 路由状态的统一文案。
 *
 * 胶囊（输入区）和面板（右侧栏）必须对「现在是什么状态」给出同一个说法，
 * 否则用户会看到「继承主代理」点进去却是「全局兜底」这种自相矛盾的两句话。
 * 因此两处共用这里的 `describe` 与 `SOURCE_TEXT`，不再各写一套。
 */

import type { RouteSpec, SessionSnapshot } from '../shared/settings'

export type EffectiveSource = 'caller' | 'session' | 'workspace' | 'fallback' | 'inherit'

/** 来源的中文名与一句话解释；用来回答「为什么是这个模型」。 */
export const SOURCE_TEXT: Record<string, { label: string; hint: string }> = {
  caller: { label: '本次调用指定', hint: '派活方在工具参数里点名了模型，插件的配置没有介入。' },
  session: { label: '本会话指定', hint: '你在本会话里临时指定的配置，优先于项目规则。' },
  workspace: { label: '项目规则', hint: '命中了当前目录的项目路由规则。' },
  fallback: { label: '全局兜底', hint: '没有命中任何项目规则，使用全局默认配置。' },
  inherit: { label: '继承主代理', hint: '没有任何配置介入，子代理直接继承主代理的模型。' },
}

/** 只带思考等级时的文案；单独出现用完整措辞「思考等级 X」。 */
function effortOnly(spec: RouteSpec | undefined): string | undefined {
  return spec?.reasoningEffort === undefined ? undefined : `思考等级 ${spec.reasoningEffort}`
}

/** 与模型并列时只附裸等级值，保持「模型 · high」这种紧凑写法。 */
function effortShort(spec: RouteSpec | undefined): string | undefined {
  return spec?.reasoningEffort
}

/**
 * 生效值的文案：优先「供应商 / 模型」，其次只写思考等级，两者都没有才算继承主代理。
 *
 * 注意这里**不看来源**。来源只决定「为什么」，不代表「有什么」——全局兜底如果
 * 只配了思考等级，生效值就是那个思考等级，而不是「什么都没有」。
 */
export function describe(spec: RouteSpec | undefined): string {
  if (spec === undefined) return '继承主代理'
  const model = spec.provider === undefined || spec.model === undefined
    ? undefined
    : `${spec.provider} / ${spec.model}`
  if (model === undefined) return effortOnly(spec) ?? '继承主代理'
  const effort = effortShort(spec)
  return effort === undefined ? model : `${model} · ${effort}`
}

/**
 * 胶囊与面板共用的完整说法。
 *
 * `label` 说明「用什么」，`sourceLabel` 说明「为什么」，两者拼起来才不会出现
 * 「胶囊说继承、面板说全局兜底」这种矛盾：当来源是 fallback 而兜底配置只设了
 * 思考等级时，两边都会说「思考 高（全局兜底）」。
 */
export function describeRoute(snapshot: SessionSnapshot | null): {
  label: string
  source: string
  sourceLabel: string
  /** 是否由本会话显式改过（用于胶囊的高亮态）；跟随全局策略时为 false。 */
  isOverride: boolean
} {
  if (snapshot === null) {
    return { label: '继承主代理', source: 'inherit', sourceLabel: SOURCE_TEXT.inherit.label, isOverride: false }
  }
  const spec = snapshot.effective?.spec
  const source = snapshot.effective?.source ?? 'inherit'
  return {
    label: describe(spec),
    source,
    sourceLabel: SOURCE_TEXT[source]?.label ?? source,
    // 只有本会话真的改过才高亮：inherit 记录也算改过（它压过了全局策略），
    // 但 follow（没有记录）与「什么都没配」必须长得一样，否则药丸会长期亮着。
    isOverride: snapshot.session !== undefined,
  }
}
