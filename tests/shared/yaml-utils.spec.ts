import { describe, expect, it } from 'vitest'
import { editRouteYaml, parseRouteYaml, parseSimpleRouteYaml, RouteYamlError, serializeRouteTable } from '../../src/shared/yaml-utils'

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

describe('共享 YAML 语法与结构校验', () => {
  it('读取 flow 格式、引号内的 # 与转义字符，路径保留原始拼写', () => {
    const text = String.raw`default: {provider: "null", model: "m # variant"}
routes: [{path: "~/work # archive/", provider: p, model: 'folder\model: v'}]
`
    expect(parseRouteYaml(text)).toEqual({
      fallback: { provider: 'null', model: 'm # variant' },
      routes: [{ path: '~/work # archive/', provider: 'p', model: String.raw`folder\model: v` }],
    })
  })

  it.each([
    'routes: [',
    'routes: []\n---\nroutes: []',
    'routes: []\nroutes: []',
    'unexpected: true',
    'routes: 5',
    'default: {provider: p}',
    'default: {provider: p, model: m, unknown: x}',
    'routes: [{path: /a, provider: p, model: false}]',
    'routes: [{path: /a}]',
    'routes: [{path: /a, reasoningEffort: high, unknown: x}]',
    'routes: [{path: "", reasoningEffort: high}]',
  ])('拒绝原先可能被简化解析器静默忽略的输入 %s', text => {
    expect(() => parseRouteYaml(text)).toThrow(RouteYamlError)
    expect(parseSimpleRouteYaml(text)).toMatchObject({ error: expect.any(String) })
    expect(parseSimpleRouteYaml(text).data).toBeUndefined()
  })

  it.each(['m # variant', 'm: variant', 'null', 'false', '123', '*ref', '[m]', '{m}', String.raw`folder\model`, '模型 "fast"'])('序列化后值不改变：%s', model => {
    const fallback = { provider: 'null', model, reasoningEffort: '123' }
    const routes = [{ path: '/work/repo # archived', provider: 'false', model }]
    expect(parseRouteYaml(serializeRouteTable(fallback, routes))).toEqual({ fallback, routes })
  })
})

describe('局部编辑 YAML', () => {
  const original = `# User header
default:
  provider: default-p # Provider note
  model: "m # fallback"
routes:
  # Archive rule
  - path: "~/work # archive/"
    provider: p
    model: 'm # variant' # Model note
  # Active rule
  - path: /work/current
    provider: old-p # Current provider
    model: old-m
# User footer
`

  it('追加一条规则时保留其他规则的值、路径拼写和注释', () => {
    const route = { path: '/work/new: repo', provider: 'null', model: 'm # new' }
    const result = editRouteYaml(original, { kind: 'route', index: 2, route })
    expect(parseRouteYaml(result)).toEqual({
      ...parseRouteYaml(original),
      routes: [...parseRouteYaml(original).routes, route],
    })
    for (const text of ['# User header', '# User footer', '# Archive rule', '# Active rule', '# Provider note', '# Model note', '"~/work # archive/"', "'m # variant'"]) {
      expect(result).toContain(text)
    }
  })

  it('只改变目标规则的字段，保留同一条规则中未改变字段的注释', () => {
    const result = editRouteYaml(original, { kind: 'route', index: 1, route: { path: '/work/current', provider: 'new-p', model: 'new-m' } })
    expect(parseRouteYaml(result).routes[1]).toEqual({ path: '/work/current', provider: 'new-p', model: 'new-m' })
    expect(result).toContain('# Current provider')
    expect(result).toContain("model: 'm # variant' # Model note")
    expect(result).toContain('model: "m # fallback"')
  })

  it('修改或移除全局默认不改变项目规则', () => {
    const next = { provider: 'next-p', model: 'next: m' }
    const edited = editRouteYaml(original, { kind: 'fallback', spec: next })
    expect(parseRouteYaml(edited)).toEqual({ fallback: next, routes: parseRouteYaml(original).routes })
    expect(edited).toContain('# Provider note')
    expect(edited).toContain('# Model note')
    const removed = editRouteYaml(edited, { kind: 'fallback' })
    expect(parseRouteYaml(removed)).toEqual({ fallback: undefined, routes: parseRouteYaml(original).routes })
    expect(removed).toContain('# User header')
    expect(removed).toContain('# Archive rule')
    expect(removed).toContain('# User footer')
  })

  it('删除单条规则时保留剩余条目及其注释', () => {
    const result = editRouteYaml(original, { kind: 'delete-route', index: 1 })
    expect(parseRouteYaml(result)).toEqual({ fallback: parseRouteYaml(original).fallback, routes: [parseRouteYaml(original).routes[0]] })
    expect(result).toContain('# Archive rule')
    expect(result).toContain('# Model note')
    expect(result).toContain('# User footer')
  })

  it.each(['', '# Comment only\n', 'null # Root comment\n', '{}', 'routes: null # Routes comment\n', 'routes: []', '{routes: []}'])('可向合法空表增加规则：%s', text => {
    const route = { path: '/work/a', reasoningEffort: 'high' }
    const result = editRouteYaml(text, { kind: 'route', index: 0, route })
    expect(parseRouteYaml(result)).toEqual({ fallback: undefined, routes: [route] })
    const comment = text.match(/#[^\n]*/)?.[0]
    if (comment !== undefined) expect(result).toContain(comment)
  })

  it('保留 flow 文档中未变的节点，并允许删除最后一条规则', () => {
    const text = '# Flow\n{default: {provider: p, model: "m # v"}, routes: [{path: /a, reasoningEffort: high}]} # End\n'
    const result = editRouteYaml(text, { kind: 'route', index: 0, route: { path: '/a', reasoningEffort: 'low' } })
    expect(parseRouteYaml(result)).toEqual({ fallback: { provider: 'p', model: 'm # v' }, routes: [{ path: '/a', reasoningEffort: 'low' }] })
    const empty = editRouteYaml(result, { kind: 'delete-route', index: 0 })
    expect(parseRouteYaml(empty)).toEqual({ fallback: { provider: 'p', model: 'm # v' }, routes: [] })
    expect(empty).toContain('# Flow')
    expect(empty).toContain('# End')
  })

  it('拒绝修改会影响其他规则的锚点，允许编辑不相关条目', () => {
    const text = 'routes:\n  - path: /a\n    reasoningEffort: &effort high\n  - path: /b\n    reasoningEffort: *effort\n'
    expect(() => editRouteYaml(text, { kind: 'route', index: 0, route: { path: '/a', reasoningEffort: 'low' } })).toThrow(/无法安全编辑/)
    expect(() => editRouteYaml(text, { kind: 'delete-route', index: 0 })).toThrow(/无法安全编辑/)
    const result = editRouteYaml(text, { kind: 'route', index: 2, route: { path: '/c', reasoningEffort: 'low' } })
    expect(parseRouteYaml(result).routes).toEqual([...parseRouteYaml(text).routes, { path: '/c', reasoningEffort: 'low' }])
    expect(result).toContain('&effort high')
    expect(result).toContain('*effort')
  })

  it('可读取但拒绝自动改写带未识别标签的 YAML', () => {
    const text = 'default: {provider: p, model: !custom m}\n'
    expect(parseRouteYaml(text).fallback?.model).toBe('m')
    expect(() => editRouteYaml(text, { kind: 'route', index: 0, route: { path: '/a', reasoningEffort: 'high' } })).toThrow(/无法安全编辑/)
  })

  it.each([-1, 3, 0.5])('拒绝失效索引 %s', index => {
    expect(() => editRouteYaml(original, { kind: 'route', index, route: { path: '/a', reasoningEffort: 'high' } })).toThrow(/位置无效/)
  })

  it('拒绝缺字段的更新，不能把无效草稿写成合法空值', () => {
    expect(() => editRouteYaml(original, { kind: 'fallback', spec: { provider: 'p' } })).toThrow(/必须同时/)
    expect(() => editRouteYaml(original, { kind: 'route', index: 0, route: { path: '/a', model: 'm' } })).toThrow(/必须同时/)
  })
})
