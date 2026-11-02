/**
 * 插件配置。
 *
 * 所有可调项都放在 Cordis Config 里，用户在自己的 profile patch 中按 id 覆盖；
 * 这样 DSH 升级时用户配置不会被冲掉。代码不读环境变量以外的隐式默认。
 */

import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import z from '@deepseek-ai/schemastery'
import { normalizePath } from './routes'

/** 未显式配置时使用的路由表路径：跟随 DSH home。 */
export function defaultRoutesFile(): string {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'subagent-routes.yaml')
}

export interface ResolvedConfig {
  /** 路由表 YAML 路径；空字符串表示用默认位置。 */
  routesFile: string
  /** 总开关；关闭时完全不介入子代理创建。 */
  enabled: boolean
  /** 注入前是否向 llm 预检路由，路由不合法时在派活处直接失败。 */
  preflight: boolean
}

export const Config = z.object({
  routesFile: z.string().default(''),
  enabled: z.boolean().default(true),
  preflight: z.boolean().default(true),
})

export function resolveConfig(raw?: unknown): ResolvedConfig {
  const source = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const configured = typeof source.routesFile === 'string' ? source.routesFile.trim() : ''
  const homeRelative = configured === '~' || configured.startsWith('~/') || configured.startsWith(`~${sep}`)
  return {
    routesFile: configured === '' ? defaultRoutesFile() : homeRelative ? normalizePath(configured) : configured,
    enabled: source.enabled !== false,
    preflight: source.preflight !== false,
  }
}
