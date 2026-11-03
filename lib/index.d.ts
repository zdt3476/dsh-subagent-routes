
import { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
  routesFile: z<string, string, "defined">;
  enabled: z<boolean, boolean, "defined">;
  preflight: z<boolean, boolean, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
  routesFile: z<string, string, "defined">;
  enabled: z<boolean, boolean, "defined">;
  preflight: z<boolean, boolean, "defined">;
}>>, "plain">;
/**
 * 工作区路由表的读取、校验与前缀匹配。
 *
 * 路由表是插件唯一的事实来源：它不写会话事件、不改 profile，只在派活时
 * 被查询一次。文件不存在视为「没有配置任何路由」，不是错误。
 */
/** 要注入子代理的 LLM 选项；至少有一个字段。 */
interface RouteSpec {
  readonly provider?: string;
  readonly model?: string;
  readonly reasoningEffort?: string;
}
/** 绑定到具体目录的路由条目。 */
interface WorkspaceRoute extends RouteSpec {
  readonly path: string;
}
/** 解析后的路由表：全局兜底与按目录匹配的条目分开保存。 */
interface RouteTable {
  readonly fallback: RouteSpec | undefined;
  readonly routes: readonly WorkspaceRoute[];
}
interface ActivationRequest {
  readonly cwd?: string;
  readonly parent: AgentLike;
  readonly prompt?: unknown;
  readonly agentOptions?: AgentOptionsLike;
  readonly [key: string]: unknown;
}
interface AgentLike {
  readonly session?: SessionLike;
}
interface SessionLike {
  readonly id?: string;
  readonly header?: {
    readonly cwd?: string;
  };
}
/** 子代理的 LLM 选项；只关心本插件会写的三个字段。 */
interface AgentOptionsLike {
  readonly provider?: string;
  readonly model?: string;
  readonly reasoningEffort?: string;
  readonly [key: string]: unknown;
}
/** workingDirectory 服务的最小接口。 */
interface WorkingDirectoryService {
  get(session: SessionLike): string;
}
/** 会话覆盖读取面；宿主每次派活都重读，保证控制台的修改立刻可见。 */
export interface OverrideSource {
  get(sessionId: string): RouteSpec | undefined;
}
/**
 * 计算需要注入的路由字段。
 *
 * 返回 undefined 表示应当完全让位、不做任何改写：
 * - 调用方已经点名 provider/model；
 * - 工作区路由与会话覆盖都没有匹配，或它们要补的字段调用方都已显式给过。
 */
export declare function routeOverride(explicit: AgentOptionsLike | undefined, table: RouteTable, directory: string, override?: RouteSpec): RouteSpec | undefined;
/**
 * current 来自派活请求，属于调用方显式选项，而不是父会话继承值。
 * resolveEffective 已让位显式字段；父会话等级是否继承由 DSH 在后续解析时决定。
 */
export declare function mergeAgentOptions(current: AgentOptionsLike | undefined, override: RouteSpec): AgentOptionsLike;
/** 读取父会话当前工作目录；拿不到时返回 undefined，插件安静让位。 */
export declare function resolveDirectory(request: ActivationRequest, workingDirectory: WorkingDirectoryService | undefined): string | undefined;
/** 读取父会话 id；会话没有 id 时返回 undefined，覆盖层随之失效。 */
export declare function resolveSessionId(request: ActivationRequest): string | undefined;
export interface ApplyOptions {
  /** 会话覆盖读取面；缺省时由插件自建（指向 DSH_HOME 下的固定文件）。 */
  overrides?: OverrideSource;
  /** 覆盖文件路径；仅测试与自定义部署使用。 */
  overridesFile?: string;
}
export declare function apply(ctx: Context, rawConfig?: unknown, options?: ApplyOptions): void;
export {};
//# sourceMappingURL=index.d.ts.map