/**
 * 输入区就地浮层面板的状态管理。
 *
 * 需求与设计取舍：
 * 1. 浮层面板挂在宿主 `conversation.input.overlay` 槽位，药丸挂在 `conversation.input.right`；
 * 2. 两个槽位是兄弟/不同分支节点，无法单纯依靠父子组件的 state 传参，因此采用轻量模块级 store；
 * 3. 同一时刻最多只有一个会话的浮层处于打开状态；切换会话或关闭时互斥；
 * 4. 记录触发药丸的 DOM 元素，关闭浮层后将焦点还给药丸，保证键盘可访问性（WCAG）。
 */

export interface PopoverStore {
  getOpenedSessionId(): string | null
  isOpen(sessionId: string): boolean
  open(sessionId: string, trigger?: HTMLElement | null): void
  close(sessionId?: string, options?: { restoreFocus?: boolean }): void
  toggle(sessionId: string, trigger?: HTMLElement | null): void
  getTrigger(sessionId: string): HTMLElement | null
  subscribe(listener: () => void): () => void
}

class SessionPopoverStore implements PopoverStore {
  private openedId: string | null = null
  private readonly triggers = new Map<string, HTMLElement>()
  private readonly listeners = new Set<() => void>()

  getOpenedSessionId(): string | null {
    return this.openedId
  }

  isOpen(sessionId: string): boolean {
    return this.openedId === sessionId
  }

  open(sessionId: string, trigger?: HTMLElement | null): void {
    if (trigger) {
      this.triggers.set(sessionId, trigger)
    }
    if (this.openedId === sessionId) return
    this.openedId = sessionId
    this.notify()
  }

  close(sessionId?: string, options?: { restoreFocus?: boolean }): void {
    // 若指定了 sessionId，只在当前打开的正是该会话时才关闭，避免误关其他会话新打开的浮层
    if (sessionId !== undefined && this.openedId !== sessionId) return
    if (this.openedId === null) return

    const closingSession = this.openedId
    const trigger = this.triggers.get(closingSession)
    this.openedId = null
    this.notify()

    if (options?.restoreFocus !== false && trigger !== undefined && typeof trigger.focus === 'function') {
      const restore = (): void => {
        try {
          trigger.focus({ preventScroll: true })
        } catch {
          // 忽略已从 DOM 脱落时的聚焦异常
        }
      }
      // 避免在同一微任务内 DOM 结构突变导致焦点丢失。
      // rAF 在无 DOM 环境（SSR / 纯函数渲染测试）里不存在，直接同步聚焦即可。
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore)
      else restore()
    }
  }

  toggle(sessionId: string, trigger?: HTMLElement | null): void {
    if (trigger) {
      this.triggers.set(sessionId, trigger)
    }
    if (this.openedId === sessionId) {
      this.close(sessionId)
    } else {
      this.open(sessionId, trigger)
    }
  }

  getTrigger(sessionId: string): HTMLElement | null {
    return this.triggers.get(sessionId) ?? null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        console.error('[subagent-routes] popover listener error', error)
      }
    }
  }
}

export const popoverStore: PopoverStore = new SessionPopoverStore()
