import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { popoverStore } from '../../src/client/popover-store'
import { RoutePopover } from '../../src/client/popover'
import type { SessionSnapshot } from '../../src/shared/settings'
import type { SessionApi } from '../../src/client/services'

function mockSnapshot(sessionId: string): SessionSnapshot {
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

function mockApi(): SessionApi {
  return {
    load: vi.fn(async id => mockSnapshot(id)),
    save: vi.fn(async () => mockSnapshot('s1')),
    freeze: vi.fn(async () => mockSnapshot('s1')),
  }
}

describe('popoverStore 状态管理', () => {
  beforeEach(() => {
    popoverStore.close()
  })

  it('初始状态无会话打开浮层', () => {
    expect(popoverStore.getOpenedSessionId()).toBeNull()
    expect(popoverStore.isOpen('s1')).toBe(false)
  })

  it('open 打开指定会话，并保证多会话互斥', () => {
    popoverStore.open('s1')
    expect(popoverStore.getOpenedSessionId()).toBe('s1')
    expect(popoverStore.isOpen('s1')).toBe(true)
    expect(popoverStore.isOpen('s2')).toBe(false)

    // 打开 s2 自动顶替 s1
    popoverStore.open('s2')
    expect(popoverStore.getOpenedSessionId()).toBe('s2')
    expect(popoverStore.isOpen('s1')).toBe(false)
    expect(popoverStore.isOpen('s2')).toBe(true)
  })

  it('close 关闭指定会话或当前会话', () => {
    popoverStore.open('s1')
    // 如果关闭其他会话，不影响当前已打开的 s1
    popoverStore.close('s2')
    expect(popoverStore.isOpen('s1')).toBe(true)

    // 正确关闭 s1
    popoverStore.close('s1')
    expect(popoverStore.isOpen('s1')).toBe(false)
    expect(popoverStore.getOpenedSessionId()).toBeNull()
  })

  it('toggle 切换开关状态', () => {
    popoverStore.toggle('s1')
    expect(popoverStore.isOpen('s1')).toBe(true)

    // 再次对同一会话 toggle 则关闭
    popoverStore.toggle('s1')
    expect(popoverStore.isOpen('s1')).toBe(false)

    // toggle 另一会话则打开另一会话
    popoverStore.toggle('s2')
    expect(popoverStore.isOpen('s2')).toBe(true)
  })

  it('订阅机制正常派发通知，并在取消订阅后停止派发', () => {
    const listener = vi.fn()
    const unsubscribe = popoverStore.subscribe(listener)

    popoverStore.open('s1')
    expect(listener).toHaveBeenCalledTimes(1)

    popoverStore.close('s1')
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    popoverStore.open('s1')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('支持记录触发器并在关闭时尝试恢复焦点', () => {
    const focusSpy = vi.fn()
    const fakeTrigger = { focus: focusSpy } as unknown as HTMLElement

    popoverStore.open('s1', fakeTrigger)
    expect(popoverStore.getTrigger('s1')).toBe(fakeTrigger)

    // restoreFocus: false 不触发聚焦
    popoverStore.close('s1', { restoreFocus: false })
    expect(focusSpy).not.toHaveBeenCalled()
  })
})

describe('RoutePopover 渲染', () => {
  beforeEach(() => {
    popoverStore.close()
  })

  it('未打开时 RoutePopover 返回 null，不污染 DOM', () => {
    const html = renderToStaticMarkup(h(RoutePopover, { sessionId: 's1', api: mockApi() }))
    expect(html).toBe('')
  })

  it('打开时渲染 portal 容器与无障碍标记', () => {
    popoverStore.open('s1')
    const html = renderToStaticMarkup(h(RoutePopover, { sessionId: 's1', api: mockApi() }))
    expect(html).toContain('role="dialog"')
    // 容器改为 fixed 定位的 portal，不再依赖 composer 内的绝对定位锚点
    expect(html).toContain('sr-popover-portal')
    expect(html).toContain('aria-label="子代理模型配置"')
    // SSR 渲染没有 document，退回普通渲染，不应包进任何 composer 定位上下文
    expect(html).not.toContain('sr-popover-anchor')
  })

  it('浮层面板首帧渲染骨架而非依赖宿主快照', () => {
    popoverStore.open('s1')
    const html = renderToStaticMarkup(h(RoutePopover, { sessionId: 's1', api: mockApi() }))
    expect(html).toContain('srpop')
    expect(html).toContain('srpop-skeleton')
  })
})
