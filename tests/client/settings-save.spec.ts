import { describe, expect, it, vi } from 'vitest'
import { saveSettingsDraft, settingsChanges } from '../../src/client/settings-save'
import type { SettingsSnapshot } from '../../src/shared/settings'

const snapshot: SettingsSnapshot = {
  config: { routesFile: '/work/old.yaml', enabled: true, preflight: true, fallbackPolicy: 'rules' },
  configRevision: 'config-1',
  canEditConfig: true,
  table: { file: '/work/old.yaml', exists: true, text: 'routes: []\n', revision: 'old-file-1' },
}
const text = '# 用户草稿\nroutes: []\n'
const table = { ...snapshot.table!, text, revision: 'old-file-2' }
const changedConfig = { ...snapshot.config, preflight: false }
const changedPath = { ...snapshot.config, routesFile: '/work/new.yaml' }
const fresh: SettingsSnapshot = {
  ...snapshot,
  config: changedPath,
  configRevision: 'config-2',
  table: { file: '/work/new.yaml', exists: true, text: '# 新文件的独立规则\nroutes: []\n', revision: 'new-file-1' },
}

function api() {
  return {
    load: vi.fn(async () => fresh),
    saveConfig: vi.fn(async () => undefined),
    saveTable: vi.fn(async () => table),
  }
}

describe('设置草稿保存', () => {
  it('路径修改与原文件草稿同时存在时，一个写入都不发送', async () => {
    const host = api()
    const result = await saveSettingsDraft(host, snapshot, changedPath, text)
    expect(result).toMatchObject({ snapshot, error: expect.stringContaining('再切换路由表路径') })
    expect(host.saveTable).not.toHaveBeenCalled()
    expect(host.saveConfig).not.toHaveBeenCalled()
    expect(host.load).not.toHaveBeenCalled()
  })

  it('只保存路由表使用其原始 revision，不再读取完整设置', async () => {
    const host = api()
    const result = await saveSettingsDraft(host, snapshot, snapshot.config, text)
    expect(host.saveTable).toHaveBeenCalledExactlyOnceWith({ text, revision: 'old-file-1' })
    expect(host.saveConfig).not.toHaveBeenCalled()
    expect(host.load).not.toHaveBeenCalled()
    expect(result).toEqual({ snapshot: { ...snapshot, table }, notice: '路由表已保存。' })
  })

  it('切换路径只修改基础配置，然后采用新文件的独立快照', async () => {
    const host = api()
    const result = await saveSettingsDraft(host, snapshot, changedPath, snapshot.table!.text)
    expect(host.saveConfig).toHaveBeenCalledExactlyOnceWith(changedPath, 'config-1')
    expect(host.saveTable).not.toHaveBeenCalled()
    expect(result.snapshot).toBe(fresh)
    expect(result.snapshot.table!.text).toContain('新文件的独立规则')
  })

  it('路由表版本冲突时不写基础设置，也不改动保存基线', async () => {
    const host = api()
    host.saveTable.mockRejectedValueOnce(new Error('文件已被修改'))
    const result = await saveSettingsDraft(host, snapshot, changedConfig, text)
    expect(result).toEqual({ snapshot, error: '路由表未保存：文件已被修改' })
    expect(host.saveConfig).not.toHaveBeenCalled()
    expect(host.load).not.toHaveBeenCalled()
    expect(settingsChanges(result.snapshot, changedConfig, text)).toEqual({ pathDirty: false, tableDirty: true, configDirty: true })
  })

  it('路由表先保存、基础配置失败时，重试不会用旧版本再次写路由表', async () => {
    const host = api()
    host.saveConfig.mockRejectedValueOnce(new Error('配置已被修改'))
    const result = await saveSettingsDraft(host, snapshot, changedConfig, text)
    expect(result).toEqual({ snapshot: { ...snapshot, table }, error: '路由表已保存；基础设置未保存：配置已被修改' })
    expect(host.saveTable).toHaveBeenCalledBefore(host.saveConfig)
    expect(settingsChanges(result.snapshot, changedConfig, text)).toEqual({ pathDirty: false, tableDirty: false, configDirty: true })
    host.load.mockResolvedValueOnce({ ...result.snapshot, config: changedConfig, configRevision: 'config-2' })
    const retry = await saveSettingsDraft(host, result.snapshot, changedConfig, text)
    expect(host.saveTable).toHaveBeenCalledTimes(1)
    expect(retry.snapshot.config).toBe(changedConfig)
    expect(retry.error).toBeUndefined()
  })

  it('切换已写入但重读失败，旧文件不会留作新路径的可编辑草稿', async () => {
    const host = api()
    host.load.mockRejectedValueOnce(new Error('宿主暂不可用'))
    const result = await saveSettingsDraft(host, snapshot, changedPath, snapshot.table!.text)
    expect(result).toMatchObject({ snapshot: { config: changedPath, table: null }, refreshRequired: true, error: expect.stringContaining('基础设置已保存，但重新读取失败') })
    expect(result.notice).toBeUndefined()
    expect(host.saveTable).not.toHaveBeenCalled()
  })
})
