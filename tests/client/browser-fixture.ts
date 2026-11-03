/**
 * 浏览器夹具：把构建产物挂进一个最小页面，供截图与 DOM 断言使用。
 *
 * 宿主接口全部走内存桩：截图脚本不该连真实会话，也不该往真实磁盘写配置。
 * 夹具暴露三个挂载入口（设置页、右侧栏面板、输入区药丸）以及注册结果读取接口。
 */

import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { PACKAGE_NAME } from '../../src/shared/settings'
import type { ClientContext } from '../../src/client/index'

interface Mounted {
  Component: React.ComponentType<never>
  meta: Record<string, unknown>
}

const components = new Map<string, Mounted>()
const roots = new Map<HTMLElement, Root>()
/** 侧栏 tab 类型注册表收到的声明。 */
const tabDefinitions: Array<Record<string, unknown>> = []
/** openTab 的调用记录。 */
const opened: Array<{ kind: string; options?: Record<string, unknown> }> = []
const logs: string[] = []

let sidebarExpanded = false

/** 侧栏 tab 正文的 key，与 src/client/index.ts 保持一致。 */
const TAB_KEY = `${PACKAGE_NAME}/route`
/** 输入区药丸的 key。 */
const CHIP_KEY = `${PACKAGE_NAME}-chip`

const stubs = {
  sidebarRightTabs: {
    register: (definition: Record<string, unknown>) => {
      tabDefinitions.push(definition)
      return () => undefined
    },
  },
  sidebarRight: {
    openTab: (kind: string, options?: Record<string, unknown>) => { opened.push({ kind, options }) },
    isExpanded: () => sidebarExpanded,
    toggleExpanded: () => { sidebarExpanded = !sidebarExpanded },
  },
  locale: {
    register: () => undefined,
    // 未注册字典时退回 key 本身，正好暴露「忘了注册」的情况。
    bind: () => (key: string) => key,
  },
  effect: (factory: () => () => void) => { factory() },
}

function mount(key: string, targetId: string, props: Record<string, unknown>): void {
  const entry = components.get(key)
  if (entry === undefined) throw new Error(`Missing client slot: ${key}`)
  const target = document.getElementById(targetId)
  if (target === null) throw new Error(`Missing mount target #${targetId}`)
  const root = createRoot(target)
  roots.set(target, root)
  root.render(React.createElement(entry.Component, props as never))
}

Object.assign(globalThis, {
  __ModuleLoader__: {
    load({ factory }: { factory: (require: (name: string) => unknown) => { apply(ctx: ClientContext): void } }) {
      const plugin = factory(name => {
        if (name === 'react' || name === 'react/jsx-runtime') return React
        throw new Error(`Unexpected client dependency: ${name}`)
      })
      plugin.apply({
        slots: {
          inject: (_name: string, factory: () => unknown) => factory(),
          register: (meta: Record<string, unknown>, component: (props: never) => unknown) => {
            const key = String(meta.key ?? meta.id ?? meta.name)
            components.set(key, { Component: component as React.ComponentType<never>, meta })
            return () => components.delete(key)
          },
        },
        ...stubs,
      } as never)
    },
  },

  /** 清掉已挂载的根与记录，避免多次截图之间互相污染。 */
  __SR_RESET__: () => {
    for (const root of roots.values()) root.unmount()
    roots.clear()
    opened.length = 0
    logs.length = 0
    sidebarExpanded = false
  },

  __SR_MOUNT_SETTINGS__: (targetId = 'mount') => mount(PACKAGE_NAME, targetId, { view: 'page' }),
  __SR_MOUNT_PANEL__: (targetId = 'mount', props: Record<string, unknown> = {}) =>
    mount(TAB_KEY, targetId, { sessionId: 'session-demo', ...props }),
  __SR_MOUNT_CHIP__: (targetId = 'mount', props: Record<string, unknown> = {}) =>
    mount(CHIP_KEY, targetId, { sessionId: 'session-demo', ...props }),

  __SR_TABS__: () => tabDefinitions,
  __SR_OPENED__: () => opened,
  __SR_LOGS__: () => logs,
  __SR_KEYS__: () => [...components.keys()],
})

const script = document.createElement('script')
script.src = '/lib/client.js'
document.body.append(script)
