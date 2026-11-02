import { describe, expect, it } from 'vitest'
import { parseSimpleRouteYaml, serializeRouteTable } from '../../src/shared/yaml-utils'

describe('yaml-utils', () => {
  it('序列化空路由表', () => {
    const yaml = serializeRouteTable(undefined, [])
    expect(yaml).toContain('routes: []')
    expect(yaml).not.toContain('default:')
  })

  it('序列化带 fallback 和 routes 的完整表', () => {
    const yaml = serializeRouteTable(
      { provider: 'acme', model: 'acme-fast', reasoningEffort: 'low' },
      [
        { path: '~/Code/frontend', provider: 'acme-gateway', model: 'acme-large', reasoningEffort: 'max' },
        { path: '~/Code/research', reasoningEffort: 'high' },
      ],
    )
    expect(yaml).toContain('default:')
    expect(yaml).toContain('  provider: acme')
    expect(yaml).toContain('  model: acme-fast')
    expect(yaml).toContain('  reasoningEffort: low')
    expect(yaml).toContain('routes:')
    expect(yaml).toContain('  - path: ~/Code/frontend')
    expect(yaml).toContain('    provider: acme-gateway')
    expect(yaml).toContain('  - path: ~/Code/research')
    expect(yaml).toContain('    reasoningEffort: high')
  })

  it('解析空文本', () => {
    const res = parseSimpleRouteYaml('')
    expect(res.data).toEqual({ fallback: undefined, routes: [] })
  })

  it('解析标准 default 与 routes', () => {
    const text = `
default:
  provider: openai
  model: gpt-4o
routes:
  - path: /root/my-app
    provider: anthropic
    model: claude-3-5
    reasoningEffort: high
  - path: /root/legacy
    reasoningEffort: low
`
    const res = parseSimpleRouteYaml(text)
    expect(res.data?.fallback).toEqual({ provider: 'openai', model: 'gpt-4o' })
    expect(res.data?.routes).toHaveLength(2)
    expect(res.data?.routes[0]).toEqual({
      path: '/root/my-app',
      provider: 'anthropic',
      model: 'claude-3-5',
      reasoningEffort: 'high',
    })
    expect(res.data?.routes[1]).toEqual({
      path: '/root/legacy',
      reasoningEffort: 'low',
    })
  })
})
