/**
 * 子智能体路由：按父会话的当前工作目录，为子代理注入 provider / model / 思考等级。
 *
 * 所有创建子代理的入口（subagent、subagent_fork、workflow、agent-team、
 * 具名子代理库）最终都调用 `ctx.subagents.startActivation`，因此只需在这一处
 * 介入，就能统一覆盖全部派活路径，而不用改 DSH 本体的任何一个包。
 *
 * 优先级：调用方显式指定 > 当前会话覆盖 > 工作区路由 > 父会话继承。
 * 会话覆盖来自右侧栏控制台，存放在独立的 JSON 文件里，只作用于该会话后续派出的子代理；
 * 已在运行的子代理不受影响。合并后仍会经过 llm 的路由预检，非法路由在派活处直接失败，
 * 不会污染子会话。
 */

import { symbols, type Context } from '@deepseek-ai/cordis'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { Config, resolveConfig, type ResolvedConfig } from './config'
import { loadRouteTable, matchRouteWithPath, RouteTableError, type RouteSpec, type RouteTable } from './routes'
import { buildCatalogFromLlm, registerSettings, type LlmCatalogService } from './settings-api'
import { OverrideStore } from './overrides'
import { registerSessionApi, type SessionLookup } from './session-api'
import { resolveEffective } from '../shared/overrides'
import type { RouteDefaultPolicy, SessionRecord } from '../shared/overrides'

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
  readonly id?: string
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

/** 会话选择读取面；宿主每次派活都重读，保证控制台的修改立刻可见。 */
export interface OverrideSource {
  get(sessionId: string): SessionRecord | undefined
}

/**
 * 计算需要注入的路由字段。
 *
 * 返回 undefined 表示应当完全让位、不做任何改写：
 * - 调用方已经点名 provider/model；
 * - 会话选择了继承主代理模型，或全局策略要求继承；
 * - 工作区路由与会话选择都没有匹配，或它们要补的字段调用方都已显式给过。
 */
export function routeOverride(
  explicit: AgentOptionsLike | undefined,
  table: RouteTable,
  directory: string,
  session?: SessionRecord,
  defaultPolicy: RouteDefaultPolicy = 'rules',
): RouteSpec | undefined {
  return resolveEffective({
    explicit: explicit as RouteSpec | undefined,
    ...(session === undefined ? {} : { session }),
    workspace: matchRouteWithPath(table, directory),
    defaultPolicy,
  })?.spec
}

/**
 * current 来自派活请求，属于调用方显式选项，而不是父会话继承值。
 * resolveEffective 已让位显式字段；父会话等级是否继承由 DSH 在后续解析时决定。
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

/** 读取父会话 id；会话没有 id 时返回 undefined，覆盖层随之失效。 */
export function resolveSessionId(request: ActivationRequest): string | undefined {
  const id = request.parent?.session?.id
  return typeof id === 'string' && id !== '' ? id : undefined
}

export interface ApplyOptions {
  /** 会话覆盖读取面；缺省时由插件自建（指向 DSH_HOME 下的固定文件）。 */
  overrides?: OverrideSource
  /** 覆盖文件路径；仅测试与自定义部署使用。 */
  overridesFile?: string
}

/**
 * 默认覆盖文件位置：与路由表同目录，避免把一个插件的状态散到两处。
 */
function defaultOverridesFile(routesFile: string): string {
  return join(dirname(routesFile), 'subagent-routes.overrides.json')
}

/** sessions 服务的最小接口：按 id 取会话，再读它的当前工作目录。 */
interface SessionsService {
  get(id: string): SessionLike | undefined
}

/**
 * 把宿主服务封装成会话目录查询面。
 *
 * 目录优先取 workingDirectory 投影（含 `cd` 之后的当前位置），回落到会话头——
 * 与派活路径上的 resolveDirectory 保持同一口径，否则控制台显示的目录
 * 会和实际派活时用的目录不是同一个。
 */
function createLookup(ctx: Context): SessionLookup | undefined {
  const sessions = ctx.get('sessions') as SessionsService | undefined
  if (sessions === undefined || typeof sessions.get !== 'function') return undefined
  return {
    directory(sessionId: string): string | undefined {
      const session = sessions.get(sessionId)
      if (session === undefined) return undefined
      const workingDirectory = ctx.get('workingDirectory') as WorkingDirectoryService | undefined
      return workingDirectory?.get(session) ?? session.header?.cwd
    },
  }
}

export function apply(ctx: Context, rawConfig?: unknown, options: ApplyOptions = {}): void {
  const config: ResolvedConfig = resolveConfig(rawConfig)
  const overridesFile = options.overridesFile ?? defaultOverridesFile(config.routesFile)
  const store = new OverrideStore(overridesFile)
  const overrides: OverrideSource = options.overrides ?? store

  // 路由关闭时也保留设置入口，以便从插件面板重新启用。
  registerSettings(ctx, rawConfig)

  // 会话面板与控制台 API 始终注册：即使总开关关闭，用户也要能从面板看出「为什么没生效」。
  // lookup 每次查询时现取服务，而不是在此刻定死：apply 与 sessions 的加载顺序由宿主决定，
  // 在 apply 时取不到就永久丢掉会话目录，面板会一直显示「读不到目录」。
  registerSessionApi(ctx, rawConfig, {
    store,
    lookup: {
      directory(sessionId: string): string | undefined {
        return createLookup(ctx)?.directory(sessionId)
      },
    },
    getCatalog: () => buildCatalogFromLlm(ctx.get('llm') as LlmCatalogService | undefined),
  })

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

      const workingDirectory = injected.get('workingDirectory') as WorkingDirectoryService | undefined
      const directory = resolveDirectory(spec.request, workingDirectory)
      const sessionId = resolveSessionId(spec.request)

      // 会话选择独立于路由表：即使路由表读不出来，控制台的选择也应该继续生效。
      const session = sessionId === undefined ? undefined : overrides.get(sessionId)

      const table = readTable()
      // 拿不到目录时仍可应用会话选择：那是按会话而非目录定位的。
      // 全局策略是继承时也不必读表——路由表在这条路径上不会被用到。
      const workspace = table === undefined || directory === undefined
        ? undefined
        : matchRouteWithPath(table, directory)

      const effective = resolveEffective({
        explicit: spec.request.agentOptions as RouteSpec | undefined,
        ...(session === undefined ? {} : { session }),
        ...(workspace === undefined ? {} : { workspace }),
        defaultPolicy: config.fallbackPolicy,
      })
      if (effective === undefined) return spec

      const agentOptions = mergeAgentOptions(spec.request.agentOptions, effective.spec)
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

      const source = effective.source === 'session' ? '会话选择' : effective.workspacePath ?? '全局默认'
      logger.info(
        `subagent-routes: ${source} → ${agentOptions.provider ?? '(继承)'}/${agentOptions.model ?? '(继承)'}` +
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
