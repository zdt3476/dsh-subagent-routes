/**
 * 工作区级子智能体路由：按父会话的当前工作目录，为子代理注入 provider / model / 思考等级。
 *
 * 所有创建子代理的入口（subagent、subagent_fork、workflow、agent-team、
 * 具名子代理库）最终都调用 `ctx.subagents.startActivation`，因此只需在这一处
 * 介入，就能统一覆盖全部派活路径，而不用改 DSH 本体的任何一个包。
 *
 * 优先级：调用方显式指定 > 工作区路由 > 父会话继承。
 * 合并后仍会经过 llm 的路由预检，非法路由在派活处直接失败，不会污染子会话。
 */

import { symbols, type Context } from '@deepseek-ai/cordis'
import { isAbsolute, resolve } from 'node:path'
import { Config, resolveConfig, type ResolvedConfig } from './config'
import { loadRouteTable, matchRoute, RouteTableError, type RouteSpec, type RouteTable } from './routes'
import { registerSettings } from './settings-api'

export { Config }

/** startActivation 的最小结构；只描述本插件读写的字段，避免依赖未导出的类型。 */
interface ActivationSpec {
  readonly provider: string
  readonly label?: string
  readonly childId?: unknown
  readonly request: ActivationRequest
  readonly signal?: AbortSignal
  readonly delivery?: 'parent' | 'caller'
}

interface ActivationRequest {
  readonly cwd?: string
  readonly parent: AgentLike
  readonly prompt?: unknown
  readonly agentOptions?: AgentOptionsLike
  readonly [key: string]: unknown
}

interface AgentLike {
  readonly session?: SessionLike
}

interface SessionLike {
  readonly header?: { readonly cwd?: string }
}

/** 子代理的 LLM 选项；只关心本插件会写的三个字段。 */
interface AgentOptionsLike {
  readonly provider?: string
  readonly model?: string
  readonly reasoningEffort?: string
  readonly [key: string]: unknown
}

/** subagents 服务上本插件需要的最小接口。 */
interface SubagentsService {
  startActivation(spec: ActivationSpec): Promise<unknown>
}

/** workingDirectory 服务的最小接口。 */
interface WorkingDirectoryService {
  get(session: SessionLike): string
}

/** llm 服务的最小接口，仅用其路由预检。 */
interface LlmService {
  resolveCallConfig(
    config: { provider: string; model: string; reasoningEffort?: string },
    signal?: AbortSignal,
  ): Promise<unknown>
}

/**
 * 计算需要注入的路由字段。
 *
 * 返回 undefined 表示应当完全让位、不做任何改写：
 * - 调用方已经点名 provider+model（显式选择优先，连工作区的思考等级也不追加，
 *   因为那是给工作区模型配的等级，套到另一个模型上可能不被支持）；
 * - 路由表没有匹配，或匹配到的字段调用方都已显式给过。
 */
export function routeOverride(
  explicit: AgentOptionsLike | undefined,
  table: RouteTable,
  directory: string,
): RouteSpec | undefined {
  const route = matchRoute(table, directory)
  if (route === undefined) return undefined

  const hasExplicitRoute = explicit?.provider !== undefined || explicit?.model !== undefined
  if (hasExplicitRoute) return undefined

  const provider = route.provider
  const model = route.model
  const reasoningEffort = explicit?.reasoningEffort !== undefined ? undefined : route.reasoningEffort

  if (provider === undefined && model === undefined && reasoningEffort === undefined) return undefined
  return {
    ...(provider === undefined ? {} : { provider }),
    ...(model === undefined ? {} : { model }),
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
  }
}

/**
 * current 来自派活请求，属于调用方显式选项，而不是父会话继承值。
 * routeOverride 已让位显式字段；父会话等级是否继承由 DSH 在后续解析时决定。
 */
export function mergeAgentOptions(current: AgentOptionsLike | undefined, override: RouteSpec): AgentOptionsLike {
  return { ...current, ...override }
}

/** 读取父会话当前工作目录；拿不到时返回 undefined，插件安静让位。 */
export function resolveDirectory(
  request: ActivationRequest,
  workingDirectory: WorkingDirectoryService | undefined,
): string | undefined {
  const explicit = request.cwd
  if (explicit !== undefined && isAbsolute(explicit)) return resolve(explicit)
  const session = request.parent?.session
  // 优先用 workingDirectory 投影（含 `cd` 之后的当前目录），回落到会话头的原始项目目录。
  const current = session === undefined ? undefined : (workingDirectory?.get(session) ?? session.header?.cwd)
  if (current === undefined) return undefined
  return explicit === undefined ? current : resolve(current, explicit)
}

export function apply(ctx: Context, rawConfig?: unknown): void {
  // 路由关闭时也保留设置入口，以便从插件面板重新启用。
  registerSettings(ctx, rawConfig)
  const config: ResolvedConfig = resolveConfig(rawConfig)
  if (!config.enabled) return

  const logger = ctx.logger
  ctx.inject(['subagents'], (injected: Context) => {
    // ctx.get 返回的是 cordis 的 traceable 代理，必须取回真实实例再拦原型方法：
    // 只有真实实例上的自有属性才会被所有调用方（含并发派活）看到。
    const proxy = injected.get('subagents') as SubagentsService | undefined
    const service = (proxy as { [symbols.original]?: SubagentsService } | undefined)?.[symbols.original]
    if (service === undefined || typeof service.startActivation !== 'function') {
      logger.warn('subagent-routes: subagents.startActivation 不可用，插件不生效')
      return
    }

    /** 每次派活都重读路由表：改 YAML 即生效，不需要重启 DSH。 */
    const readTable = (): RouteTable | undefined => {
      try {
        return loadRouteTable(config.routesFile)
      } catch (error) {
        const message = error instanceof RouteTableError ? error.message : String(error)
        logger.warn(`subagent-routes: ${message}（本次派活按无路由处理）`)
        return undefined
      }
    }

    const original = service.startActivation

    const routeSpec = async (spec: ActivationSpec): Promise<ActivationSpec> => {
      if (spec === null || typeof spec !== 'object' || spec.request === null) return spec
      const table = readTable()
      if (table === undefined) return spec

      const workingDirectory = injected.get('workingDirectory') as WorkingDirectoryService | undefined
      const directory = resolveDirectory(spec.request, workingDirectory)
      if (directory === undefined) return spec

      const override = routeOverride(spec.request.agentOptions, table, directory)
      if (override === undefined) return spec

      const agentOptions = mergeAgentOptions(spec.request.agentOptions, override)
      if (config.preflight && agentOptions.provider !== undefined && agentOptions.model !== undefined) {
        const llm = injected.get('llm') as LlmService | undefined
        if (llm !== undefined) {
          // 预检把「模型不存在 / 思考等级不支持」提前到派活处，避免子会话起来后每一轮都失败。
          await llm.resolveCallConfig(
            {
              provider: agentOptions.provider,
              model: agentOptions.model,
              ...(agentOptions.reasoningEffort === undefined ? {} : { reasoningEffort: agentOptions.reasoningEffort }),
            },
            spec.signal,
          )
        }
      }

      logger.info(
        `subagent-routes: ${directory} → ${agentOptions.provider ?? '(继承)'}/${agentOptions.model ?? '(继承)'}` +
          `${agentOptions.reasoningEffort === undefined ? '' : ` @${agentOptions.reasoningEffort}`}`,
      )
      return { ...spec, request: { ...spec.request, agentOptions } }
    }

    let active = true
    const patched = async (spec: ActivationSpec): Promise<unknown> => {
      // 其他插件可能保留此包装的引用；卸载后也必须停止介入。
      if (!active) return original.call(service, spec)
      const routed = await routeSpec(spec)
      return original.call(service, routed)
    }

    // 用自有属性遮蔽原型方法，不修改原型本身；disposer 删除该属性即回到 DSH 原生。
    if (Object.hasOwn(service, 'startActivation')) {
      logger.warn('subagent-routes: subagents.startActivation 已被其他插件覆盖，本插件让位以避免层层包装')
      return
    }
    ;(service as { startActivation: (spec: ActivationSpec) => Promise<unknown> }).startActivation = patched

    injected.effect(
      () => () => {
        active = false
        if (service.startActivation === patched) delete (service as { startActivation?: unknown }).startActivation
      },
      'subagent-routes.startActivation',
    )
  })
}
