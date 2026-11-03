import { describe, expect, it } from 'vitest'
import { isEmptyRoute, isRoutePinned, normalizeOverride, resolveEffective } from '../../src/shared/overrides'

describe('isRoutePinned', () => {
  it('provider 或 model 任一存在就算点名', () => {
    expect(isRoutePinned({ provider: 'p', model: 'm' })).toBe(true)
    expect(isRoutePinned({ provider: 'p' })).toBe(true)
    expect(isRoutePinned({ model: 'm' })).toBe(true)
  })

  it('只有思考等级不算点名', () => {
    expect(isRoutePinned({ reasoningEffort: 'high' })).toBe(false)
  })

  it('undefined 为假', () => {
    expect(isRoutePinned(undefined)).toBe(false)
  })
})

describe('isEmptyRoute', () => {
  it('undefined 与空对象都是空', () => {
    expect(isEmptyRoute(undefined)).toBe(true)
    expect(isEmptyRoute({})).toBe(true)
  })

  it('任一字段存在即非空', () => {
    expect(isEmptyRoute({ reasoningEffort: 'low' })).toBe(false)
  })
})

describe('resolveEffective', () => {
  const workspace = {
    spec: { provider: 'ws-provider', model: 'ws-model', reasoningEffort: 'max' },
    path: '/work/app',
  }

  it('三层都空时让位', () => {
    expect(resolveEffective({})).toBeUndefined()
  })

  it('调用方点名模型时完全让位，即使会话有覆盖', () => {
    expect(
      resolveEffective({
        explicit: { provider: 'caller-p', model: 'caller-m' },
        override: { provider: 'sess-p', model: 'sess-m' },
        workspace,
      }),
    ).toBeUndefined()
  })

  it('调用方只给 provider 时也让位（避免半套组合）', () => {
    expect(resolveEffective({ explicit: { provider: 'caller-p' }, workspace })).toBeUndefined()
  })

  it('会话覆盖优先于工作区路由', () => {
    expect(
      resolveEffective({
        override: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' },
        workspace,
      }),
    ).toEqual({ source: 'session', spec: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' } })
  })

  it('没有会话覆盖时用工作区路由，并带上命中的目录前缀', () => {
    expect(resolveEffective({ workspace })).toEqual({
      source: 'workspace',
      spec: { provider: 'ws-provider', model: 'ws-model', reasoningEffort: 'max' },
      workspacePath: '/work/app',
    })
  })

  it('工作区无 path 时报告 fallback 来源', () => {
    expect(resolveEffective({ workspace: { spec: { provider: 'p', model: 'm' } } })).toEqual({
      source: 'fallback',
      spec: { provider: 'p', model: 'm' },
    })
  })

  it('调用方给了等级时，会话覆盖不覆盖该等级', () => {
    expect(
      resolveEffective({
        explicit: { reasoningEffort: 'medium' },
        override: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'max' },
        workspace,
      }),
    ).toEqual({ source: 'session', spec: { provider: 'sess-p', model: 'sess-m' } })
  })

  it('调用方给了等级时，工作区路由也不覆盖该等级', () => {
    expect(resolveEffective({ explicit: { reasoningEffort: 'medium' }, workspace })).toEqual({
      source: 'workspace',
      spec: { provider: 'ws-provider', model: 'ws-model' },
      workspacePath: '/work/app',
    })
  })

  it('会话覆盖只设等级时，仍压过工作区的完整路由', () => {
    expect(resolveEffective({ override: { reasoningEffort: 'low' }, workspace })).toEqual({
      source: 'session',
      spec: { reasoningEffort: 'low' },
    })
  })

  it('只有调用方等级时没有可注入内容（调用方自己的等级已在请求里）', () => {
    expect(resolveEffective({ explicit: { reasoningEffort: 'high' } })).toBeUndefined()
  })

  it('会话覆盖为空对象时视作没有覆盖', () => {
    expect(resolveEffective({ override: {}, workspace })).toMatchObject({ source: 'workspace' })
  })

  it('会话覆盖只补调用方缺的那部分字段', () => {
    expect(
      resolveEffective({
        explicit: { provider: 'caller-p', model: 'caller-m' },
        override: { provider: 'sess-p', model: 'sess-m' },
      }),
    ).toBeUndefined()
  })
})

describe('normalizeOverride', () => {
  it('去掉首尾空白', () => {
    expect(normalizeOverride({ provider: ' p ', model: ' m ', reasoningEffort: ' high ' })).toEqual({
      provider: 'p',
      model: 'm',
      reasoningEffort: 'high',
    })
  })

  it('全空视为清除', () => {
    expect(normalizeOverride({})).toBeUndefined()
    expect(normalizeOverride({ provider: '  ', model: '  ' })).toBeUndefined()
  })

  it('只有 provider 时拒绝', () => {
    expect(() => normalizeOverride({ provider: 'p' })).toThrow('provider 与 model 必须同时提供')
  })

  it('只有 model 时拒绝', () => {
    expect(() => normalizeOverride({ model: 'm' })).toThrow('provider 与 model 必须同时提供')
  })

  it('只给等级是合法的', () => {
    expect(normalizeOverride({ reasoningEffort: 'max' })).toEqual({ reasoningEffort: 'max' })
  })
})
