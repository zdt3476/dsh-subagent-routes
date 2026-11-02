
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
/**
 * 计算需要注入的路由字段。
 *
 * 返回 undefined 表示应当完全让位、不做任何改写：
 * - 调用方已经点名 provider+model（显式选择优先，连工作区的思考等级也不追加，
 *   因为那是给工作区模型配的等级，套到另一个模型上可能不被支持）；
 * - 路由表没有匹配，或匹配到的字段调用方都已显式给过。
 */
export declare function routeOverride(explicit: AgentOptionsLike | undefined, table: RouteTable, directory: string): RouteSpec | undefined;
/**
 * current 来自派活请求，属于调用方显式选项，而不是父会话继承值。
 * routeOverride 已让位显式字段；父会话等级是否继承由 DSH 在后续解析时决定。
 */
export declare function mergeAgentOptions(current: AgentOptionsLike | undefined, override: RouteSpec): AgentOptionsLike;
/** 读取父会话当前工作目录；拿不到时返回 undefined，插件安静让位。 */
export declare function resolveDirectory(request: ActivationRequest, workingDirectory: WorkingDirectoryService | undefined): string | undefined;
export declare function apply(ctx: Context, rawConfig?: unknown): void;
export {};
//# sourceMappingURL=index.d.ts.map