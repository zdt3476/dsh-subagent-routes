import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { symbols } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../../src/host/index'
import { OverrideStore } from '../../src/host/overrides'

class FakeSubagents {
  readonly captured: Array<{ spec: Record<string, unknown> }> = []

  async startActivation(spec: Record<string, unknown>): Promise<unknown> {
    this.captured.push({ spec })
    return { childId: 'child-1' }
  }
}

interface Harness {
  delegate(sessionId?: string): Promise<unknown>
  captured: Array<{ spec: Record<string, unknown> }>
  store: OverrideStore
  llm: { resolveCallConfig: ReturnType<typeof vi.fn> }
}

const dirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'subagent-routes-session-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function routeFile(content: string): string {
  const file = join(tempDir(), 'routes.yaml')
  writeFileSync(file, content)
  return file
}

const WORKSPACE_TABLE = [
  'default:',
  '  provider: fallback-p',
  '  model: fallback-m',
  'routes:',
  '  - path: /work/frontend',
  '    provider: ws-p',
  '    model: ws-m',
  '    reasoningEffort: max',
].join('\n')

function harness(options: {
  table?: string
  directory?: string
  explicitOptions?: Record<string, unknown>
  overrides?: boolean
  fallbackPolicy?: 'inherit' | 'rules'
} = {}): Harness {
  const service = new FakeSubagents()
  const store = new OverrideStore(join(tempDir(), 'overrides.json'))
  const directory = options.directory ?? '/work/frontend/src'
  const llm = { resolveCallConfig: vi.fn(async () => ({})) }
  const proxy = { [symbols.original]: service }
  const ctx = {
    logger: { info: vi.fn(), warn: vi.fn() },
    get: (name: string) => {
      if (name === 'workingDirectory') return { get: () => directory }
      if (name === 'llm') return llm
      if (name === 'subagents') return proxy
      return undefined
    },
    inject: (_names: string[], callback: (context: unknown) => unknown) => callback(ctx),
    effect: vi.fn(),
  }

  apply(
    ctx as never,
    {
      routesFile: routeFile(options.table ?? WORKSPACE_TABLE),
      preflight: true,
      ...(options.fallbackPolicy === undefined ? {} : { fallbackPolicy: options.fallbackPolicy }),
    },
    options.overrides === false ? {} : { overrides: { get: id => store.get(id) } },
  )

  return {
    store,
    llm,
    captured: service.captured,
    delegate: (sessionId?: string) =>
      service.startActivation({
        provider: 'spawn',
        label: 'work',
        signal: new AbortController().signal,
        delivery: 'parent',
        request: {
          parent: { session: { ...(sessionId === undefined ? {} : { id: sessionId }), header: { cwd: directory } } },
          prompt: [],
          ...(options.explicitOptions === undefined ? {} : { agentOptions: options.explicitOptions }),
        },
      }),
  }
}

describe('会话级覆盖', () => {
  it('没有覆盖时沿用工作区路由', async () => {
    const h = harness()
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'ws-p', model: 'ws-m', reasoningEffort: 'max' } },
    })
  })

  it('有覆盖时覆盖压过工作区路由', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' } },
    })
  })

  it('覆盖只作用于自己的会话', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    await h.delegate('s2')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'ws-p', model: 'ws-m' } } })
  })

  it('清除覆盖后回到工作区路由', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    h.store.set('s1', undefined)
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'ws-p' } } })
  })

  it('调用方显式路由仍高于覆盖', async () => {
    const h = harness({ explicitOptions: { provider: 'caller-p', model: 'caller-m' } })
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'caller-p', model: 'caller-m' } },
    })
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('调用方只给思考等级时，覆盖补模型但不改等级', async () => {
    const h = harness({ explicitOptions: { reasoningEffort: 'medium' } })
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m', reasoningEffort: 'max' })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'medium' } },
    })
  })

  it('覆盖在路由表损坏时仍然生效', async () => {
    const h = harness({ table: 'routes: [' })
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'sess-p', model: 'sess-m' } } })
  })

  it('会话没有 id 时覆盖不介入', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    await h.delegate()

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'ws-p' } } })
  })

  it('预检使用覆盖后的路由', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' })
    await h.delegate('s1')

    expect(h.llm.resolveCallConfig).toHaveBeenCalledWith(
      { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' },
      expect.any(AbortSignal),
    )
  })

  it('未提供覆盖读取面时退回纯工作区路由', async () => {
    const h = harness({ overrides: false })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'ws-p' } } })
  })
})

describe('全局默认策略与继承主代理模型', () => {
  it('全局策略为继承时，没有项目规则命中也不注入任何路由', async () => {
    const h = harness({ table: 'routes: []', fallbackPolicy: 'inherit', directory: '/work/other' })
    await h.delegate('s1')

    expect((h.captured[0]!.spec.request as { agentOptions?: unknown }).agentOptions).toBeUndefined()
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('全局策略为继承时，命中的项目规则也不生效', async () => {
    const h = harness({ fallbackPolicy: 'inherit' })
    await h.delegate('s1')

    expect((h.captured[0]!.spec.request as { agentOptions?: unknown }).agentOptions).toBeUndefined()
  })

  it('会话选择继承时让位，压过项目规则', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'inherit' })
    await h.delegate('s1')

    expect((h.captured[0]!.spec.request as { agentOptions?: unknown }).agentOptions).toBeUndefined()
  })

  it('全局策略为继承时，会话显式指定仍然生效', async () => {
    const h = harness({ fallbackPolicy: 'inherit' })
    h.store.set('s1', { mode: 'custom', provider: 'sess-p', model: 'sess-m' })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'sess-p', model: 'sess-m' } } })
  })

  it('全局策略为继承时，调用方显式路由不受影响', async () => {
    const h = harness({ fallbackPolicy: 'inherit', explicitOptions: { provider: 'caller-p', model: 'caller-m' } })
    await h.delegate('s1')

    expect(h.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'caller-p', model: 'caller-m' } },
    })
  })

  it('会话选择继承只作用于自己的会话', async () => {
    const h = harness()
    h.store.set('s1', { mode: 'inherit' })
    await h.delegate('s2')

    expect(h.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'ws-p' } } })
  })
})
