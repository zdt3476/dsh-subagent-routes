import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSettingsHandler, registerSettings } from '../../src/host/settings-api'
import { apply } from '../../src/host/index'
import { PACKAGE_NAME, PLUGIN_ID, SESSION_PATH, SETTINGS_PATH } from '../../src/shared/settings'

let directory: string
let file: string
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'subagent-routes-api-'))
  file = join(directory, 'routes.yaml')
})
afterEach(() => rmSync(directory, { recursive: true, force: true }))

function harness() {
  const entry = { options: { id: PLUGIN_ID, name: PACKAGE_NAME, config: { routesFile: file, enabled: true, preflight: true } } }
  const editor = {
    entries: () => [entry],
    edit: vi.fn(async (_entry: unknown, change: (raw: unknown) => unknown) => {
      entry.options.config = change(entry.options.config) as typeof entry.options.config
    }),
  }
  const handler = createSettingsHandler(entry.options.config, editor, vi.fn())
  const request = (method = 'GET', body?: unknown, contentType = 'application/json') => handler(new Request(
    `http://localhost${SETTINGS_PATH}`,
    { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': contentType } }) },
  ))
  return { entry, editor, handler, request }
}

describe('设置 API', () => {
  it('读取实际配置文件和可编辑状态', async () => {
    const h = harness()
    const response = await h.request()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toMatchObject({ config: { routesFile: file, enabled: true }, canEditConfig: true, table: { exists: false } })
  })

  it('保存后下一次读取直接得到新 YAML', async () => {
    const h = harness()
    const state = await (await h.request()).json()
    const response = await h.request('PUT', { kind: 'table', text: 'default:\n  reasoningEffort: high\n', revision: state.table.revision })
    expect(response.status).toBe(200)
    expect((await (await h.request()).json()).table.text).toContain('reasoningEffort: high')
  })

  it('通过 configEditor 保存完整配置并保留其他原始字段', async () => {
    const h = harness()
    Object.assign(h.entry.options.config, { other: 'retained' })
    const state = await (await h.request()).json()
    const config = { routesFile: file, enabled: false, preflight: false, fallbackPolicy: 'inherit' }
    const response = await h.request('PUT', { kind: 'config', config, revision: state.configRevision })
    expect(response.status).toBe(200)
    expect(h.editor.edit).toHaveBeenCalledOnce()
    expect(h.entry.options.config).toMatchObject({ ...config, other: 'retained' })
  })

  it('configEditor 晚于 connection 就绪时设置不会永久只读', async () => {
    const h = harness()
    let editor: typeof h.editor | undefined
    const handler = createSettingsHandler(h.entry.options.config, () => editor, vi.fn())
    const get = () => handler(new Request(`http://localhost${SETTINGS_PATH}`))
    expect(await (await get()).json()).toMatchObject({ canEditConfig: false })
    editor = h.editor
    const state = await (await get()).json()
    expect(state.canEditConfig).toBe(true)
    const saved = await handler(new Request(`http://localhost${SETTINGS_PATH}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'config', config: { ...state.config, enabled: false }, revision: state.configRevision }),
    }))
    expect(saved.status).toBe(200)
    expect(h.entry.options.config.enabled).toBe(false)
    editor = undefined
    expect(await (await get()).json()).toMatchObject({ canEditConfig: false })
  })

  it('配置并发变化时拒绝覆盖', async () => {
    const h = harness()
    const state = await (await h.request()).json()
    h.entry.options.config.preflight = false
    const response = await h.request('PUT', { kind: 'config', config: state.config, revision: state.configRevision })
    expect(response.status).toBe(409)
    expect(h.entry.options.config.preflight).toBe(false)
  })

  it('读取请求期间路径发生切换时拒绝向旧文件保存', async () => {
    const h = harness()
    const state = await (await h.request()).json()
    const request = new Request(`http://localhost${SETTINGS_PATH}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
    })
    let release!: (body: ArrayBuffer) => void
    vi.spyOn(request, 'arrayBuffer').mockImplementation(() => new Promise(resolve => { release = resolve }))
    const pending = h.handler(request)
    h.entry.options.config.routesFile = join(directory, 'new.yaml')
    const encoded = new TextEncoder().encode(JSON.stringify({ kind: 'table', text: '', revision: state.table.revision }))
    release(encoded.buffer)
    expect((await pending).status).toBe(409)
  })

  it('切换完成后，旧文件的 revision 不能保存到内容相同的新文件', async () => {
    const h = harness()
    const text = 'routes: []\n'
    const newFile = join(directory, 'new.yaml')
    writeFileSync(file, text)
    writeFileSync(newFile, text)
    const before = await (await h.request()).json()
    h.entry.options.config.routesFile = newFile
    const response = await h.request('PUT', {
      kind: 'table', text: '# 未保存的旧文件草稿\nroutes: []\n', revision: before.table.revision,
    })
    expect(response.status).toBe(409)
    expect(readFileSync(file, 'utf8')).toBe(text)
    expect(readFileSync(newFile, 'utf8')).toBe(text)
  })

  it('缺少 configEditor 时仍能读取和编辑路由表，但不能假保存基础配置', async () => {
    const handler = createSettingsHandler({ routesFile: file }, undefined, vi.fn())
    const response = await handler(new Request(`http://localhost${SETTINGS_PATH}`))
    const state = await response.json()
    expect(state.canEditConfig).toBe(false)
    const saved = await handler(new Request(`http://localhost${SETTINGS_PATH}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'config', config: state.config, revision: state.configRevision }),
    }))
    expect(saved.status).toBe(503)
  })

  it.each([
    { body: { kind: 'table', text: 'routes: [', revision: 'old' }, status: 409 },
    { body: { kind: 'table', text: '', revision: 'old', file: '/other' }, status: 400 },
    { body: { kind: 'config', config: { enabled: 'false' }, revision: 'old' }, status: 400 },
    { body: { kind: 'unknown' }, status: 400 },
    { body: null, status: 400 },
  ])('拒绝非法参数 $body', async ({ body, status }) => {
    const h = harness()
    expect((await h.request('PUT', body)).status).toBe(status)
  })

  it('非法 YAML 返回400，保留原始文件', async () => {
    writeFileSync(file, '')
    const h = harness()
    const state = await (await h.request()).json()
    const response = await h.request('PUT', { kind: 'table', text: 'routes: [', revision: state.table.revision })
    expect(response.status).toBe(400)
    expect(readFileSync(file, 'utf8')).toBe('')
  })

  it('错误媒体类型、不支持方法、超大请求有明确错误', async () => {
    const h = harness()
    expect((await h.request('PUT', {}, 'text/plain')).status).toBe(415)
    expect((await h.request('DELETE')).status).toBe(405)
    expect((await h.request('PUT', { text: '#'.repeat(2 * 1024 * 1024) })).status).toBe(413)
    expect((await h.handler(new Request(`http://localhost${SETTINGS_PATH}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{broken',
    }))).status).toBe(400)
  })

  it('磁盘读取错误不阻止修改基础配置，也不回传堆栈', async () => {
    const warn = vi.fn()
    const handler = createSettingsHandler({ routesFile: directory }, undefined, warn)
    const response = await handler(new Request(`http://localhost${SETTINGS_PATH}`))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ config: { routesFile: directory }, table: null, tableError: '路由表必须是普通文件' })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('宿主拒绝基础配置保存时不返回假成功', async () => {
    const h = harness()
    const state = await (await h.request()).json()
    h.editor.edit.mockRejectedValueOnce(new Error('宿主校验失败'))
    const response = await h.request('PUT', { kind: 'config', config: { ...state.config, enabled: false }, revision: state.configRevision })
    expect(response.status).toBe(500)
    expect(h.entry.options.config.enabled).toBe(true)
  })

  it('关闭路由注入后保留设置接口，允许重新启用', () => {
    const register = vi.fn()
    const get = vi.fn((name: string) => name === 'connection' ? { fetch: { register } } : undefined)
    const ctx = {
      logger: { warn: vi.fn() }, get,
      inject: (_names: string[], callback: (context: unknown) => void) => callback(ctx),
    }
    apply(ctx as never, { routesFile: file, enabled: false })
    // 两条接口都常驻：设置页用于重新启用，会话面板用于解释「为什么没生效」。
    expect(register).toHaveBeenCalledTimes(2)
    expect(register.mock.calls.map(([route]) => (route as { path: string }).path).sort())
      .toEqual([SESSION_PATH, SETTINGS_PATH].sort())
    expect(get).not.toHaveBeenCalledWith('subagents')
  })

  it('仅使用 connection 的 owner 管理通道注册，不裸挂 webServer', () => {
    const register = vi.fn()
    const ctx = {
      logger: { warn: vi.fn() },
      get: (name: string) => name === 'connection' ? { fetch: { register } } : undefined,
      inject: (names: string[], callback: (context: unknown) => void) => {
        expect(names).toEqual(['connection'])
        callback(ctx)
      },
    }
    registerSettings(ctx as never, { routesFile: file })
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ path: SETTINGS_PATH, methods: ['GET', 'PUT'], requestBody: 'buffered' }))
  })

  it('读取设置时携带 LLM 模型目录与思考等级元数据', async () => {
    const mockLlm = {
      listProviders: () => [{ id: 'acme', name: 'OneModel Cloud' }],
      listModels: async (providerId: string) => providerId === 'acme' ? [{ id: 'gemini-flash', name: 'Gemini Flash' }, { id: 'no-reasoning', name: 'No Reasoning' }] : [],
      resolveModelInfo: async (_providerId: string, modelId: string) => {
        if (modelId === 'gemini-flash') {
          return { reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'low' } }
        }
        return {}
      },
    }
    const { buildCatalogFromLlm } = await import('../../src/host/settings-api')
    const catalog = await buildCatalogFromLlm(mockLlm)
    expect(catalog).toHaveLength(1)
    expect(catalog?.[0]?.models).toHaveLength(2)
    expect(catalog?.[0]?.models[0]?.reasoning?.efforts).toEqual([{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }])
    expect(catalog?.[0]?.models[1]?.reasoning).toBeUndefined()

    const handler = createSettingsHandler({ routesFile: file }, undefined, vi.fn(), () => Promise.resolve(catalog))
    const response = await handler(new Request(`http://localhost${SETTINGS_PATH}`))
    const body = await response.json()
    expect(body.catalog).toEqual(catalog)
  })

  it('多 Provider 目录并行拉取，单 Provider 失败不影响其余 Provider 且顺序稳定', async () => {
    const started: string[] = []
    let releaseFirst!: () => void
    const firstGate = new Promise<void>(resolve => { releaseFirst = resolve })
    const mockLlm = {
      listProviders: () => [
        { id: 'slow', name: 'Slow' },
        { id: 'broken', name: 'Broken' },
        { id: 'fast', name: 'Fast' },
      ],
      listModels: async (providerId: string) => {
        started.push(providerId)
        if (providerId === 'slow') {
          await firstGate
          return [{ id: 'slow-1', name: 'Slow 1' }]
        }
        if (providerId === 'broken') throw new Error('boom')
        // 确认不是等 slow 完成才开始调用 fast
        releaseFirst()
        return [{ id: 'fast-1', name: 'Fast 1' }]
      },
    }
    const { buildCatalogFromLlm } = await import('../../src/host/settings-api')
    const catalog = await buildCatalogFromLlm(mockLlm)
    expect(started).toEqual(['slow', 'broken', 'fast'])
    expect(catalog?.map(group => group.id)).toEqual(['slow', 'fast'])
  })

  it('读取设置时携带宿主已登记的工作区，供设置页挑选目录', async () => {
    const { collectWorkspaces } = await import('../../src/host/settings-api')
    const workspaces = collectWorkspaces({
      list: () => [
        { path: '/Users/me/Code/app', title: 'app' },
        { path: '/Users/me/Code/app', title: '重复项' },
        { path: '', title: '空路径' },
      ],
    })
    expect(workspaces).toEqual([{ path: '/Users/me/Code/app', title: 'app' }])
    expect(collectWorkspaces(undefined)).toBeUndefined()
    expect(collectWorkspaces({ list: () => [] })).toBeUndefined()

    const handler = createSettingsHandler({ routesFile: file }, undefined, vi.fn(), undefined, () => workspaces)
    const body = await (await handler(new Request(`http://localhost${SETTINGS_PATH}`))).json()
    expect(body.workspaces).toEqual(workspaces)
  })

  it('工作区注册表抛错时安静降级，不影响设置读取', async () => {
    const handler = createSettingsHandler({ routesFile: file }, undefined, vi.fn(), undefined, () => {
      throw new Error('registry unavailable')
    })
    const response = await handler(new Request(`http://localhost${SETTINGS_PATH}`))
    expect(response.status).toBe(200)
    expect((await response.json()).workspaces).toBeUndefined()
  })
})
