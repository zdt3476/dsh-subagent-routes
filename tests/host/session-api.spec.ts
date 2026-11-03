import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSessionSnapshot, createSessionHandler } from '../../src/host/session-api'
import { OverrideStore } from '../../src/host/overrides'
import { SESSION_PATH } from '../../src/shared/settings'

let directory: string
let routesFile: string
let store: OverrideStore

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'subagent-routes-session-api-'))
  routesFile = join(directory, 'routes.yaml')
  store = new OverrideStore(join(directory, 'overrides.json'))
})

afterEach(() => rmSync(directory, { recursive: true, force: true }))

const TABLE = [
  'default:',
  '  provider: fallback-p',
  '  model: fallback-m',
  'routes:',
  '  - path: /work/frontend',
  '    provider: ws-p',
  '    model: ws-m',
  '    reasoningEffort: max',
].join('\n')

function handler(options: { directory?: string; enabled?: boolean } = {}) {
  writeFileSync(routesFile, TABLE)
  const rawConfig = { routesFile, enabled: options.enabled ?? true, preflight: true }
  const warn = vi.fn()
  return {
    warn,
    call: createSessionHandler({
      rawConfig,
      store,
      warn,
      ...(options.directory === undefined ? {} : { lookup: { directory: () => options.directory } }),
    }),
    rawConfig,
  }
}

function get(h: ReturnType<typeof handler>, sessionId = 's1'): Promise<Response> {
  return h.call(new Request(`http://localhost${SESSION_PATH}?sessionId=${encodeURIComponent(sessionId)}`))
}

function put(h: ReturnType<typeof handler>, body: unknown): Promise<Response> {
  return h.call(new Request(`http://localhost${SESSION_PATH}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

describe('会话快照', () => {
  it('没有覆盖时报告工作区规则生效', async () => {
    const h = handler({ directory: '/work/frontend/src' })
    const body = await (await get(h)).json()

    expect(body).toMatchObject({
      sessionId: 's1',
      directory: '/work/frontend/src',
      effective: { source: 'workspace', workspacePath: '/work/frontend' },
      tableAvailable: true,
      enabled: true,
    })
    expect(body.override).toBeUndefined()
  })

  it('有覆盖时报告 session 来源', async () => {
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const h = handler({ directory: '/work/frontend/src' })
    const body = await (await get(h)).json()

    expect(body.effective).toEqual({ source: 'session', spec: { provider: 'sess-p', model: 'sess-m' } })
    expect(body.override).toEqual({ provider: 'sess-p', model: 'sess-m' })
  })

  it('路由表损坏时报告 tableAvailable: false，且覆盖仍显示为生效', async () => {
    const h = handler({ directory: '/work/frontend/src' })
    // handler() 会写入一张好表；损坏必须在它之后发生。
    writeFileSync(routesFile, 'routes: [')
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const body = await (await get(h)).json()

    expect(body.tableAvailable).toBe(false)
    expect(body.effective).toMatchObject({ source: 'session' })
    expect(h.warn).toHaveBeenCalled()
  })

  it('拿不到目录时不报错，覆盖仍可用', async () => {
    store.set('s1', { reasoningEffort: 'low' })
    const h = handler()
    const body = await (await get(h)).json()

    expect(body.directory).toBeUndefined()
    expect(body.effective).toEqual({ source: 'session', spec: { reasoningEffort: 'low' } })
  })

  it('插件关闭时 enabled 为 false，便于面板禁用编辑', async () => {
    const h = handler({ directory: '/work/frontend', enabled: false })
    const body = await (await get(h)).json()
    expect(body.enabled).toBe(false)
  })

  it('会话 id 缺失时返回 400', async () => {
    const h = handler()
    const response = await h.call(new Request(`http://localhost${SESSION_PATH}`))
    expect(response.status).toBe(400)
  })

  it('id 过长时返回 413', async () => {
    const h = handler()
    const response = await h.call(new Request(`http://localhost${SESSION_PATH}?sessionId=${'x'.repeat(300)}`))
    expect(response.status).toBe(413)
  })

  it('非 GET/PUT 返回 405', async () => {
    const h = handler()
    const response = await h.call(new Request(`http://localhost${SESSION_PATH}?sessionId=s1`, { method: 'DELETE' }))
    expect(response.status).toBe(405)
  })
})

describe('保存覆盖', () => {
  it('保存后落盘并立即在快照里生效', async () => {
    const h = handler({ directory: '/work/frontend/src' })
    const body = await (await put(h, {
      action: 'save',
      sessionId: 's1',
      override: { provider: ' new-p ', model: 'new-m', reasoningEffort: 'low' },
    })).json()

    expect(body.override).toEqual({ provider: 'new-p', model: 'new-m', reasoningEffort: 'low' })
    expect(store.get('s1')).toEqual({ provider: 'new-p', model: 'new-m', reasoningEffort: 'low' })
  })

  it('override 为 null 表示清除', async () => {
    store.set('s1', { provider: 'p', model: 'm' })
    const h = handler({ directory: '/work/frontend/src' })
    const body = await (await put(h, { action: 'save', sessionId: 's1', override: null })).json()

    expect(body.override).toBeUndefined()
    expect(store.get('s1')).toBeUndefined()
  })

  it('override 字段缺失时报错，不误当清除', async () => {
    const h = handler()
    const response = await put(h, { action: 'save', sessionId: 's1' })
    expect(response.status).toBe(400)
  })

  it('半套 provider/model 被拒绝', async () => {
    const h = handler()
    const response = await put(h, { action: 'save', sessionId: 's1', override: { provider: 'p' } })
    expect(response.status).toBe(400)
    expect(store.get('s1')).toBeUndefined()
  })

  it('非 JSON 内容类型返回 415', async () => {
    const h = handler()
    const response = await h.call(new Request(`http://localhost${SESSION_PATH}`, {
      method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'x',
    }))
    expect(response.status).toBe(415)
  })

  it('未知 action 返回 400', async () => {
    const h = handler()
    const response = await put(h, { action: 'nope', sessionId: 's1' })
    expect(response.status).toBe(400)
  })
})

describe('固化为项目规则', () => {
  it('写入路由表并清除会话覆盖', async () => {
    store.set('s1', { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'high' })
    const h = handler({ directory: '/work/frontend/src' })
    const body = await (await put(h, { action: 'freeze', sessionId: 's1' })).json()

    expect(body.override).toBeUndefined()
    expect(store.get('s1')).toBeUndefined()

    const text = readFileSync(routesFile, 'utf8')
    expect(text).toContain('path: /work/frontend/src')
    expect(text).toContain('provider: sess-p')
    expect(text).toContain('model: sess-m')
    expect(text).toContain('reasoningEffort: high')
  })

  it('保留路由表原有的全局兜底与其他规则', async () => {
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const h = handler({ directory: '/work/frontend/src' })
    await put(h, { action: 'freeze', sessionId: 's1' })

    const text = readFileSync(routesFile, 'utf8')
    expect(text).toContain('provider: fallback-p')
    expect(text).toContain('path: /work/frontend')
    expect(text).toContain('path: /work/frontend/src')
  })

  it('同一目录再次固化时替换而不是追加', async () => {
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const h = handler({ directory: '/work/frontend' })
    await put(h, { action: 'freeze', sessionId: 's1' })
    store.set('s1', { provider: 'p2', model: 'm2' })
    await put(h, { action: 'freeze', sessionId: 's1' })

    const text = readFileSync(routesFile, 'utf8')
    expect(text.match(/path: \/work\/frontend$/gm)).toHaveLength(1)
    expect(text).toContain('provider: p2')
    expect(text).not.toContain('provider: sess-p')
  })

  it('没有覆盖时拒绝固化', async () => {
    const h = handler({ directory: '/work/frontend/src' })
    const response = await put(h, { action: 'freeze', sessionId: 's1' })
    expect(response.status).toBe(400)
  })

  it('路由表无法解析时拒绝固化，不覆盖用户已有内容', async () => {
    const h = handler({ directory: '/work/frontend/src' })
    writeFileSync(routesFile, 'routes: [')
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const response = await put(h, { action: 'freeze', sessionId: 's1' })

    expect(response.status).toBe(400)
    expect(readFileSync(routesFile, 'utf8')).toBe('routes: [')
    expect(store.get('s1')).toBeDefined()
  })

  it('可以用请求里的 path 指定目标目录', async () => {
    store.set('s1', { provider: 'sess-p', model: 'sess-m' })
    const h = handler({ directory: '/work/frontend/src' })
    await put(h, { action: 'freeze', sessionId: 's1', path: '/work/frontend' })

    const text = readFileSync(routesFile, 'utf8')
    expect(text).toContain('path: /work/frontend\n')
    expect(text).not.toContain('path: /work/frontend/src')
  })
})

describe('buildSessionSnapshot', () => {
  it('命中全局兜底时报告 fallback 来源', () => {
    writeFileSync(routesFile, TABLE)
    const snapshot = buildSessionSnapshot('s1', {
      rawConfig: { routesFile, enabled: true, preflight: true },
      store,
      lookup: { directory: () => '/elsewhere' },
      warn: vi.fn(),
    })
    expect(snapshot.effective).toMatchObject({ source: 'fallback' })
  })
})
