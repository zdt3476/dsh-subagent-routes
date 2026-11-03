/**
 * 输入区状态指示：一行小字，告诉用户「接下来派出去的子代理会用哪套配置」。
 *
 * 它刻意不承载任何配置控件——输入区已经被主模型、权限、统计等控件占据，
 * 再塞一组下拉会把它挤爆。这里只负责「看见」与「跳转」，改配置在右侧栏。
 *
 * 文案与面板共用 `route-text`：两边必须对同一状态给出同一个说法，
 * 否则会出现「胶囊说继承主会话、点进去却是全局兜底」这种自相矛盾。
 */

import { createElement as h, Fragment, useEffect, useState, type ReactElement } from 'react'
import type { SessionSnapshot } from '../shared/settings'
import { CHIP_CSS } from './panel-styles'
import { describeRoute } from './route-text'
import { sessionApi, type SessionApi } from './services'

export interface RouteStatusChipProps {
  sessionId: string
  /** 打开右侧栏控制台。 */
  onOpen: () => void
  api?: SessionApi
}

/**
 * 输入区药丸。
 *
 * 读取失败时整体隐藏而不是显示错误：这是辅助信息，不该在输入区抢占注意力，
 * 真正的错误会在侧边栏里说明。
 */
export function RouteStatusChip({ sessionId, onOpen, api = sessionApi }: RouteStatusChipProps): ReactElement | null {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)

  useEffect(() => {
    let live = true
    const controller = new AbortController()
    setSnapshot(null)
    api.load(sessionId, controller.signal)
      .then(next => { if (live) setSnapshot(next) })
      .catch(() => { if (live) setSnapshot(null) })
    return () => {
      live = false
      controller.abort()
    }
  }, [api, sessionId])

  if (snapshot === null) return null

  const { label, sourceLabel, isOverride } = describeRoute(snapshot)

  // 样式必须与药丸同生共死：<button> 的子节点只允许 phrasing content，
  // 所以 <style> 与按钮并列为兄弟节点，而不是塞进按钮里。
  return h(Fragment, null,
    h('style', { key: 'css' }, CHIP_CSS),
    h('button', {
      key: 'chip',
      type: 'button',
      className: `sr-chip${isOverride ? ' is-override' : ''}`,
      onClick: onOpen,
      title: `子代理：${label}（${sourceLabel}）— 点击打开子代理控制台`,
      'aria-label': `子代理当前使用 ${label}，来源${sourceLabel}；点击打开子代理控制台`,
    },
      h('span', { className: 'sr-chip-dot', 'aria-hidden': 'true' }),
      h('span', { className: 'sr-chip-label' }, `子 ${label}`),
      h('span', { className: 'sr-chip-arrow', 'aria-hidden': 'true' }, '›'),
    ),
  )
}
