import { describe, expect, it } from 'vitest'
import { mergeAgentOptions, resolveDirectory, routeOverride } from '../../src/host/index'
import { parseRouteTable } from '../../src/host/routes'

const table = parseRouteTable(
  [
    'default:',
    '  provider: fallback-provider',
    '  model: fallback-model',
    '  reasoningEffort: low',
    'routes:',
    '  - path: /work/frontend',
    '    provider: acme-gateway',
    '    model: acme-large',
    '    reasoningEffort: max',
    '  - path: /work/backend',
    '    provider: acme',
    '    model: acme-fast',
  ].join('\n'),
  '/Users/tester',
)

describe('routeOverride', () => {
  it('命中工作区时给出完整路由', () => {
    expect(routeOverride(undefined, table, '/work/frontend/src')).toEqual({
      provider: 'acme-gateway',
      model: 'acme-large',
      reasoningEffort: 'max',
    })
  })

  it('未命中具体目录时回落到 default', () => {
    expect(routeOverride(undefined, table, '/work/other')).toEqual({
      provider: 'fallback-provider',
      model: 'fallback-model',
      reasoningEffort: 'low',
    })
  })

  it('调用方显式点名 provider/model 时完全让位', () => {
    expect(
      routeOverride({ provider: 'custom', model: 'custom-model' }, table, '/work/frontend'),
    ).toBeUndefined()
  })

  it('调用方只点名了 thinking 等级时仍补路由，但不覆盖其等级', () => {
    expect(routeOverride({ reasoningEffort: 'medium' }, table, '/work/frontend')).toEqual({
      provider: 'acme-gateway',
      model: 'acme-large',
    })
  })

  it('工作区条目没写等级时也不臆造等级', () => {
    expect(routeOverride(undefined, table, '/work/backend')).toEqual({
      provider: 'acme',
      model: 'acme-fast',
    })
  })

  it('只有 default 但没有匹配时仍返回 default（default 即兜底）', () => {
    const onlyDefault = parseRouteTable('default:\n  reasoningEffort: high', '/Users/tester')
    expect(routeOverride(undefined, onlyDefault, '/anywhere')).toEqual({ reasoningEffort: 'high' })
  })

  it('空表不给任何覆盖', () => {
    expect(routeOverride(undefined, { fallback: undefined, routes: [] }, '/work/frontend')).toBeUndefined()
  })
})

describe('mergeAgentOptions', () => {
  it('保留 maxTokens 等未知字段', () => {
    expect(mergeAgentOptions({ maxTokens: 4096 }, { provider: 'p', model: 'm', reasoningEffort: 'high' })).toEqual({
      maxTokens: 4096,
      provider: 'p',
      model: 'm',
      reasoningEffort: 'high',
    })
  })

  it('换路由时保留调用方显式指定的等级', () => {
    expect(mergeAgentOptions({ reasoningEffort: 'low' }, { provider: 'p', model: 'm' })).toEqual({
      provider: 'p',
      model: 'm',
      reasoningEffort: 'low',
    })
  })

  it('未显式指定等级时不为新路由补入父会话等级', () => {
    expect(mergeAgentOptions(undefined, { provider: 'p', model: 'm' })).toEqual({
      provider: 'p',
      model: 'm',
    })
  })

  it('只改等级时保留原 provider/model', () => {
    expect(mergeAgentOptions({ provider: 'p', model: 'm', reasoningEffort: 'low' }, { reasoningEffort: 'max' })).toEqual({
      provider: 'p',
      model: 'm',
      reasoningEffort: 'max',
    })
  })

  it('undefined 输入等价于空对象', () => {
    expect(mergeAgentOptions(undefined, { reasoningEffort: 'high' })).toEqual({ reasoningEffort: 'high' })
  })
})

describe('resolveDirectory', () => {
  const request = (cwd?: string, headerCwd?: string) => ({
    cwd,
    parent: { session: headerCwd === undefined ? {} : { header: { cwd: headerCwd } } },
  })

  it('优先使用 workingDirectory 投影', () => {
    const workingDirectory = { get: () => '/project/current' }
    expect(resolveDirectory(request(undefined, '/project/original'), workingDirectory)).toBe('/project/current')
  })

  it('没有投影时回落到会话头目录', () => {
    expect(resolveDirectory(request(undefined, '/project/original'), undefined)).toBe('/project/original')
  })

  it('显式绝对 cwd 直接采用', () => {
    expect(resolveDirectory(request('/elsewhere'), { get: () => '/project/current' })).toBe('/elsewhere')
  })

  it('相对 cwd 相对当前目录解析', () => {
    expect(resolveDirectory(request('sub/dir'), { get: () => '/project/current' })).toBe('/project/current/sub/dir')
  })

  it('拿不到目录时返回 undefined', () => {
    expect(resolveDirectory(request(undefined, undefined), undefined)).toBeUndefined()
  })
})
