import { describe, expect, it } from 'vitest'
import { internals } from '../../src/client/panel'
import { describeRoute } from '../../src/client/route-text'

const { describe: describeSpec, SOURCE_TEXT } = internals

describe('生效值描述', () => {
  it('没有路由时说明是继承', () => {
    expect(describeSpec(undefined)).toBe('继承主代理')
    expect(describeSpec({})).toBe('继承主代理')
  })

  it('只有模型时只显示模型', () => {
    expect(describeSpec({ provider: 'openai', model: 'gpt-5' })).toBe('openai / gpt-5')
  })

  it('带思考等级时附在后面', () => {
    expect(describeSpec({ provider: 'openai', model: 'gpt-5', reasoningEffort: 'high' }))
      .toBe('openai / gpt-5 · high')
  })

  it('只有等级时如实说明只有等级', () => {
    expect(describeSpec({ reasoningEffort: 'max' })).toBe('思考等级 max')
  })

  it('缺一半 provider/model 时不拼出半个路由', () => {
    expect(describeSpec({ provider: 'openai' })).toBe('继承主代理')
    expect(describeSpec({ model: 'gpt-5' })).toBe('继承主代理')
  })
})

describe('来源文案', () => {
  it('每个来源都有可读标签与解释', () => {
    for (const source of ['caller', 'session', 'workspace', 'fallback', 'inherit'] as const) {
      expect(SOURCE_TEXT[source].label).toBeTruthy()
      expect(SOURCE_TEXT[source].hint).toBeTruthy()
    }
  })

  it('会话来源明确说明优先于项目规则', () => {
    expect(SOURCE_TEXT.session.hint).toContain('优先于项目规则')
  })
})

describe('RoutePanel 渲染与变体', () => {
  it('未加载完成时首帧呈现骨架屏', async () => {
    const { RoutePanel } = await import('../../src/client/panel')
    const { createElement: h } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')

    const html = renderToStaticMarkup(h(RoutePanel, { sessionId: 's1' }))
    expect(html).toContain('srp-skeleton')
    expect(html).toContain('子代理模型')
    expect(html).toContain('class="sr-panel"')
    expect(html).not.toContain('class="sr-panel is-popover"')
  })

  it('侧栏面板不再渲染浮层的关闭按钮与 is-popover 修饰（浮层已独立成组件）', async () => {
    const { RoutePanel } = await import('../../src/client/panel')
    const { createElement: h } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')

    const html = renderToStaticMarkup(h(RoutePanel, { sessionId: 's1' }))
    // 样式表里仍有浮层规则（那是给 popover-panel 用的），这里只看 DOM 上的类名
    expect(html).not.toContain('class="sr-panel is-popover"')
    expect(html).not.toContain('srp-close-btn"')
  })
})

describe('药丸高亮与来源描述', () => {

  const snapshot = (overrides: Record<string, unknown>) => ({
    sessionId: 's1',
    tableAvailable: true,
    enabled: true,
    mode: 'follow' as const,
    defaultPolicy: 'rules' as const,
    ...overrides,
  }) as never

  it('没有会话记录时不亮起：跟随全局策略与「从来没配过」必须长得一样', () => {
    expect(describeRoute(snapshot({})).isOverride).toBe(false)
  })

  it('会话选了继承也亮起：它确实压过了全局策略', () => {
    expect(describeRoute(snapshot({ mode: 'inherit', session: { mode: 'inherit' } })).isOverride).toBe(true)
  })

  it('会话指定一套时亮起', () => {
    const result = describeRoute(snapshot({
      mode: 'custom',
      session: { mode: 'custom', provider: 'p', model: 'm' },
      effective: { source: 'session', spec: { provider: 'p', model: 'm' } },
    }))
    expect(result.isOverride).toBe(true)
    expect(result.label).toBe('p / m')
    expect(result.sourceLabel).toBe(SOURCE_TEXT.session.label)
  })

  it('全局策略为继承且没有会话记录时，描述为继承主代理', () => {
    const result = describeRoute(snapshot({ defaultPolicy: 'inherit' }))
    expect(result.label).toBe('继承主代理')
    expect(result.sourceLabel).toBe(SOURCE_TEXT.inherit.label)
  })
})
