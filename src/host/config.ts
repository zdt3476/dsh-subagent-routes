/**
 * 插件配置。
 *
 * 所有可调项都放在 Cordis Config 里，用户在自己的 profile patch 中按 id 覆盖；
 * 这样 DSH 升级时用户配置不会被冲掉。代码不读环境变量以外的隐式默认。
 */

import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import z from '@deepseek-ai/schemastery'
import type { RouteDefaultPolicy } from '../shared/overrides'
import { normalizePath } from './routes'

/** 未显式配置时使用的路由表路径：跟随 DSH home。 */
export function defaultRoutesFile(): string {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'subagent-routes.yaml')
}

/**
 * 默认策略的默认值。
 *
 * 取 'rules' 是有意为之：既有用户已经按目录配了规则，升级后若默认改成「继承」
 * 会让他们的规则突然失效，属于不可接受的静默行为变化。
 */
export const DEFAULT_FALLBACK_POLICY: RouteDefaultPolicy = 'rules'

export interface ResolvedConfig {
  /** 路由表 YAML 路径；空字符串表示用默认位置。 */
  routesFile: string
  /** 总开关；关闭时完全不介入子代理创建。 */
  enabled: boolean
  /** 注入前是否向 llm 预检路由，路由不合法时在派活处直接失败。 */
  preflight: boolean
  /** 没有任何规则命中时：继承主代理模型，还是照常按路由表给通用子代理模型。 */
  fallbackPolicy: RouteDefaultPolicy
}

export const Config = z.object({
  routesFile: z.string().default(''),
  enabled: z.boolean().default(true),
  preflight: z.boolean().default(true),
  fallbackPolicy: z.union([z.const('inherit'), z.const('rules')]).default(DEFAULT_FALLBACK_POLICY),
})

export function resolveConfig(raw?: unknown): ResolvedConfig {
  const source = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const configured = typeof source.routesFile === 'string' ? source.routesFile.trim() : ''
  const homeRelative = configured === '~' || configured.startsWith('~/') || configured.startsWith(`~${sep}`)
  return {
    routesFile: configured === '' ? defaultRoutesFile() : homeRelative ? normalizePath(configured) : configured,
    enabled: source.enabled !== false,
    preflight: source.preflight !== false,
    // 配置是手改的 YAML：写错一个词不该让整条派活路径静默走错策略，落回默认值并保持可解释。
    fallbackPolicy: source.fallbackPolicy === 'inherit' ? 'inherit' : DEFAULT_FALLBACK_POLICY,
  }
}
