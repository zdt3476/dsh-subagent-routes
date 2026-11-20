import type { PluginConfig, SettingsSnapshot } from '../shared/settings'
import type { SettingsApi } from './services'

export function settingsChanges(snapshot: SettingsSnapshot, config: PluginConfig, text: string) {
  const pathDirty = config.routesFile !== snapshot.config.routesFile
  return {
    pathDirty,
    configDirty: pathDirty || config.enabled !== snapshot.config.enabled ||
      config.preflight !== snapshot.config.preflight || config.fallbackPolicy !== snapshot.config.fallbackPolicy,
    tableDirty: snapshot.table !== null && text !== snapshot.table.text,
  }
}

interface SaveResult {
  snapshot: SettingsSnapshot
  error?: string
  notice?: string
  refreshRequired?: boolean
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** A table draft belongs to its original file and revision, never to a newly selected path. */
export async function saveSettingsDraft(
  api: SettingsApi,
  snapshot: SettingsSnapshot,
  config: PluginConfig,
  text: string,
): Promise<SaveResult> {
  const { pathDirty, configDirty, tableDirty } = settingsChanges(snapshot, config, text)
  if (pathDirty && tableDirty) {
    return { snapshot, error: '请先保存或放弃当前文件的规则修改，再切换路由表路径。' }
  }
  if (configDirty && !snapshot.canEditConfig) {
    return { snapshot, error: '当前宿主不支持保存基础设置。' }
  }

  let saved = snapshot
  if (tableDirty && snapshot.table !== null) {
    try {
      // Host revisions already include the resolved file identity. Do not rebase the draft.
      const table = await api.saveTable({ text, revision: snapshot.table.revision })
      saved = { ...snapshot, table }
    } catch (error) {
      return { snapshot, error: `路由表未保存：${reason(error)}` }
    }
  }
  if (!configDirty) {
    return { snapshot: saved, ...(tableDirty ? { notice: '路由表已保存。' } : {}) }
  }

  const tableNotice = tableDirty ? '路由表已保存；' : ''
  try {
    await api.saveConfig(config, snapshot.configRevision)
  } catch (error) {
    return { snapshot: saved, error: `${tableNotice}基础设置未保存：${reason(error)}` }
  }

  try {
    return { snapshot: await api.load(), notice: `${tableNotice}基础设置已保存。` }
  } catch (error) {
    // The old revision is now stale. In particular, the old file must not stay editable after a switch.
    return {
      snapshot: { ...saved, config, ...(pathDirty ? { table: null, tableError: undefined } : {}) },
      error: `${tableNotice}基础设置已保存，但重新读取失败：${reason(error)}。请重新读取后再编辑。`,
      refreshRequired: true,
    }
  }
}
