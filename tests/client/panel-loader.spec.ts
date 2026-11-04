import { describe, expect, it, vi } from 'vitest'
import { createSessionLoader, type SessionLoaderHandlers } from '../../src/client/panel-loader'
import type { SessionApi } from '../../src/client/services'
import type { SessionSnapshot } from '../../src/shared/settings'

function snapshot(sessionId: string): SessionSnapshot {
  return {
    sessionId,
    directory: '/work/app',
    tableAvailable: true,
    enabled: true,
    mode: 'follow',
    defaultPolicy: 'rules',
    effective: { source: 'inherit', spec: {} },
  }
}

/** 每次 load 返回一个可手动结算的 promise，用来制造乱序返回。 */
function deferredApi(): {
  api: SessionApi
  resolve: (index: number, value: SessionSnapshot) => void
  reject: (index: number, error: Error) => void
  pending: () => number
} {
  const settlers: Array<{ resolve: (value: SessionSnapshot) => void; reject: (error: Error) => void }> = []
  const api: SessionApi = {
    load: vi.fn((_sessionId: string) => new Promise<SessionSnapshot>((resolve, reject) => {
      settlers.push({ resolve, reject })
    })),
    save: vi.fn(),
    freeze: vi.fn(),
  }
  return {
    api,
    resolve: (index, value) => settlers[index].resolve(value),
    reject: (index, error) => settlers[index].reject(error),
    pending: () => settlers.length,
  }
}

function handlers(): SessionLoaderHandlers & { snaps: string[]; errors: string[]; settled: number } {
  const snaps: string[] = []
  const errors: string[] = []
  const state = { settled: 0 }
  return {
    snaps,
    errors,
    get settled() { return state.settled },
    onSnapshot: next => snaps.push(next.sessionId),
    onError: message => errors.push(message),
    onSettled: () => { state.settled += 1 },
  }
}

describe('侧栏面板读取时序', () => {
  it('乱序返回时只采纳最后一次读取', async () => {
    const { api, resolve } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)

    const first = loader.load()
    const second = loader.load()
    // 第二次先回，第一次后回：后回的旧结果不得覆盖新结果。
    resolve(1, snapshot('new'))
    await second
    resolve(0, snapshot('old'))
    await first
    expect(h.snaps).toEqual(['new'])
  })

  it('静默同步不进入加载态，也不复位忙碌中的按钮', async () => {
    const { api, resolve } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)

    const silent = loader.load({ silent: true })
    resolve(0, snapshot('s1'))
    await silent
    expect(h.snaps).toEqual(['s1'])
    expect(h.settled).toBe(0)
  })

  it('静默同步失败不报错，非静默失败上报', async () => {
    const { api, reject } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)

    const silent = loader.load({ silent: true })
    reject(0, new Error('静默失败'))
    await silent
    expect(h.errors).toEqual([])

    const loud = loader.load()
    reject(1, new Error('读取失败'))
    await loud
    expect(h.errors).toEqual(['读取失败'])
    expect(h.settled).toBe(1)
  })

  it('作废后旧会话的结果被丢弃，且不误报错误', async () => {
    const { api, resolve, reject } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)

    const stale = loader.load()
    loader.invalidate()
    resolve(0, snapshot('s1'))
    await stale
    expect(h.snaps).toEqual([])

    const staleError = loader.load()
    loader.invalidate()
    reject(1, new Error('会话已切换'))
    await staleError
    expect(h.errors).toEqual([])
  })

  it('切换会话后新的读取正常生效', async () => {
    const { api, resolve } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)

    loader.invalidate()
    const fresh = loader.load()
    resolve(0, snapshot('s2'))
    await fresh
    expect(h.snaps).toEqual(['s2'])
    expect(loader.isCurrent(1)).toBe(true)
    expect(loader.isCurrent(0)).toBe(false)
  })

  it('写入通知订阅在退订后不再回调', () => {
    const { api } = deferredApi()
    const h = handlers()
    const loader = createSessionLoader(api, 's1', () => h)
    const listeners = new Set<() => void>()
    ;(api as { subscribe?: (listener: () => void) => () => void }).subscribe = listener => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }
    const notify = vi.fn()
    const unsubscribe = loader.subscribe(notify)
    for (const listener of listeners) listener()
    expect(notify).toHaveBeenCalledTimes(1)
    unsubscribe()
    for (const listener of listeners) listener()
    expect(notify).toHaveBeenCalledTimes(1)
  })
})
