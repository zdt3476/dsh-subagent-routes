import { describe, expect, it } from 'vitest'
import { decodeModelKey, encodeModelKey, locateModel, resetEffortFor } from '../../src/client/catalog'
import type { CatalogProviderGroup } from '../../src/shared/settings'

const CATALOG: CatalogProviderGroup[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    models: [
      {
        id: 'reasoner',
        name: 'Reasoner',
        reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'max', name: 'Max' }], defaultEffort: 'low' },
      },
      { id: 'chat', name: 'Chat' },
    ],
  },
  { id: 'beta', name: 'Beta', models: [{ id: 'reasoner', name: 'Beta Reasoner' }] },
]

describe('模型目录工具', () => {
  it('编码与解码保留厂商，避免同名模型互相覆盖', () => {
    const key = encodeModelKey('alpha', 'reasoner')
    expect(decodeModelKey(key)).toEqual({ provider: 'alpha', model: 'reasoner' })
    expect(encodeModelKey('alpha', 'reasoner')).not.toBe(encodeModelKey('beta', 'reasoner'))
  })

  it('任意特殊字符无碰撞且选项值不含物理 NUL', () => {
    const provider = 'p\u0000:["/中文'
    const model = 'm\u0000:]"/中文'
    const key = encodeModelKey(provider, model)
    expect(key).not.toContain('\u0000')
    expect(decodeModelKey(key)).toEqual({ provider, model })
    expect(encodeModelKey('a', 'b:c')).not.toBe(encodeModelKey('a:b', 'c'))
    expect(decodeModelKey('["a", 1]')).toBeUndefined()
    expect(decodeModelKey('["a", "b", "c"]')).toBeUndefined()
  })

  it('拒绝无法识别的选项值', () => {
    expect(decodeModelKey('__custom__')).toBeUndefined()
    expect(decodeModelKey('')).toBeUndefined()
  })

  it('跨厂商定位模型，供未选厂商时解析元数据', () => {
    expect(locateModel(CATALOG, 'chat')?.group.id).toBe('alpha')
    expect(locateModel(CATALOG, '')?.entry.id).toBeUndefined()
    expect(locateModel(undefined, 'chat')).toBeUndefined()
    expect(locateModel(CATALOG, 'missing')).toBeUndefined()
  })

  it('模型不支持思考等级时清空', () => {
    expect(resetEffortFor('high', CATALOG[0]?.models[1])).toBe('')
  })

  it('保留模型支持的等级，不支持的落到推荐默认', () => {
    const reasoner = CATALOG[0]?.models[0]
    expect(resetEffortFor('max', reasoner)).toBe('max')
    expect(resetEffortFor('medium', reasoner)).toBe('low')
    expect(resetEffortFor('', reasoner)).toBe('low')
  })

  it('模型未知（手动输入的 ID）时保留用户已选等级', () => {
    expect(resetEffortFor('high', undefined)).toBe('high')
  })
})
