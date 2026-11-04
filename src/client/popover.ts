/** Portal 脱离输入框裁剪；固定贴锚点边缘，定位不依赖异步内容的高度。 */
import { createElement as h, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { POPOVER_CSS } from './panel-styles'
import { PopoverPanel } from './popover-panel'
import { popoverStore } from './popover-store'
import { popupFrame, type AnchorRect, type PopupFrame, type Side } from './popup-placement'
import type { SessionApi } from './services'

export interface RoutePopoverProps {
  sessionId: string
  api?: SessionApi
}

function anchorElement(sessionId: string): HTMLElement | undefined {
  const trigger = popoverStore.getTrigger(sessionId)
  if (trigger === null || !trigger.isConnected) return undefined
  const card = trigger.closest('[data-composer-card]')
  return card instanceof HTMLElement ? card : trigger
}

export function RoutePopover({ sessionId, api }: RoutePopoverProps): ReactElement | null {
  const [isOpen, setIsOpen] = useState(() => popoverStore.isOpen(sessionId))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<PopupFrame | null>(null)

  useEffect(() => {
    const update = () => setIsOpen(popoverStore.isOpen(sessionId))
    update()
    return popoverStore.subscribe(update)
  }, [sessionId])

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }
    // 每次打开重新判定；只锁本次展开，不把旧会话/旧窗口的方向带到下次。
    let side: Side | undefined
    const reposition = () => {
      const anchor = anchorElement(sessionId)
      if (anchor === undefined) {
        setPosition(null)
        return
      }
      const rect: AnchorRect = anchor.getBoundingClientRect()
      const next = popupFrame(rect, { width: window.innerWidth, height: window.innerHeight }, side)
      side = next.side
      setPosition(previous => previous !== null &&
        previous.left === next.left && previous.top === next.top && previous.bottom === next.bottom &&
        previous.width === next.width && previous.maxHeight === next.maxHeight ? previous : next)
    }
    reposition()
    const observer = new ResizeObserver(reposition)
    const anchor = anchorElement(sessionId)
    if (anchor !== undefined) observer.observe(anchor)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    if (!isOpen) return
    let focused = false
    const focusPreferred = () => {
      if (focused) return
      const node = containerRef.current
      const target = node?.querySelector<HTMLElement>('.srpop-mode[aria-pressed="true"]:not([disabled])') ??
        node?.querySelector<HTMLElement>('.srpop-mode:not([disabled])')
      if (target) {
        target.focus({ preventScroll: true })
        focused = true
      }
    }
    const frame = requestAnimationFrame(focusPreferred)
    const observer = new MutationObserver(focusPreferred)
    if (containerRef.current) observer.observe(containerRef.current, { childList: true, subtree: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      popoverStore.close(sessionId, { restoreFocus: true })
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target || containerRef.current?.contains(target) || popoverStore.getTrigger(sessionId)?.contains(target)) return
      popoverStore.close(sessionId, { restoreFocus: false })
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [isOpen, sessionId])

  if (!isOpen) return null
  const node = h('div', {
    ref: containerRef,
    className: 'sr-popover-portal',
    role: 'dialog',
    'aria-label': '子代理模型配置',
    'aria-modal': 'false',
    'data-side': position?.side,
    style: {
      visibility: position === null ? 'hidden' : 'visible',
      // 外框尺寸与 maxHeight 使用同一 border-box；不再做脆弱的“减 2px”补偿。
      boxSizing: 'border-box', minWidth: 0,
      left: position?.left, top: position?.top, bottom: position?.bottom,
      width: position?.width, maxHeight: position?.maxHeight,
    },
  },
  h('style', null, POPOVER_CSS),
  h(PopoverPanel, {
    key: sessionId,
    sessionId,
    ...(api === undefined ? {} : { api }),
    onClose: () => popoverStore.close(sessionId, { restoreFocus: true }),
  }))
  return typeof document === 'undefined' ? node : createPortal(node, document.body)
}
