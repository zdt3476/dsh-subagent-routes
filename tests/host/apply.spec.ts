import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { symbols } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../../src/host/index'

/** 记录派活调用，并按当前 DSH 的能力校验契约拒绝不支持的 agentOptions。 */
interface Captured {
  spec: Record<string, unknown>
}

interface FakeProvider {
  capabilities?: { agentOptions?: boolean }
}

/**
 * 模拟 DSH 的 SubagentRuntime：startActivation 定义在原型上而不是实例自身上。
 * 该差异是插件拦截方式的关键；入口还按 provider 的能力声明验证 agentOptions，
 * 若插件注入了不支持的字段，会按宿主契约以 UNSUPPORTED_CAPABILITY 拒绝启动。
 */
class FakeSubagents {
  readonly captured: Captured[] = []
  readonly attempted: Captured[] = []

  constructor(private readonly providers: Record<string, FakeProvider | undefined>) {}

  getProvider(name: string): FakeProvider | undefined {
    return this.providers[name]
  }

  async startActivation(spec: Record<string, unknown>): Promise<unknown> {
    this.attempted.push({ spec })
    const request = 'parent' in spec ? spec : spec.request as Record<string, unknown> | undefined
    const agentOptions = request?.agentOptions
    const provider = this.providers[String(spec.provider)]
    if (provider === undefined) throw Object.assign(new Error(`no subagent provider registered for "${String(spec.provider)}"`), { code: 'NO_PROVIDER' })
    if (agentOptions !== undefined && provider.capabilities?.agentOptions !== true) {
      throw Object.assign(new Error(`subagent provider "${String(spec.provider)}" does not support the "agentOptions" capability`), {
        code: 'UNSUPPORTED_CAPABILITY',
      })
    }
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
  providers?: Record<string, FakeProvider | undefined>
  exposeProviderLookup?: boolean
}) {
  const warnings: string[] = []
  const infos: string[] = []

  const service = new FakeSubagents(options.providers ?? {
    spawn: { capabilities: { agentOptions: true } },
    external: { capabilities: { agentOptions: false } },
    unknownCapabilities: {},
  })
  if (options.exposeProviderLookup === false) {
    Object.defineProperty(service, 'getProvider', { value: undefined })
  }
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

  const makeActivation = () => ({
    provider: 'spawn',
    label: 'work',
    signal: new AbortController().signal,
    delivery: 'parent',
    parent: { session: { header: { cwd: options.directory ?? '/work/frontend/src' } } },
    prompt: [{ type: 'text', text: 'work' }],
    ...(options.explicitOptions === undefined ? {} : { agentOptions: options.explicitOptions }),
  })

  const delegate = (): Promise<unknown> => {
    const { parent, prompt, agentOptions, ...activation } = makeActivation()
    return service.startActivation({ ...activation, request: { parent, prompt, agentOptions } })
  }

  return {
    captured: service.captured,
    warnings,
    infos,
    service,
    llm,
    disposers,
    delegate,
    makeActivation,
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

describe('DSH 顶层派活参数', () => {
  it('空路由表时将原始派活请求交给宿主', async () => {
    const harness = createHarness({ routesFile: routeFile('routes: []') })
    const spec = harness.makeActivation()

    await expect(harness.service.startActivation(spec)).resolves.toEqual({ childId: 'child-1' })

    expect(harness.captured[0]!.spec).toBe(spec)
    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('用顶层 cwd 匹配路由，只改写顶层 agentOptions', async () => {
    const harness = createHarness({
      routesFile: routeFile(TABLE),
      directory: '/work',
      explicitOptions: { maxTokens: 4096 },
    })
    const spec = { ...harness.makeActivation(), cwd: 'frontend/src', name: 'worker', childId: 'reserved' }

    await harness.service.startActivation(spec)

    const route = { provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' }
    const routed = harness.captured[0]!.spec
    expect(routed).toStrictEqual({ ...spec, agentOptions: { maxTokens: 4096, ...route } })
    expect(routed.parent).toBe(spec.parent)
    expect(harness.llm.resolveCallConfig).toHaveBeenCalledWith(route, spec.signal)
  })

  it('保留顶层调用方显式指定的模型', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE), explicitOptions: { provider: 'p', model: 'm' } })
    const spec = harness.makeActivation()
    await harness.service.startActivation(spec)

    expect(harness.captured[0]!.spec).toBe(spec)
    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('无法识别请求结构时交还宿主处理', async () => {
    const harness = createHarness({ routesFile: routeFile(TABLE) })
    const spec = { provider: 'spawn', request: undefined }
    await harness.service.startActivation(spec)

    expect(harness.captured[0]!.spec).toBe(spec)
    expect(harness.llm.resolveCallConfig).not.toHaveBeenCalled()
  })
})

describe.each(['flat', 'legacy'] as const)('派活后端能力（%s）', shape => {
  function activation(harness: ReturnType<typeof createHarness>, backend: string): Record<string, unknown> {
    const spec = { ...harness.makeActivation(), provider: backend }
    if (shape === 'flat') return spec
    const { parent, prompt, agentOptions, ...outer } = spec
    return { ...outer, request: { parent, prompt, ...(agentOptions === undefined ? {} : { agentOptions }) } }
  }

  it('后端支持 agentOptions 时继续路由并通过宿主能力检查', async () => {
    const h = createHarness({ routesFile: routeFile(TABLE) })
    const original = activation(h, 'spawn')
    await expect(h.service.startActivation(original)).resolves.toEqual({ childId: 'child-1' })
    expect(h.service.attempted).toHaveLength(1)
    const spec = h.captured[0]!.spec
    const routed = (shape === 'flat' ? spec : spec.request) as Record<string, unknown>
    expect(routed.agentOptions).toEqual({ provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' })
    expect(h.llm.resolveCallConfig).toHaveBeenCalledOnce()
  })

  it.each([true, false])('外部后端不支持时原样启动，无论 preflight=%s', async preflight => {
    const h = createHarness({ routesFile: routeFile(TABLE), preflight, rejectPreflight: new Error('不应进行模型预检') })
    const original = activation(h, 'external')
    await expect(h.service.startActivation(original)).resolves.toEqual({ childId: 'child-1' })
    expect(h.service.attempted).toHaveLength(1)
    expect(h.captured).toHaveLength(1)
    expect(h.captured[0]!.spec).toBe(original)
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
    expect(h.infos).toEqual([])
  })

  it('能力未声明时不注入，并将原请求交给已登记后端', async () => {
    const h = createHarness({ routesFile: routeFile(TABLE) })
    const original = activation(h, 'unknownCapabilities')
    await h.service.startActivation(original)
    expect(h.service.attempted).toHaveLength(1)
    expect(h.captured[0]!.spec).toBe(original)
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('旧宿主没有公开能力查询时原样派活', async () => {
    const h = createHarness({ routesFile: routeFile(TABLE), exposeProviderLookup: false })
    const original = activation(h, 'spawn')
    await h.service.startActivation(original)
    expect(h.service.attempted).toHaveLength(1)
    expect(h.captured[0]!.spec).toBe(original)
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('调用方主动传入不支持的选项时保留宿主错误，不重试或删除选项', async () => {
    const explicitOptions = { provider: 'caller-p', model: 'caller-m', maxTokens: 2048 }
    const h = createHarness({ routesFile: routeFile(TABLE), explicitOptions })
    const original = activation(h, 'external')
    await expect(h.service.startActivation(original)).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' })
    expect(h.service.attempted).toHaveLength(1)
    expect(h.service.attempted[0]!.spec).toBe(original)
    expect(h.captured).toEqual([])
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })

  it('未知后端由宿主按原生契约拒绝，不先报模型路由错误', async () => {
    const h = createHarness({ routesFile: routeFile(TABLE), rejectPreflight: new Error('不应进行模型预检') })
    const original = activation(h, 'not-registered')
    await expect(h.service.startActivation(original)).rejects.toMatchObject({ code: 'NO_PROVIDER' })
    expect(h.service.attempted).toHaveLength(1)
    expect(h.service.attempted[0]!.spec).toBe(original)
    expect(h.llm.resolveCallConfig).not.toHaveBeenCalled()
  })
})

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
