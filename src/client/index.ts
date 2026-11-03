/**
 * 客户端挂载点。
 *
 * 三处 UI，各自独立成一个小节，任一处注册失败都不拖垮其余：
 * 1. 插件设置页（规则维护，既有能力）；
 * 2. 右侧栏「子代理」tab（会话级切换控制台）；
 * 3. 输入区药丸（当前生效值的只读指示，点击打开右侧栏）。
 *
 * 右侧栏走 `ctx.sidebarRightTabs` 的公开两阶段注册，不侵入其他插件的 DOM——
 * 主题类插件重写了输入区的模型选择器，跨插件去改它的内部结构会在它升级时直接断裂。
 */

import { PACKAGE_NAME, PLUGIN_ID } from '../shared/settings'
import { RoutePanel } from './panel'
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
 * （不是返回 undefined），因此这三项缺一不可：
 * - slots：注册设置页、侧栏正文、输入区药丸；
 * - sidebarRightTabs：注册侧栏 tab 类型；
 * - sidebarRight：从输入区药丸打开面板；
 * - locale：侧栏 tab 标题与 guide 文案。
 *
 * 宿主缺任一服务时，Cordis 会把插件挂起而不是加载，因此下面的可选链只用于
 * 兼容不支持侧栏的宿主形态。
 */
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight', 'locale']

/**
 * 客户端宿主给本插件的服务面；只声明真正用到的部分。
 *
 * 除 effect 外都是必填：它们已在 inject 里声明，Cordis 保证 apply 跑起来时都已就绪。
 * 标成可选只会诱使代码写「取不到就算了」的分支，而那正是界面静默少一块的来源。
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
  /** 侧栏导航面：从输入区药丸打开面板。 */
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
 *
 * 不再静默吞错：动态插件的守卫拒绝会明确指出「该在 inject 里声明什么」，
 * 吞掉它只会让界面莫名其妙少一块，排查时得往回翻几层日志。
 * 抛给宿主后，加载报告里也会留下这条失败。
 */
function step(label: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    // 补上步骤名：宿主抛的是裸 TypeError 时，只有这一行能指出是哪个入口挂掉了。
    const detail = error instanceof Error ? error.message : String(error)
    const wrapped = new Error(`[${PLUGIN_ID}] ${label} 注册失败：${detail}`, { cause: error })
    console.error(wrapped.message, error)
    throw wrapped
  }
}

/**
 * 从输入区打开控制台。
 *
 * 侧栏未展开时先展开再打开 tab，否则用户点了药丸却看不到任何变化。
 */
function openPanel(ctx: ClientContext): void {
  const sidebar = ctx.sidebarRight
  if (sidebar.isExpanded !== undefined && sidebar.toggleExpanded !== undefined && !sidebar.isExpanded()) {
    sidebar.toggleExpanded()
  }
  sidebar.openTab(TAB_KIND, { revealIfOpened: true })
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
  // 不判断 undefined：inject 已声明 sidebarRightTabs，宿主缺它时 Cordis 会挂起插件，
  // 让 apply 跑不到这里；此时若再静默 return，只会把「缺服务」变成「界面少一块」。
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
      { name: 'sidebar.right.pane.tab', key: TAB_ID },
      ((props: { sessionId?: string }) => {
        const sessionId = props.sessionId
        return sessionId === undefined ? null : RoutePanel({ sessionId })
      }) as never,
    ))
  })

  step('sidebar-tab-title', () => {
    ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
      { name: 'sidebar.right.pane.tab.title', key: TAB_ID },
      (() => text('tab.title', '子代理')) as never,
    ))
  })

  // 输入区药丸：只读指示 + 跳转。挂在左侧、紧跟模型座位之后（order 0 < 模型座位的 -10
  // 之外更靠右），这样它与子代理相关的模型信息挨在一起，而不去挤右侧的发送区。
  step('composer-chip', () => {
    ctx.slots.inject('conversation.input.left', () => ctx.slots.register(
      { name: 'conversation.input.left', id: `${PACKAGE_NAME}-chip`, order: 0 },
      ((props: { sessionId?: string }) => {
        const sessionId = props.sessionId
        return sessionId === undefined ? null : RouteStatusChip({ sessionId, onOpen: () => openPanel(ctx) })
      }) as never,
    ))
  })
}

// 让类型检查知道 SettingsProps 仍被这个模块引用（设置页组件签名）。
export type { SettingsProps }
