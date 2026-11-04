import type { CatalogModel, CatalogProviderGroup } from '../shared/settings'

/**
 * 模型下拉的选项值同时编码厂商与模型 id。
 *
 * 不同厂商可能存在同名模型（例如 `gpt-4o` 同时挂在原生通道与自建代理上），
 * 只用模型 id 做 value 会让两者互相覆盖，选中的实际厂商也就无从回填。
 * JSON 元组避免分隔符碰撞，也避免构建产物包含物理 NUL 字节。
 */
export function encodeModelKey(provider: string, model: string): string {
  return JSON.stringify([provider, model])
}

export function decodeModelKey(key: string): { provider: string; model: string } | undefined {
  try {
    const tuple: unknown = JSON.parse(key)
    if (!Array.isArray(tuple) || tuple.length !== 2 || tuple.some(value => typeof value !== 'string')) return undefined
    return { provider: tuple[0], model: tuple[1] }
  } catch {
    return undefined
  }
}

/** 在整份目录里定位模型；未选厂商时也要据此解析思考等级元数据。 */
export function locateModel(
  catalog: readonly CatalogProviderGroup[] | undefined,
  model: string,
): { group: CatalogProviderGroup; entry: CatalogModel } | undefined {
  if (!catalog || model === '') return undefined
  for (const group of catalog) {
    const entry = group.models.find(item => item.id === model)
    if (entry !== undefined) return { group, entry }
  }
  return undefined
}

/**
 * 依据模型元数据校正思考等级：模型不支持推理时清空，支持的档位里没有当前值时落到推荐默认。
 * `target` 缺失表示模型未知（手动输入的 ID），此时保留用户已选等级。
 */
export function resetEffortFor(currentEffort: string, target: CatalogModel | undefined): string {
  if (target === undefined) return currentEffort
  const efforts = target.reasoning?.efforts
  if (!efforts || efforts.length === 0) return ''
  if (currentEffort !== '' && efforts.some(effort => effort.id === currentEffort)) return currentEffort
  return target.reasoning?.defaultEffort ?? ''
}
