import { describe, expect, it } from 'vitest'
import {
  isEmptyRoute,
  isRoutePinned,
  normalizeOverride,
  normalizeSessionRecord,
  resolveEffective,
} from '../../src/shared/overrides'

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

const custom = { mode: 'custom' as const }
const inherit = { mode: 'inherit' as const }

describe('resolveEffective', () => {
  const workspace = {
    spec: { provider: 'ws-provider', model: 'ws-model', reasoningEffort: 'max' },
    path: '/work/app',
  }

  it('三层都空时让位', () => {
    expect(resolveEffective({})).toBeUndefined()
  })

  it('调用方点名模型时完全让位，即使会话有指定', () => {
    expect(
      resolveEffective({
        explicit: { provider: 'caller-p', model: 'caller-m' },
        session: { ...custom, provider: 'sess-p', model: 'sess-m' },
        workspace,
      }),
    ).toBeUndefined()
  })

  it('调用方只给 provider 时也让位（避免半套组合）', () => {
    expect(resolveEffective({ explicit: { provider: 'caller-p' }, workspace })).toBeUndefined()
  })

  it('会话指定优先于工作区路由', () => {
    expect(
      resolveEffective({
        session: { ...custom, provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' },
        workspace,
      }),
    ).toEqual({ source: 'session', spec: { provider: 'sess-p', model: 'sess-m', reasoningEffort: 'low' } })
  })

  it('没有会话指定时用工作区路由，并带上命中的目录前缀', () => {
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

  it('调用方给了等级时，会话指定不覆盖该等级', () => {
    expect(
      resolveEffective({
        explicit: { reasoningEffort: 'medium' },
        session: { ...custom, provider: 'sess-p', model: 'sess-m', reasoningEffort: 'max' },
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

  it('会话指定只设等级时，仍压过工作区的完整路由', () => {
    expect(resolveEffective({ session: { ...custom, reasoningEffort: 'low' }, workspace })).toEqual({
      source: 'session',
      spec: { reasoningEffort: 'low' },
    })
  })

  it('只有调用方等级时没有可注入内容（调用方自己的等级已在请求里）', () => {
    expect(resolveEffective({ explicit: { reasoningEffort: 'high' } })).toBeUndefined()
  })

  it('没有会话记录时视作跟随全局策略', () => {
    expect(resolveEffective({ session: undefined, workspace })).toMatchObject({ source: 'workspace' })
  })

  it('会话选择继承时直接让位，即使工作区有规则', () => {
    expect(resolveEffective({ session: inherit, workspace })).toBeUndefined()
  })

  it('全局策略为继承时让位，连全局兜底也不注入', () => {
    expect(resolveEffective({ workspace, defaultPolicy: 'inherit' })).toBeUndefined()
    expect(
      resolveEffective({ workspace: { spec: { provider: 'p', model: 'm' } }, defaultPolicy: 'inherit' }),
    ).toBeUndefined()
  })

  it('全局策略为继承时，会话显式指定依然生效', () => {
    expect(
      resolveEffective({
        session: { ...custom, provider: 'sess-p', model: 'sess-m' },
        workspace,
        defaultPolicy: 'inherit',
      }),
    ).toEqual({ source: 'session', spec: { provider: 'sess-p', model: 'sess-m' } })
  })

  it('全局策略默认仍是按规则走，保持升级前的行为', () => {
    expect(resolveEffective({ workspace })).toMatchObject({ source: 'workspace' })
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

describe('normalizeSessionRecord', () => {
  it('follow 一律得到「没有记录」，空 spec 也不报错', () => {
    expect(normalizeSessionRecord('follow')).toBeUndefined()
    expect(normalizeSessionRecord('follow', null)).toBeUndefined()
  })

  it('follow 带指定值时拒绝', () => {
    expect(() => normalizeSessionRecord('follow', { provider: 'p', model: 'm' })).toThrow('跟随全局策略')
  })

  it('inherit 得到继承记录', () => {
    expect(normalizeSessionRecord('inherit')).toEqual({ mode: 'inherit' })
  })

  it('inherit 带指定值时拒绝', () => {
    expect(() => normalizeSessionRecord('inherit', { reasoningEffort: 'high' })).toThrow('继承主代理模型')
  })

  it('custom 规范化路由字段', () => {
    expect(normalizeSessionRecord('custom', { provider: ' p ', model: ' m ' })).toEqual({
      mode: 'custom',
      provider: 'p',
      model: 'm',
    })
  })

  it('custom 全空视作清除，与 follow 等价', () => {
    expect(normalizeSessionRecord('custom', {})).toBeUndefined()
    expect(normalizeSessionRecord('custom', null)).toBeUndefined()
  })

  it('custom 半套路由被拒绝', () => {
    expect(() => normalizeSessionRecord('custom', { model: 'm' })).toThrow('provider 与 model 必须同时提供')
  })

  it('未知模式被拒绝', () => {
    expect(() => normalizeSessionRecord('nope' as never)).toThrow('未知的会话模式')
  })
})
