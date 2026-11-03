/**
 * 三级联动的模型选择器：Provider → Model → 思考等级。
 *
 * 设置页与侧边栏控制台共用同一份实现，只在样式类名与文案上参数化；
 * 两处各自维护一套联动规则迟早会分叉（例如一边会跟着模型清空等级、另一边不会）。
 *
 * 联动规则：
 * 1. Provider：默认从宿主已探测的列表里选，没有目录时退回手动输入；
 * 2. Model：未选 Provider 时按厂商分组列出全部模型，选中即回填 Provider；
 * 3. 思考等级：跟随所选模型的真实元数据——不支持则禁用并清空，支持则只列该模型的档位。
 */

import { createElement as h, useId, useState, type ReactElement } from 'react'
import type { CatalogProviderGroup } from '../shared/settings'
import { decodeModelKey, encodeModelKey, locateModel, resetEffortFor } from './catalog'

/** 选择器用到的样式类名，由调用方决定落在哪套命名空间下。 */
export interface RouteFieldsClasses {
  /** 外层容器：由调用方决定是横向三列还是纵向堆叠。 */
  grid: string
  field: string
  fieldHead: string
  label: string
  link: string
  input: string
  select: string
  hint: string
}

/** 文案；未给出的项使用设置页的中文默认值。 */
export interface RouteFieldsLabels {
  provider: string
  model: string
  effort: string
  manual: string
  fromList: string
  inheritProvider: string
  inheritModel: string
  pickProvider: string
  pickModel: string
  customProvider: string
  customModel: string
  modelUnsupported: string
  modelUnsupportedHint: string
  effortInherit: string
  effortLinked: string
  effortGeneric: string
  noReasoning: string
}

export interface RouteValue {
  provider: string
  model: string
  reasoningEffort: string
}

const DEFAULT_LABELS: RouteFieldsLabels = {
  provider: 'Provider（提供商）',
  model: '模型名称 (Model)',
  effort: '思考等级 (Reasoning Effort)',
  manual: '手动输入',
  fromList: '从列表选择',
  inheritProvider: '（继承主会话提供商）',
  inheritModel: '（继承主会话模型）',
  pickProvider: '（请选择提供商）',
  pickModel: '（请选择模型）',
  customProvider: '例如 openai / anthropic / deepseek',
  customModel: '例如 gpt-4.1 / claude-sonnet-4',
  modelUnsupported: '该模型不支持思考等级',
  modelUnsupportedHint: '所选模型无深度思考/推理模式，已自动禁用',
  effortInherit: '继承或模型默认',
  effortLinked: '已智能联动该模型支持的专属思考档位',
  effortGeneric: '通用思考等级档位',
  noReasoning: '当前模型不支持思考等级',
}

const GENERIC_REASONING_OPTIONS = [
  { value: '', label: '继承或模型默认' },
  { value: 'low', label: '低 (low) - 快速响应' },
  { value: 'medium', label: '中 (medium) - 平衡' },
  { value: 'high', label: '高 (high) - 深度推理' },
  { value: 'max', label: '最大 (max) - 极限思考' },
]

export interface RouteFieldsProps extends RouteValue {
  catalog?: CatalogProviderGroup[]
  disabled?: boolean
  /** 是否提供「留空表示继承」的选项。 */
  allowInherit?: boolean
  classes: RouteFieldsClasses
  labels?: Partial<RouteFieldsLabels>
  /** 提供时启用「从列表/手动输入」切换；否则固定走列表。 */
  allowManual?: boolean
  onChange: (next: RouteValue) => void
}

export function RouteFields({
  provider,
  model,
  reasoningEffort,
  catalog,
  disabled = false,
  allowInherit = false,
  classes,
  labels,
  allowManual = true,
  onChange,
}: RouteFieldsProps): ReactElement {
  const text = { ...DEFAULT_LABELS, ...labels }
  const hasCatalog = Array.isArray(catalog) && catalog.length > 0
  const matchedGroup = hasCatalog ? catalog.find(group => group.id === provider) : undefined
  const located = locateModel(catalog, model)

  const modelsInGroup = matchedGroup?.models ?? []
  const matchedModel = matchedGroup ? modelsInGroup.find(item => item.id === model) : located?.entry
  const [customProvider, setCustomProvider] = useState<boolean>(!hasCatalog || (Boolean(provider) && !matchedGroup))
  const [customModel, setCustomModel] = useState<boolean>(!hasCatalog || (Boolean(model) && !located))

  const reasoningInfo = matchedModel?.reasoning
  const isReasoningExplicitlyUnsupported = Boolean(
    matchedModel && (!reasoningInfo || !reasoningInfo.efforts || reasoningInfo.efforts.length === 0),
  )
  const isReasoningSupported = Boolean(reasoningInfo?.efforts?.length)

  // 切换 Provider 后若当前模型不属于新厂商，落到其首个模型。
  const handleProviderSelect = (value: string): void => {
    if (value === '__custom__') {
      setCustomProvider(true)
      return
    }
    setCustomProvider(false)
    const nextModels = catalog?.find(group => group.id === value)?.models ?? []
    const nextModel = nextModels.some(item => item.id === model) ? model : (nextModels[0]?.id ?? '')
    const target = nextModels.find(item => item.id === nextModel)
    onChange({ provider: value, model: nextModel, reasoningEffort: resetEffortFor(reasoningEffort, target) })
  }

  // 选中项自带所属厂商，未指定 Provider 时自动补全。
  const handleModelSelect = (value: string): void => {
    if (value === '__custom__') {
      setCustomModel(true)
      return
    }
    setCustomModel(false)
    if (value === '') {
      onChange({ provider, model: '', reasoningEffort })
      return
    }
    const picked = decodeModelKey(value)
    if (picked === undefined) return
    const target = catalog?.find(group => group.id === picked.provider)?.models.find(item => item.id === picked.model)
    onChange({ provider: picked.provider, model: picked.model, reasoningEffort: resetEffortFor(reasoningEffort, target) })
  }

  // 每个控件配一个 id，让 label 可点、屏幕阅读器可关联。
  const providerId = `sr-provider-${useId().replace(/:/g, '')}`
  const modelId = `sr-model-${useId().replace(/:/g, '')}`
  const effortId = `sr-effort-${useId().replace(/:/g, '')}`

  const providerField = h('div', { className: classes.field },
    h('div', { className: classes.fieldHead },
      h('label', { className: classes.label, htmlFor: providerId }, text.provider),
      hasCatalog && allowManual ? h('button', {
        type: 'button',
        className: classes.link,
        disabled,
        onClick: () => {
          const next = !customProvider
          setCustomProvider(next)
          if (next) setCustomModel(true)
        },
      }, customProvider ? text.fromList : text.manual) : null,
    ),
    customProvider || !hasCatalog ? h('input', {
      type: 'text',
      id: providerId,
      className: classes.input,
      placeholder: text.customProvider,
      value: provider,
      disabled,
      onChange: (event: { target: { value: string } }) => onChange({
        provider: event.target.value.trim(),
        model,
        reasoningEffort,
      }),
    }) : h('select', {
      id: providerId,
      className: classes.select,
      value: matchedGroup ? provider : '',
      disabled,
      onChange: (event: { target: { value: string } }) => handleProviderSelect(event.target.value),
    },
      h('option', { value: '' }, allowInherit ? text.inheritProvider : text.pickProvider),
      catalog!.map(group => h('option', { key: group.id, value: group.id },
        `${group.name || group.id} (${group.id})`)),
      allowManual ? h('option', { value: '__custom__' }, `+ ${text.manual}…`) : null,
    ),
  )

  // 未选厂商时按厂商分组列出全部模型，让用户直接从完整目录里挑。
  const modelGroups = matchedGroup ? [matchedGroup] : (catalog ?? [])
  const modelOptions = modelGroups
    .filter(group => group.models.length > 0)
    .map(group => h('optgroup', { key: group.id, label: group.name || group.id },
      group.models.map(item => h('option', {
        key: encodeModelKey(group.id, item.id),
        value: encodeModelKey(group.id, item.id),
      }, item.name && item.name !== item.id ? `${item.name} (${item.id})` : item.id)),
    ))

  const modelField = h('div', { className: classes.field },
    h('div', { className: classes.fieldHead },
      h('label', { className: classes.label, htmlFor: modelId }, text.model),
      hasCatalog && allowManual ? h('button', {
        type: 'button',
        className: classes.link,
        disabled,
        onClick: () => setCustomModel(current => !current),
      }, customModel ? text.fromList : text.manual) : null,
    ),
    customModel || !hasCatalog ? h('input', {
      type: 'text',
      id: modelId,
      className: classes.input,
      placeholder: text.customModel,
      value: model,
      disabled,
      onChange: (event: { target: { value: string } }) => onChange({
        provider,
        model: event.target.value.trim(),
        reasoningEffort,
      }),
    }) : h('select', {
      id: modelId,
      className: classes.select,
      value: model && (matchedModel !== undefined || located !== undefined)
        ? encodeModelKey(provider || located?.group.id || '', model)
        : '',
      disabled,
      onChange: (event: { target: { value: string } }) => handleModelSelect(event.target.value),
    },
      h('option', { value: '' }, allowInherit ? text.inheritModel : text.pickModel),
      modelOptions,
      allowManual ? h('option', { value: '__custom__' }, `+ ${text.manual}…`) : null,
    ),
  )

  let reasoningContent: ReactElement
  let reasoningHint = ''

  if (isReasoningExplicitlyUnsupported) {
    // 防止把非法等级写进配置：模型不支持推理时直接清空并禁用。
    reasoningContent = h('select', { id: effortId, className: classes.select, value: '', disabled: true, title: text.noReasoning },
      h('option', { value: '' }, text.modelUnsupported))
    reasoningHint = text.modelUnsupportedHint
  } else if (isReasoningSupported && reasoningInfo) {
    reasoningContent = h('select', {
      id: effortId,
      className: classes.select,
      value: reasoningEffort,
      disabled,
      onChange: (event: { target: { value: string } }) => onChange({
        provider,
        model,
        reasoningEffort: event.target.value,
      }),
    },
      h('option', { value: '' }, `${text.effortInherit}${reasoningInfo.defaultEffort ? ` (${reasoningInfo.defaultEffort})` : ''}`),
      reasoningInfo.efforts.map(effort => h('option', { key: effort.id, value: effort.id },
        `${effort.name || effort.id} (${effort.id})${effort.description ? ` - ${effort.description}` : ''}`)),
    )
    reasoningHint = text.effortLinked
  } else {
    reasoningContent = h('select', {
      id: effortId,
      className: classes.select,
      value: reasoningEffort,
      disabled,
      onChange: (event: { target: { value: string } }) => onChange({
        provider,
        model,
        reasoningEffort: event.target.value,
      }),
    }, GENERIC_REASONING_OPTIONS.map(option => h('option', { key: option.value, value: option.value }, option.label)))
    reasoningHint = text.effortGeneric
  }

  const reasoningField = h('div', { className: classes.field },
    h('div', { className: classes.fieldHead }, h('label', { className: classes.label, htmlFor: effortId }, text.effort)),
    reasoningContent,
    reasoningHint ? h('span', { className: classes.hint }, reasoningHint) : null,
  )

  return h('div', { className: classes.grid }, providerField, modelField, reasoningField)
}
