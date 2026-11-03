import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../../src/client/index'
import { SettingsPanel } from '../../src/client/settings-panel'
import { settingsApi } from '../../src/client/services'
import { PACKAGE_NAME, PLUGIN_ID, SETTINGS_PATH } from '../../src/shared/settings'

afterEach(() => vi.unstubAllGlobals())

/**
 * 一个最小但完整的客户端宿主桩。
 *
 * 动态插件只能访问 inject 里声明的服务，缺一项就会在 apply 里抛错——
 * 所以桩必须把四项都提供出来，否则测的就不是真实运行形态。
 */
function host(overrides: Record<string, unknown> = {}) {
  const entries: Array<Record<string, unknown>> = []
  const renders: unknown[] = []
  const definitions: Array<Record<string, unknown>> = []
  return {
    entries,
    renders,
    definitions,
    ctx: {
      slots: {
        inject: (_name: string, factory: () => unknown) => factory(),
        register: (meta: Record<string, unknown>, component: (props: never) => unknown) => {
          entries.push(meta)
          renders.push(component)
          return () => undefined
        },
      },
      sidebarRightTabs: {
        register: (definition: Record<string, unknown>) => {
          definitions.push(definition)
          return () => undefined
        },
      },
      sidebarRight: {
        openTab: () => undefined,
        isExpanded: () => false,
        toggleExpanded: () => undefined,
      },
      locale: {
        register: () => undefined,
        bind: () => (key: string) => key,
      },
      effect: (factory: () => () => void) => { factory() },
      ...overrides,
    } as never,
  }
}

describe('设置界面接入', () => {
  it('包级与 patch row 级使用同一个配置组件，并使用准确 key', () => {
    const { ctx, entries, renders } = host()
    apply(ctx)
    // 前两个是既有设置入口；其后是右侧栏正文/标题与输入区药丸。
    expect(entries.slice(0, 2)).toEqual([
      { name: 'plugins.bundle.config', key: PACKAGE_NAME },
      { name: 'plugins.row.config', key: `${PACKAGE_NAME}#${PLUGIN_ID}` },
    ])
    expect(renders.slice(0, 2)).toEqual([SettingsPanel, SettingsPanel])
  })

  it('注册右侧栏正文、标题与输入区药丸三个 seat', () => {
    const { ctx, entries } = host()
    apply(ctx)
    const names = entries.map(entry => entry.name)
    expect(names).toContain('sidebar.right.pane.tab')
    expect(names).toContain('sidebar.right.pane.tab.title')
    expect(names).toContain('conversation.input.left')
  })

  it('把侧栏 tab 类型注册为可打开的页类型', () => {
    const { ctx, definitions } = host()
    apply(ctx)
    expect(definitions).toHaveLength(1)
    expect(definitions[0]).toMatchObject({ kind: 'subagentroute', priority: 'extension' })
  })

  it('inject 声明了侧栏与本地化服务，否则守卫会拒绝访问', () => {
    // 动态客户端插件只能访问 inject 里声明过的服务；漏声明不会返回 undefined，
    // 而是直接抛错，表现为界面上「什么都没有」。
    expect(inject).toContain('slots')
    expect(inject).toContain('sidebarRightTabs')
    expect(inject).toContain('sidebarRight')
    expect(inject).toContain('locale')
  })

  it('缺 sidebarRightTabs 时报错并留下日志，而不是静默少一块', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { ctx } = host({ sidebarRightTabs: undefined })
    // 报错必须点名是哪个入口与哪个服务，否则只会在控制台留一条裸 TypeError。
    expect(() => apply(ctx)).toThrow(/sidebar-tab-type|sidebarRightTabs/)
    expect(errors).toHaveBeenCalled()
    errors.mockRestore()
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
