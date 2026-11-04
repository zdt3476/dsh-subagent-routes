/**
 * 输入区状态指示：一行小字，告诉用户「接下来派出去的子代理会用哪套配置」。
 *
 * 点击就地展开浮层面板（挂载在 conversation.input.overlay）。
 * 当面板关闭后，焦点自动回到该药丸按钮，符合 WCAG AA 键盘可达性标准。
 */

import { createElement as h, Fragment, useEffect, useRef, useState, type ReactElement } from 'react'
import type { SessionSnapshot } from '../shared/settings'
import { CHIP_CSS } from './panel-styles'
import { describeRoute } from './route-text'
import { sessionApi, type SessionApi } from './services'
import { popoverStore } from './popover-store'

export interface RouteStatusChipProps {
  sessionId: string
  /** 点击时的自定义回调；缺省时直接切换就地浮层面板。 */
  onOpen?: () => void
  api?: SessionApi
}

/**
 * 输入区药丸。
 */
export function RouteStatusChip({ sessionId, onOpen, api = sessionApi }: RouteStatusChipProps): ReactElement | null {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(() => popoverStore.isOpen(sessionId))
  const chipRef = useRef<HTMLButtonElement | null>(null)

  // 监听浮层开关状态
  useEffect(() => {
    const checkOpen = () => {
      setIsOpen(popoverStore.isOpen(sessionId))
    }
    checkOpen()
    return popoverStore.subscribe(checkOpen)
  }, [sessionId])

  // 让 store 记住触发按钮的位置，关闭浮层时才能把焦点还回这里。
  // 只在打开时登记：关闭态登记会与 store 里的互斥判定互相触发。
  useEffect(() => {
    if (isOpen && chipRef.current !== null) popoverStore.open(sessionId, chipRef.current)
  }, [sessionId, isOpen])

  useEffect(() => {
    let live = true
    let generation = 0
    let controller: AbortController | undefined
    const refresh = () => {
      const token = ++generation
      controller?.abort()
      controller = new AbortController()
      void api.load(sessionId, controller.signal)
        .then(next => { if (live && token === generation) setSnapshot(next) })
        .catch(() => {
          // 辅助信息不抢注意力：读不到就维持现状，真正的错误在面板说明。
        })
    }
    setSnapshot(null)
    const unsubscribe = api.subscribe?.(refresh)
    refresh()
    return () => {
      live = false
      unsubscribe?.()
      controller?.abort()
    }
  }, [api, sessionId])

  if (snapshot === null) return null

  const { label, sourceLabel, isOverride } = describeRoute(snapshot)

  const handleClick = (): void => {
    if (onOpen) {
      onOpen()
    } else {
      popoverStore.toggle(sessionId, chipRef.current)
    }
  }

  return h(Fragment, null,
    h('style', { key: 'css' }, CHIP_CSS),
    h('button', {
      key: 'chip',
      ref: chipRef,
      type: 'button',
      className: `sr-chip${isOverride ? ' is-override' : ''}${isOpen ? ' is-open' : ''}`,
      onClick: handleClick,
      title: `子代理：${label}（${sourceLabel}）— 点击切换子代理配置`,
      'aria-label': `子代理当前使用 ${label}，来源${sourceLabel}；点击切换子代理配置`,
      'aria-expanded': isOpen,
      'aria-haspopup': 'dialog',
    },
      h('span', { className: 'sr-chip-dot', 'aria-hidden': 'true' }),
      h('span', { className: 'sr-chip-label' }, `子 ${label}`),
      h('span', { className: 'sr-chip-arrow', 'aria-hidden': 'true' }, isOpen ? '▴' : '▾'),
    ),
  )
}
