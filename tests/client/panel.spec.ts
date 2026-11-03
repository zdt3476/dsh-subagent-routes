import { describe, expect, it } from 'vitest'
import { internals } from '../../src/client/panel'

const { describe: describeRoute, SOURCE_TEXT } = internals

describe('生效值描述', () => {
  it('没有路由时说明是继承', () => {
    expect(describeRoute(undefined)).toBe('继承主会话')
    expect(describeRoute({})).toBe('继承主会话')
  })

  it('只有模型时只显示模型', () => {
    expect(describeRoute({ provider: 'openai', model: 'gpt-5' })).toBe('openai / gpt-5')
  })

  it('带思考等级时附在后面', () => {
    expect(describeRoute({ provider: 'openai', model: 'gpt-5', reasoningEffort: 'high' }))
      .toBe('openai / gpt-5 · high')
  })

  it('只有等级时如实说明只有等级', () => {
    expect(describeRoute({ reasoningEffort: 'max' })).toBe('思考等级 max')
  })

  it('缺一半 provider/model 时不拼出半个路由', () => {
    expect(describeRoute({ provider: 'openai' })).toBe('继承主会话')
    expect(describeRoute({ model: 'gpt-5' })).toBe('继承主会话')
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
