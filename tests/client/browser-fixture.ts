import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { PACKAGE_NAME } from '../../src/shared/settings'
import type { ClientContext } from '../../src/client/index'
import type { SettingsProps } from '../../src/client/settings-panel'

const components = new Map<string, React.ComponentType<SettingsProps>>()
const mount = document.getElementById('mount')!
const root = createRoot(mount)
let generation = 0

Object.assign(globalThis, {
  __ModuleLoader__: {
    load({ factory }: { factory: (require: (name: string) => unknown) => { apply(ctx: ClientContext): void } }) {
      const plugin = factory(name => {
        if (name === 'react') return React
        throw new Error(`Unexpected client dependency: ${name}`)
      })
      plugin.apply({ slots: {
        inject: (_name, register) => register(),
        register: ({ key }, component) => { components.set(key, component as React.ComponentType<SettingsProps>) },
      } })
    },
  },
  __SR_MOUNT__: () => {
    const Component = components.get(PACKAGE_NAME)
    if (!Component) throw new Error('Missing bundle configuration slot')
    root.render(React.createElement(Component, { key: ++generation, view: 'page' }))
  },
  __SR_KEYS__: () => [...components.keys()],
})

const script = document.createElement('script')
script.src = '/lib/client.js'
script.onload = () => (globalThis as unknown as { __SR_MOUNT__: () => void }).__SR_MOUNT__()
document.body.append(script)
