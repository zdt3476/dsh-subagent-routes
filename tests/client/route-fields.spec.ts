import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RouteFields, type RouteFieldsClasses } from '../../src/client/route-fields'
import { PANEL_CSS } from '../../src/client/panel-styles'
import { SETTINGS_CSS } from '../../src/client/styles'
import type { CatalogProviderGroup } from '../../src/shared/settings'

const CLASSES: RouteFieldsClasses = {
  grid: 'grid',
  field: 'field',
  fieldHead: 'head',
  label: 'label',
  link: 'link',
  input: 'input',
  select: 'select',
  hint: 'hint',
}

const CATALOG: CatalogProviderGroup[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      {
        id: 'o3',
        name: 'o3',
        reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }], defaultEffort: 'high' },
      },
    ],
  },
]

describe('RouteFields', () => {
  it('自定义厂商同名模型不会借用其他厂商元数据或退化成空白下拉', () => {
    const html = renderToStaticMarkup(h(RouteFields, {
      provider: 'my-gateway',
      model: 'gpt-4o',
      reasoningEffort: 'high',
      catalog: CATALOG,
      classes: CLASSES,
      onChange: () => undefined,
    }))
    // 厂商与模型都应处于手动输入框形态，且保留通用思考等级而不是被 openai/gpt-4o 禁用。
    expect(html).toContain('value="my-gateway"')
    expect(html).toContain('value="gpt-4o"')
    expect(html).toContain('通用思考等级档位')
    expect(html).not.toContain('该模型不支持思考等级')
  })

  it('未选厂商但模型在目录中时，跨厂商定位并联动专属思考档位', () => {
    const html = renderToStaticMarkup(h(RouteFields, {
      provider: '',
      model: 'o3',
      reasoningEffort: 'high',
      catalog: CATALOG,
      classes: CLASSES,
      onChange: () => undefined,
    }))
    expect(html).toContain('已智能联动该模型支持的专属思考档位')
  })
})

describe('样式表卫生', () => {
  it('设置页样式表为 sr-hint.is-warn 提供可见警告色', () => {
    expect(SETTINGS_CSS).toContain('.sr-hint.is-warn')
  })

  it('面板样式表不再残留废弃的旧浮层选择器', () => {
    expect(PANEL_CSS).not.toContain('.sr-popover-anchor')
    expect(PANEL_CSS).not.toContain('.srp-close-btn')
  })
})
