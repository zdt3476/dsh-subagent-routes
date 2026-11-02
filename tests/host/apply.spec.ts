import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { symbols } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../../src/host/index'

/** 记录一次派活的最小 startActivation 桩，模拟 DSH 的 subagents 服务。 */
interface Captured {
  spec: Record<string, unknown>
}

/**
 * 模拟 DSH 的 SubagentRuntime：startActivation 定义在原型上而不是实例自身上。
 * 这条差异是插件拦截方式的关键——插件依靠「实例自有属性遮蔽原型方法」工作，
 * 若桩用自有属性，就测不出遮蔽与恢复的真实行为。
 */
class FakeSubagents {
  readonly captured: Captured[] = []

  async startActivation(spec: Record<string, unknown>): Promise<unknown> {
    this.captured.push({ spec })
    return { childId: 'child-1' }
  }
}

function createHarness(options: {
  routesFile: string
  directory?: string
  preflight?: boolean
  explicitOptions?: Record<string, unknown>
  rejectPreflight?: Error
}) {
  const warnings: string[] = []
  const infos: string[] = []

  const service = new FakeSubagents()
  const workingDirectory = { get: () => options.directory ?? '/work/frontend/src' }
  const llm = {
    resolveCallConfig: vi.fn(async () => {
      if (options.rejectPreflight !== undefined) throw options.rejectPreflight
      return {}
    }),
  }

  const disposers: Array<() => unknown> = []
  // 模拟 cordis 的 traceable 代理：ctx.get 返回代理，真实实例挂在 symbols.original 上。
  const proxy = { [symbols.original]: service }
  const ctx = {
    logger: {
      info: (message: string) => infos.push(message),
      warn: (message: string) => warnings.push(message),
    },
    get: (name: string) => {
      if (name === 'workingDirectory') return workingDirectory
      if (name === 'llm') return llm
      if (name === 'subagents') return proxy
      return undefined
    },
    inject: (_names: string[], callback: (context: unknown) => unknown) => callback(ctx),
    effect: (factory: () => () => unknown) => {
      disposers.push(factory())
    },
  }

  apply(ctx as never, { routesFile: options.routesFile, preflight: options.preflight ?? true })

  const delegate = (): Promise<unknown> =>
    service.startActivation({
      provider: 'spawn',
      label: 'work',
      signal: new AbortController().signal,
      delivery: 'parent',
      request: {
        parent: { session: { header: { cwd: options.directory ?? '/work/frontend/src' } } },
        prompt: [],
        ...(options.explicitOptions === undefined ? {} : { agentOptions: options.explicitOptions }),
      },
    })

  return {
    captured: service.captured,
    warnings,
    infos,
    service,
    llm,
    disposers,
    delegate,
  }
}

const dirs: string[] = []

function routeFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'subagent-routes-apply-'))
  dirs.push(dir)
  const file = join(dir, 'routes.yaml')
  writeFileSync(file, content)
  return file
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const TABLE = [
  'routes:',
  '  - path: /work/frontend',
  '    provider: acme-gateway',
  '    model: acme-large',
  '    reasoningEffort: max',
].join('\n')

describe('apply', () => {
  it('命中工作区时把路由合并进 agentOptions', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    await harness.delegate()

    expect(harness.captured).toHaveLength(1)
    expect(harness.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' } },
    })
    expect(harness.infos.join('\n')).toContain('acme-gateway/acme-large')
  })

  it('保留原有的其他 agentOptions 字段', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE), explicitOptions: { maxTokens: 8192 } })
    await harness.delegate()

    expect(harness.captured[0]!.spec).toMatchObject({
      request: { agentOptions: { maxTokens: 8192, provider: 'acme-gateway', model: 'acme-large' } },
    })
  })

  it('调用方显式路由优先于工作区', async () => {
    const harness = createHarness({
      routesFile: routeFile(TABLE),
      explicitOptions: { provider: 'p', model: 'm' },
    })
    await harness.delegate()

    expect(harness.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'p', model: 'm' } } })
    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it.each([TABLE, TABLE.replace('\n    reasoningEffort: max', '')])(
    '显式等级在合并后的请求及预检中保持一致（%s）',
    async table => {
      const harness = createHarness({
        routesFile: routeFile(table),
        explicitOptions: { reasoningEffort: 'medium' },
      })
      await harness.delegate()

      const expected = { provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'medium' }
      expect(harness.captured[0]!.spec).toMatchObject({ request: { agentOptions: expected } })
      expect(harness.llm.resolveCallConfig).toHaveBeenCalledWith(expected, expect.any(AbortSignal))
    },
  )

  it('未命中的目录不改写请求', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE), directory: '/totally/elsewhere' })
    await harness.delegate()

    expect(harness.captured[0]!.spec).toMatchObject({ request: {} })
    expect((harness.captured[0]!.spec as { request: { agentOptions?: unknown } }).request.agentOptions).toBeUndefined()
  })

  it('预检按工作区路由调用 llm', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    await harness.delegate()

    expect(harness.llm.resolveCallConfig).toHaveBeenCalledWith(
      { provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' },
      expect.any(AbortSignal),
    )
  })

  it('预检失败时派活直接失败，不创建子代理', async () => {
    const harness = createHarness({
      routesFile: routeFile(TABLE),
      rejectPreflight: new Error('model not registered'),
    })

    await expect(harness.delegate()).rejects.toThrow('model not registered')
    expect(harness.captured).toHaveLength(0)
  })

  it('关闭 preflight 后不调用 llm', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE), preflight: false })
    await harness.delegate()

    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
    expect(harness.captured[0]!.spec).toMatchObject({ request: { agentOptions: { provider: 'acme-gateway' } } })
  })

  it('路由表损坏时告警并按无路由处理', async () => {
    const harness = createHarness({ routesFile: routeFile('routes: [') })
    await harness.delegate()

    expect(harness.warnings.join('\n')).toContain('路由表')
    expect(harness.captured[0]!.spec).toMatchObject({ request: {} })
  })

  it('卸载后恢复原生 startActivation', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    expect(Object.hasOwn(harness.service, 'startActivation')).toBe(true)

    harness.disposers.forEach(dispose => dispose())
    expect(Object.hasOwn(harness.service, 'startActivation')).toBe(false)
    await expect(harness.delegate()).resolves.toEqual({ childId: 'child-1' })
  })

  it('卸载时保留后来由其他插件接管的方法', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    const foreign = vi.fn(async () => ({ childId: 'foreign' }))
    harness.service.startActivation = foreign

    harness.disposers.forEach(dispose => dispose())

    expect(harness.service.startActivation).toBe(foreign)
    await expect(harness.delegate()).resolves.toEqual({ childId: 'foreign' })
  })

  it('其他插件保留包装引用时，卸载后也停止路由', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    const patched = harness.service.startActivation
    const foreign = vi.fn((spec: Record<string, unknown>) => patched.call(harness.service, spec))
    harness.service.startActivation = foreign

    harness.disposers.forEach(dispose => dispose())
    await harness.delegate()

    expect(foreign).toHaveBeenCalledOnce()
    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
    expect(harness.captured[0]!.spec).toMatchObject({ request: {} })
    expect((harness.captured[0]!.spec as { request: { agentOptions?: unknown } }).request.agentOptions).toBeUndefined()
  })

  it('enabled: false 时完全不介入', async () => {
    const service = { startActivation: async () => ({ childId: 'x' }) }
    const original = service.startActivation
    apply(
      {
        logger: { info: vi.fn(), warn: vi.fn() },
        get: (name: string) => (name === 'subagents' ? { [symbols.original]: service } : undefined),
        inject: vi.fn(),
        effect: vi.fn(),
      } as never,
      { enabled: false, routesFile: '/nonexistent' },
    )
    expect(service.startActivation).toBe(original)
  })

  it('已被其他插件覆盖时让位并告警', async () => {
    const foreign = async () => ({ childId: 'foreign' })
    const service = { startActivation: foreign }
    const warnings: string[] = []
    const ctx = {
      logger: { info: vi.fn(), warn: (message: string) => warnings.push(message) },
      get: (name: string) => (name === 'subagents' ? { [symbols.original]: service } : undefined),
      inject: (_names: string[], callback: (context: unknown) => unknown) => callback(ctx),
      effect: vi.fn(),
    }
    apply(ctx as never, { routesFile: routeFile(TABLE) })

    expect(service.startActivation).toBe(foreign)
    expect(warnings.join('\n')).toContain('已被其他插件覆盖')
  })
})
