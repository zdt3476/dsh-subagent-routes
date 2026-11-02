import { PACKAGE_NAME, PLUGIN_ID } from '../shared/settings'
import { SettingsPanel, type SettingsProps } from './settings-panel'

export const name = PACKAGE_NAME
export const inject = ['slots']

export interface ClientContext {
  slots: {
    inject(name: string, factory: () => unknown): unknown
    register(meta: { name: string; key: string }, component: (props: SettingsProps) => unknown): unknown
  }
}

export function apply(ctx: ClientContext): void {
  for (const [name, key] of [
    ['plugins.bundle.config', PACKAGE_NAME],
    ['plugins.row.config', `${PACKAGE_NAME}#${PLUGIN_ID}`],
  ] as const) {
    ctx.slots.inject(name, () => ctx.slots.register({ name, key }, SettingsPanel))
  }
}
