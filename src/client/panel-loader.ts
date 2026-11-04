/**
 * 面板读取会话快照的时序控制。
 *
 * 面板同时面对三种并发来源：会话切换、用户手动刷新、写入成功后的后台同步。
 * 三者共用一条规则——只采纳最后一次读取的结果；规则本身是纯逻辑，抽出来单独
 * 测试，免得只能靠渲染结果间接验证。
 */

import type { SessionSnapshot } from '../shared/settings'
import type { SessionApi } from './services'

export interface LoadOptions {
  /** 后台同步：保留现有内容，不进入加载态，也不上报失败。 */
  silent?: boolean
}

export interface SessionLoaderHandlers {
  /** 收到可用快照；只在仍是最后一次读取时调用。 */
  onSnapshot: (next: SessionSnapshot) => void
  /** 读取失败；静默模式不会调用。 */
  onError: (message: string) => void
  /** 一次非静默读取结束（成功、失败或作废后都会调用）。 */
  onSettled: () => void
}

export interface SessionLoader {
  load: (options?: LoadOptions) => Promise<void>
  /**
   * 作废在途读取并开启新一轮。
   * 返回新代次，写入类操作据此判断自己的结果是否已被更新的动作取代。
   */
  invalidate: () => number
  isCurrent: (token: number) => boolean
  subscribe: (listener: () => void) => () => void
}

/**
 * @param api 数据面。
 * @param sessionId 当前会话；换会话必须重建 loader（由调用方保证）。
 * @param handlers 每次渲染刷新，loader 本身跨渲染稳定。
 */
export function createSessionLoader(
  api: SessionApi,
  sessionId: string,
  handlers: () => SessionLoaderHandlers,
): SessionLoader {
  // 会话代次：切换会话后旧会话的结果一律丢弃。
  let generation = 0
  // 读取票号：同一会话内只采纳最后一次读取。
  let ticket = 0
  let controller: AbortController | undefined

  const invalidate = (): number => {
    generation += 1
    controller?.abort()
    controller = undefined
    return generation
  }

  const isCurrent = (token: number): boolean => token === generation

  const load = async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true
    const token = generation
    const mine = ++ticket
    controller?.abort()
    const current = new AbortController()
    controller = current
    try {
      const next = await api.load(sessionId, current.signal)
      if (token === generation && mine === ticket) handlers().onSnapshot(next)
    } catch (cause) {
      // 主动取消不是失败。
      if (current.signal.aborted) return
      if (token !== generation || mine !== ticket) return
      if (!silent) handlers().onError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      // 静默同步不该复位忙碌态：它本来就没把界面切进加载中。
      if (token === generation && !silent) handlers().onSettled()
    }
  }

  const subscribe = (listener: () => void): (() => void) => {
    const unsubscribe = api.subscribe?.(listener)
    return () => { unsubscribe?.() }
  }

  return { load, invalidate, isCurrent, subscribe }
}
