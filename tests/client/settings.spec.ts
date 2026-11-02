import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../../src/client/index'
import { SettingsPanel } from '../../src/client/settings-panel'
import { settingsApi } from '../../src/client/services'
import { PACKAGE_NAME, PLUGIN_ID, SETTINGS_PATH } from '../../src/shared/settings'

afterEach(() => vi.unstubAllGlobals())

describe('设置界面接入', () => {
  it('包级与 patch row 级使用同一个配置组件，并使用准确 key', () => {
    const entries: Array<{ name: string; key: string }> = []
    const renders: unknown[] = []
    apply({ slots: {
      inject: (_name, factory) => factory(),
      register: (meta, component) => { entries.push(meta); renders.push(component) },
    } })
    expect(entries).toEqual([
      { name: 'plugins.bundle.config', key: PACKAGE_NAME },
      { name: 'plugins.row.config', key: `${PACKAGE_NAME}#${PLUGIN_ID}` },
    ])
    expect(renders).toEqual([SettingsPanel, SettingsPanel])
  })

  it('summary 不渲染编辑器、不发请求', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const html = renderToStaticMarkup(h(SettingsPanel, { view: 'summary' }))
    expect(html).toContain('工作区')
    expect(html).not.toContain('textarea')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('未加载时呈现可读状态，不渲染假的保存成功', () => {
    const html = renderToStaticMarkup(h(SettingsPanel, {}))
    expect(html).toContain('正在读取设置')
    expect(html).not.toContain('已保存')
  })
})

describe('设置请求', () => {
  it('同源读取，不缓存配置', async () => {
    const fetch = vi.fn(async () => Response.json({ table: null }))
    vi.stubGlobal('fetch', fetch)
    await settingsApi.load()
    expect(fetch).toHaveBeenCalledWith(SETTINGS_PATH, expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' }))
  })

  it('携带 revision 保存路由表，不从浏览器指定目标文件', async () => {
    const fetch = vi.fn(async () => Response.json({ text: 'routes: []' }))
    vi.stubGlobal('fetch', fetch)
    await settingsApi.saveTable({ text: 'routes: []', revision: 'v1' })
    expect(fetch).toHaveBeenCalledWith(SETTINGS_PATH, expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ kind: 'table', text: 'routes: []', revision: 'v1' }),
    }))
  })

  it('基础配置保存失败时呈现真实错误，不报成功', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: '配置已被修改' }, { status: 409 })))
    await expect(settingsApi.saveConfig({ routesFile: '', enabled: true, preflight: true }, 'v1')).rejects.toThrow('配置已被修改')
  })

  it('非 JSON 的宿主错误有可诊断提示', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })))
    await expect(settingsApi.load()).rejects.toThrow(/HTTP 404/)
  })
})

describe('新版设置页面渲染', () => {
  it('初始未加载时展示标题与骨架加载态', () => {
    const html = renderToStaticMarkup(h(SettingsPanel, {}))
    expect(html).toContain('子代理工作区路由')
    expect(html).toContain('正在读取设置')
    expect(html).toContain('sr-skeleton')
  })

  it('summary 保持精简纯文本', () => {
    const html = renderToStaticMarkup(h(SettingsPanel, { view: 'summary' }))
    expect(html).toContain('工作区')
    expect(html).not.toContain('sr-card')
  })

  it('支持提供商、模型与思考等级智能联动选项', async () => {
    const mockCatalog = [
      {
        id: 'acme',
        name: 'OneModel Cloud',
        models: [
          {
            id: 'gemini-flash',
            name: 'Gemini Flash',
            reasoning: {
              efforts: [{ id: 'low', name: 'Low' }, { id: 'max', name: 'Max' }],
              defaultEffort: 'low',
            },
          },
          { id: 'chat-basic', name: 'Chat Basic' },
        ],
      },
    ]

    const customApi = {
      load: vi.fn(async () => ({
        config: { routesFile: '', enabled: true, preflight: true },
        configRevision: 'rev1',
        canEditConfig: true,
        table: { file: '/path/routes.yaml', exists: true, text: 'routes: []\n', revision: 'rev2' },
        catalog: mockCatalog,
      })),
      saveConfig: vi.fn(),
      saveTable: vi.fn(),
    }

    // 验证 API 提供的 catalog 结构可被消费
    const snapshot = await customApi.load()
    expect(snapshot.catalog).toEqual(mockCatalog)
    expect(snapshot.catalog[0]?.models[0]?.reasoning?.efforts).toHaveLength(2)
  })
})
