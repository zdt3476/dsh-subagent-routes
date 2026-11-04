/**
 * 客户端挂载点。
 *
 * 四处 UI，分步注册并明确上报失败，不吞错伪装为完整加载：
 * 1. 插件设置页（规则维护，既有能力）；
 * 2. 右侧栏「子代理」tab（会话级切换控制台，持久入口）；
 * 3. 输入区药丸（移至 conversation.input.right，紧邻主模型选择器，点击就地展开/关闭浮层）；
 * 4. 输入区浮层（conversation.input.overlay，就地展开控制台，支持 Escape、外部点击关闭与焦点还原）。
 */

import { createElement as h } from 'react'
import { PACKAGE_NAME, PLUGIN_ID } from '../shared/settings'
import { RoutePanel } from './panel'
import { RoutePopover } from './popover'
import { RouteStatusChip } from './status-chip'
import { SettingsPanel, type SettingsProps } from './settings-panel'

export const name = PACKAGE_NAME

/** 侧栏 tab 类型 id：同时是正文与标题 seat 的 key。 */
const TAB_ID = `${PACKAGE_NAME}/route`
/** 侧栏 tab 种类；页类型不认领资源地址，按 kind 打开。 */
const TAB_KIND = 'subagentroute'

/**
 * 声明的服务。
 *
 * 动态客户端插件只能访问 inject 里声明过的服务，未声明的读取会被守卫直接拒绝
 * （不是返回 undefined），因此下面四项缺一不可：
 * - slots：注册设置页、侧栏正文、输入区药丸、输入区浮层；
 * - sidebarRightTabs：注册侧栏 tab 类型；
 * - sidebarRight：侧栏导航（保留右侧栏持久入口）；
 * - locale：侧栏 tab 标题与 guide 文案。
 */
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight', 'locale']

/**
 * 客户端宿主给本插件的服务面；只声明真正用到的部分。
 */
export interface ClientContext {
  slots: {
    inject(name: string, factory: () => unknown): unknown
    register(meta: Record<string, unknown>, component: (props: never) => unknown): unknown
  }
  /** 侧栏 tab 类型注册表。 */
  sidebarRightTabs: {
    register(definition: {
      id: string
      kind: string
      priority?: 'builtin' | 'extension' | 'fallback'
      multiple?: boolean
      title: () => string
      guide?: Array<{
        id: string
        order?: number
        title: () => string
        description?: () => string
      }>
    }): () => void
  }
  /** 侧栏导航面。 */
  sidebarRight: {
    openTab(kind: string, options?: Record<string, unknown>): void
    isExpanded?(): boolean
    toggleExpanded?(): void
  }
  locale: {
    register(namespace: string, dictionary: { zh: Record<string, string>; en: Record<string, string> }): void
    bind(namespace: string): (key: string) => string
  }
  effect?: (factory: () => () => void, label?: string) => void
}

const DICT_ZH = {
  'tab.title': '子代理',
  'guide.title': '子代理模型',
  'guide.description': '切换本会话的子代理配置，并看清当前生效的来源。',
}

const DICT_EN = {
  'tab.title': 'Subagent',
  'guide.title': 'Subagent model',
  'guide.description': 'Switch this session’s subagent route and see which layer is in effect.',
}

/**
 * 单步执行并上报失败。
 */
function step(label: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const wrapped = new Error(`[${PLUGIN_ID}] ${label} 注册失败：${detail}`, { cause: error })
    console.error(wrapped.message, error)
    throw wrapped
  }
}

export function apply(ctx: ClientContext): void {
  const effect = ctx.effect ?? ((factory: () => () => void) => { factory() })
  const t = ctx.locale.bind(PACKAGE_NAME)
  const text = (key: string, fallback: string): string => t(key) ?? fallback

  step('locale', () => {
    ctx.locale.register(PACKAGE_NAME, { zh: DICT_ZH, en: DICT_EN })
  })

  // 设置页：包级卡片与 patch 行两个入口，保持安装后的既有路径不变。
  for (const [slot, key] of [
    ['plugins.bundle.config', PACKAGE_NAME],
    ['plugins.row.config', `${PACKAGE_NAME}#${PLUGIN_ID}`],
  ] as const) {
    step(`settings:${slot}`, () => {
      ctx.slots.inject(slot, () => ctx.slots.register({ name: slot, key }, SettingsPanel))
    })
  }

  // 右侧栏 tab：类型声明由注册表管，正文与 chip 标题各占一个 keyed seat。
  step('sidebar-tab-type', () => {
    effect(() => ctx.sidebarRightTabs.register({
      id: TAB_ID,
      kind: TAB_KIND,
      priority: 'extension',
      title: () => text('tab.title', '子代理'),
      guide: [{
        id: 'route',
        order: 30,
        title: () => text('guide.title', '子代理模型'),
        description: () => text('guide.description', '切换本会话的子代理配置。'),
      }],
    }), 'subagent-routes: sidebar tab type')
  })

  step('sidebar-tab-body', () => {
    ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
      {
        name: 'sidebar.right.pane.tab',
        key: TAB_ID,
        inject: (sessionId: string) => ({ sessionId }),
      },
      ((props: { sessionId?: string }) => {
        const sessionId = props.sessionId
        return sessionId === undefined ? null : h(RoutePanel, { key: sessionId, sessionId })
      }) as never,
    ))
  })

  step('sidebar-tab-title', () => {
    ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
      { name: 'sidebar.right.pane.tab.title', key: TAB_ID },
      (() => text('tab.title', '子代理')) as never,
    ))
  })

  // 输入区药丸：移至 conversation.input.right，紧靠主模型选择器，点击切换就地浮层面板。
  step('composer-chip', () => {
    ctx.slots.inject('conversation.input.right', () => ctx.slots.register(
      {
        name: 'conversation.input.right',
        id: `${PACKAGE_NAME}-chip`,
        kind: 'list',
        scope: 'session',
        order: 0,
        inject: (sessionId: string) => ({ sessionId }),
      },
      ((props: { sessionId?: string }) => {
        const sessionId = props.sessionId
        return sessionId === undefined
          ? null
          : h(RouteStatusChip, { key: sessionId, sessionId })
      }) as never,
    ))
  })

  // 输入区浮层：conversation.input.overlay，锚定在输入框上方就地弹出控制台
  step('composer-overlay', () => {
    ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register(
      {
        name: 'conversation.input.overlay',
        id: `${PACKAGE_NAME}-overlay`,
        kind: 'list',
        scope: 'session',
        order: 0,
        inject: (sessionId: string) => ({ sessionId }),
      },
      ((props: { sessionId?: string }) => {
        const sessionId = props.sessionId
        return sessionId === undefined
          ? null
          : h(RoutePopover, { key: sessionId, sessionId })
      }) as never,
    ))
  })
}

export type { SettingsProps }
