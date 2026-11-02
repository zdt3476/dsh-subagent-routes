import { createElement as h, useEffect, useState, type ReactElement } from 'react'
import type { CatalogProviderGroup, PluginConfig, RouteSpec, SettingsSnapshot, WorkspaceEntry, WorkspaceRoute } from '../shared/settings'
import { parseSimpleRouteYaml, serializeRouteTable } from '../shared/yaml-utils'
import { decodeModelKey, encodeModelKey, locateModel, resetEffortFor } from './catalog'
import { settingsApi, type SettingsApi } from './services'
import { SETTINGS_CSS } from './styles'

export interface SettingsProps {
  view?: 'summary' | 'page'
  api?: SettingsApi
}

const GENERIC_REASONING_OPTIONS = [
  { value: '', label: '继承或模型默认' },
  { value: 'low', label: '低 (low) - 快速响应' },
  { value: 'medium', label: '中 (medium) - 平衡' },
  { value: 'high', label: '高 (high) - 深度推理' },
  { value: 'max', label: '最大 (max) - 极限思考' },
]

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function SettingsPanel({ view, api = settingsApi }: SettingsProps): ReactElement {
  if (view === 'summary') {
    return h('span', null, '为不同工作区目录为子代理指定 AI 模型与思考等级')
  }
  return h(SettingsEditor, { api })
}

interface FormState {
  path: string
  provider: string
  model: string
  reasoningEffort: string
}

const EMPTY_FORM: FormState = { path: '', provider: '', model: '', reasoningEffort: '' }

interface ModelRouteFieldsProps {
  provider: string
  model: string
  reasoningEffort: string
  catalog?: CatalogProviderGroup[]
  disabled?: boolean
  allowInherit?: boolean
  onChange: (next: { provider: string; model: string; reasoningEffort: string }) => void
}

/**
 * 智能联动模型选择器：
 * 1. Provider：默认从宿主已配置的 Provider 列表中选择，仅在没有目录时退回手动输入；
 * 2. Model：默认从列表选择。未选 Provider 时按厂商分组列出全部可用模型，选中即自动回填 Provider；
 * 3. 思考等级：跟随所选模型的真实元数据，不支持则禁用并清空，支持则只呈现该模型的专属档位。
 */
function ModelRouteFields({
  provider,
  model,
  reasoningEffort,
  catalog,
  disabled = false,
  allowInherit = false,
  onChange,
}: ModelRouteFieldsProps): ReactElement {
  const hasCatalog = Array.isArray(catalog) && catalog.length > 0
  const matchedGroup = hasCatalog ? catalog.find(group => group.id === provider) : undefined
  /** 在整份目录里定位模型，用于在未选 Provider 时也能解析思考等级元数据。 */
  const located = locateModel(catalog, model)

  const modelsInGroup = matchedGroup?.models ?? []
  const matchedModel = matchedGroup ? modelsInGroup.find(item => item.id === model) : located?.entry
  const [customProvider, setCustomProvider] = useState<boolean>(!hasCatalog || (Boolean(provider) && !matchedGroup))
  const [customModel, setCustomModel] = useState<boolean>(!hasCatalog || (Boolean(model) && !located))

  // 思考能力元数据
  const reasoningInfo = matchedModel?.reasoning
  const isReasoningExplicitlyUnsupported = Boolean(matchedModel && (!reasoningInfo || !reasoningInfo.efforts || reasoningInfo.efforts.length === 0))
  const isReasoningSupported = Boolean(reasoningInfo && reasoningInfo.efforts && reasoningInfo.efforts.length > 0)

  // 处理 Provider 下拉变动：切换后若当前模型不属于新厂商，自动落到其首个模型
  const handleProviderSelect = (val: string) => {
    if (val === '__custom__') {
      setCustomProvider(true)
      return
    }
    setCustomProvider(false)
    const newModels = catalog?.find(group => group.id === val)?.models ?? []
    const nextModel = newModels.some(item => item.id === model) ? model : (newModels[0]?.id ?? '')
    const target = newModels.find(item => item.id === nextModel)
    onChange({ provider: val, model: nextModel, reasoningEffort: resetEffortFor(reasoningEffort, target) })
  }

  // 处理 Model 下拉变动：选中项自带所属厂商，未指定 Provider 时自动补全
  const handleModelSelect = (val: string) => {
    if (val === '__custom__') {
      setCustomModel(true)
      return
    }
    setCustomModel(false)
    if (val === '') {
      onChange({ provider, model: '', reasoningEffort })
      return
    }
    const picked = decodeModelKey(val)
    if (picked === undefined) return
    const target = catalog?.find(group => group.id === picked.provider)?.models.find(item => item.id === picked.model)
    onChange({
      provider: picked.provider,
      model: picked.model,
      reasoningEffort: resetEffortFor(reasoningEffort, target),
    })
  }

  // Provider 区域渲染
  const providerField = h('div', { className: 'sr-field' },
    h('div', { className: 'sr-field-head' },
      h('label', null, 'Provider（提供商）'),
      hasCatalog ? h('button', {
        type: 'button',
        className: 'sr-field-link',
        disabled,
        onClick: () => {
          const nextCustom = !customProvider
          setCustomProvider(nextCustom)
          if (nextCustom) setCustomModel(true)
        },
      }, customProvider ? '从列表选择' : '手动输入') : null,
    ),
    customProvider || !hasCatalog ? h('input', {
      type: 'text',
      placeholder: '例如 openai / anthropic / deepseek',
      value: provider,
      disabled,
      onChange: (e: { target: { value: string } }) => onChange({
        provider: e.target.value.trim(),
        model,
        reasoningEffort,
      }),
    }) : h('select', {
      value: matchedGroup ? provider : '',
      disabled,
      onChange: (e: { target: { value: string } }) => handleProviderSelect(e.target.value),
    },
      h('option', { value: '' }, allowInherit ? '（继承主会话提供商）' : '（请选择提供商）'),
      catalog.map(group => h('option', { key: group.id, value: group.id }, `${group.name || group.id} (${group.id})`)),
      h('option', { value: '__custom__' }, '+ 手动输入其他提供商…'),
    ),
  )

  // Model 区域渲染：默认列表；未选定厂商时按厂商分组展示全部模型
  const modelGroups = matchedGroup ? [matchedGroup] : (catalog ?? [])
  const modelOptions = modelGroups
    .filter(group => group.models.length > 0)
    .map(group => h('optgroup', { key: group.id, label: group.name || group.id },
      group.models.map(item => h('option', {
        key: encodeModelKey(group.id, item.id),
        value: encodeModelKey(group.id, item.id),
      }, item.name && item.name !== item.id ? `${item.name} (${item.id})` : item.id)),
    ))

  const modelField = h('div', { className: 'sr-field' },
    h('div', { className: 'sr-field-head' },
      h('label', null, '模型名称 (Model)'),
      hasCatalog ? h('button', {
        type: 'button',
        className: 'sr-field-link',
        disabled,
        onClick: () => setCustomModel(!customModel),
      }, customModel ? '从列表选择' : '手动输入') : null,
    ),
    customModel || !hasCatalog ? h('input', {
      type: 'text',
      placeholder: '例如 gpt-4.1 / claude-sonnet-4',
      value: model,
      disabled,
      onChange: (e: { target: { value: string } }) => onChange({
        provider,
        model: e.target.value.trim(),
        reasoningEffort,
      }),
    }) : h('select', {
      value: model && (matchedModel !== undefined || located !== undefined) ? encodeModelKey(provider || located?.group.id || '', model) : '',
      disabled,
      onChange: (e: { target: { value: string } }) => handleModelSelect(e.target.value),
    },
      h('option', { value: '' }, allowInherit ? '（继承主会话模型）' : '（请选择模型）'),
      modelOptions,
      h('option', { value: '__custom__' }, '+ 手动输入其他模型 ID…'),
    ),
  )

  // Reasoning Effort 思考等级渲染（根据模型元数据强联动）
  let reasoningSelectContent: ReactElement
  let reasoningHint = ''

  if (isReasoningExplicitlyUnsupported) {
    reasoningSelectContent = h('select', {
      value: '',
      disabled: true,
      title: '当前模型不支持思考等级',
    }, h('option', { value: '' }, '该模型不支持思考等级'))
    reasoningHint = '所选模型无深度思考/推理模式，已自动禁用'
  } else if (isReasoningSupported && reasoningInfo) {
    reasoningSelectContent = h('select', {
      value: reasoningEffort,
      disabled,
      onChange: (e: { target: { value: string } }) => onChange({
        provider,
        model,
        reasoningEffort: e.target.value,
      }),
    },
      h('option', { value: '' }, `继承或模型默认${reasoningInfo.defaultEffort ? ` (${reasoningInfo.defaultEffort})` : ''}`),
      reasoningInfo.efforts.map(eff => h('option', { key: eff.id, value: eff.id }, `${eff.name || eff.id} (${eff.id})${eff.description ? ` - ${eff.description}` : ''}`)),
    )
    reasoningHint = '已智能联动该模型支持的专属思考档位'
  } else {
    reasoningSelectContent = h('select', {
      value: reasoningEffort,
      disabled,
      onChange: (e: { target: { value: string } }) => onChange({
        provider,
        model,
        reasoningEffort: e.target.value,
      }),
    }, GENERIC_REASONING_OPTIONS.map(opt => h('option', { key: opt.value, value: opt.value }, opt.label)))
    reasoningHint = '通用思考等级档位'
  }

  const reasoningField = h('div', { className: 'sr-field' },
    h('div', { className: 'sr-field-head' },
      h('label', null, '思考等级 (Reasoning Effort)'),
    ),
    reasoningSelectContent,
    reasoningHint ? h('span', { className: 'sr-hint', style: { fontSize: 11 } }, reasoningHint) : null,
  )

  return h('div', { className: 'sr-form-grid' }, providerField, modelField, reasoningField)
}

interface WorkspacePathFieldProps {
  value: string
  workspaces?: WorkspaceEntry[]
  disabled?: boolean
  onChange: (path: string) => void
}

/**
 * 工作区路径选择器：优先从宿主已登记的工作区里挑，避免手抄长路径；
 * 没有登记记录、或需要更细的子目录时，可一键切回手动输入。
 */
function WorkspacePathField({ value, workspaces, disabled = false, onChange }: WorkspacePathFieldProps): ReactElement {
  const options = workspaces ?? []
  const hasOptions = options.length > 0
  const matched = hasOptions ? options.some(item => item.path === value) : false
  const [custom, setCustom] = useState<boolean>(!hasOptions || (value !== '' && !matched))

  return h('div', { className: 'sr-field' },
    h('div', { className: 'sr-field-head' },
      h('label', null, '项目根目录绝对路径 *'),
      hasOptions ? h('button', {
        type: 'button',
        className: 'sr-field-link',
        disabled,
        onClick: () => setCustom(current => !current),
      }, custom ? '从工作区选择' : '手动输入') : null,
    ),
    custom || !hasOptions ? h('input', {
      type: 'text',
      placeholder: '支持以 ~ 开头，例如 ~/Code/frontend-app 或 /Users/me/repo',
      value,
      disabled,
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    }) : h('select', {
      value: matched ? value : '',
      disabled,
      onChange: (e: { target: { value: string } }) => {
        if (e.target.value === '__custom__') {
          setCustom(true)
          return
        }
        onChange(e.target.value)
      },
    },
      h('option', { value: '' }, '（请选择工作区项目）'),
      options.map(item => h('option', { key: item.path, value: item.path },
        item.title && item.title !== item.path ? `${item.title} — ${item.path}` : item.path)),
      h('option', { value: '__custom__' }, '+ 手动输入其他目录…'),
    ),
  )
}

function SettingsEditor({ api }: { api: SettingsApi }): ReactElement {
  const [snapshot, setSnapshot] = useState<SettingsSnapshot | null>(null)
  const [config, setConfig] = useState<PluginConfig | null>(null)
  const [viewMode, setViewMode] = useState<'visual' | 'yaml'>('visual')

  // 可视化状态
  const [fallback, setFallback] = useState<RouteSpec>({})
  const [routes, setRoutes] = useState<WorkspaceRoute[]>([])

  // YAML 原始文本
  const [yamlText, setYamlText] = useState('')

  // 规则编辑状态 (null = 未编辑, 'new' = 新建, number = 编辑指定索引)
  const [editingTarget, setEditingTarget] = useState<'new' | number | null>(null)
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  // 操作状态
  const [busy, setBusy] = useState<'load' | 'saving' | null>('load')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const receive = (next: SettingsSnapshot) => {
    setSnapshot(next)
    setConfig(next.config)
    const rawText = next.table?.text ?? ''
    setYamlText(rawText)

    if (next.table?.parsed) {
      setFallback(next.table.parsed.fallback ?? {})
      setRoutes([...next.table.parsed.routes])
    } else {
      const parsed = parseSimpleRouteYaml(rawText)
      if (parsed.data) {
        setFallback(parsed.data.fallback ?? {})
        setRoutes([...parsed.data.routes])
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void api.load(controller.signal).then(next => {
      if (!controller.signal.aborted) receive(next)
    }).catch(err => {
      if (!controller.signal.aborted) setError(message(err))
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(null)
    })
    return () => controller.abort()
  }, [api])

  const configDirty = snapshot !== null && JSON.stringify(config) !== JSON.stringify(snapshot.config)
  const tableDirty = snapshot?.table != null && yamlText !== snapshot.table.text
  const isDirty = configDirty || tableDirty

  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const reload = async () => {
    if (isDirty && !window.confirm('重新读取会放弃未保存的修改，是否继续？')) return
    setBusy('load'); setError(''); setNotice(''); setEditingTarget(null)
    try {
      receive(await api.load())
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(null)
    }
  }

  // 可视化变更同步生成 YAML
  const syncToYaml = (nextFallback: RouteSpec, nextRoutes: WorkspaceRoute[]) => {
    setFallback(nextFallback)
    setRoutes(nextRoutes)
    const text = serializeRouteTable(nextFallback, nextRoutes)
    setYamlText(text)
  }

  // 切换至可视化时解析 YAML
  const handleSwitchTab = (targetMode: 'visual' | 'yaml') => {
    if (targetMode === 'visual' && viewMode === 'yaml') {
      const parsed = parseSimpleRouteYaml(yamlText)
      if (parsed.data) {
        setFallback(parsed.data.fallback ?? {})
        setRoutes([...parsed.data.routes])
      }
    }
    setViewMode(targetMode)
    setError('')
  }

  // 保存所有更改（统一保存）
  const handleSaveAll = async () => {
    if (snapshot === null || config === null || !isDirty) return
    if (editingTarget !== null) {
      setError('请先完成或取消当前单条规则的编辑（点击「确认保存规则」或「取消」）后再保存全局设置。')
      return
    }
    setBusy('saving'); setError(''); setNotice('')

    try {
      let currentTableRev = snapshot.table?.revision

      // 1. 如果基础配置改了且支持编辑，先保存基础设置
      if (configDirty && snapshot.canEditConfig) {
        await api.saveConfig(config, snapshot.configRevision)
        if (config.routesFile !== snapshot.config.routesFile) {
          const intermediate = await api.load()
          currentTableRev = intermediate.table?.revision
        }
      }

      // 2. 如果路由表改了，保存路由表
      if (tableDirty && snapshot.table && currentTableRev) {
        await api.saveTable({ text: yamlText, revision: currentTableRev })
      }

      // 3. 重新加载最新数据以同步 revision 与 catalog
      const fresh = await api.load()
      receive(fresh)
      setNotice('设置已成功保存并立即生效！后续新建的子代理将自动应用新规则。')
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(null)
    }
  }

  // 放弃全部修改
  const handleDiscardAll = () => {
    if (snapshot === null) return
    receive(snapshot)
    setEditingTarget(null)
    setError('')
    setNotice('')
  }

  // 规则编辑：打开新增
  const handleStartAdd = () => {
    setEditingTarget('new')
    setFormState(EMPTY_FORM)
    setFormError('')
  }

  // 规则编辑：打开修改
  const handleStartEdit = (index: number) => {
    const r = routes[index]
    setEditingTarget(index)
    setFormState({
      path: r.path,
      provider: r.provider ?? '',
      model: r.model ?? '',
      reasoningEffort: r.reasoningEffort ?? '',
    })
    setFormError('')
  }

  // 规则编辑：提交保存
  const handleCommitRule = () => {
    const trimmedPath = formState.path.trim()
    if (!trimmedPath) {
      setFormError('工作区目录路径不能为空')
      return
    }
    const isWindowsAbsolute = /^[a-zA-Z]:[/\\]/.test(trimmedPath)
    if (!trimmedPath.startsWith('/') && !trimmedPath.startsWith('~') && !isWindowsAbsolute) {
      setFormError('路径必须是绝对路径（例如 /Users/... 或 C:\\...）或以 ~ 开头')
      return
    }

    const provider = formState.provider.trim() || undefined
    const model = formState.model.trim() || undefined
    const reasoningEffort = formState.reasoningEffort.trim() || undefined

    if ((provider === undefined) !== (model === undefined)) {
      setFormError('Provider 与 Model 必须同时提供或同时留空')
      return
    }
    if (provider === undefined && reasoningEffort === undefined) {
      setFormError('至少需要指定 模型(Provider+Model) 或 思考等级')
      return
    }

    // 检查重复路径
    const duplicate = routes.some((r, i) => i !== editingTarget && r.path === trimmedPath)
    if (duplicate) {
      setFormError(`已存在针对目录 "${trimmedPath}" 的规则`)
      return
    }

    const item: WorkspaceRoute = {
      path: trimmedPath,
      ...(provider ? { provider, model } : {}),
      ...(reasoningEffort ? { reasoningEffort } : {}),
    }

    const nextRoutes = [...routes]
    if (editingTarget === 'new') {
      nextRoutes.push(item)
    } else if (typeof editingTarget === 'number') {
      nextRoutes[editingTarget] = item
    }

    syncToYaml(fallback, nextRoutes)
    setEditingTarget(null)
    setFormState(EMPTY_FORM)
    setFormError('')
  }

  // 规则删除
  const handleDeleteRule = (index: number) => {
    const target = routes[index]
    if (!window.confirm(`确定要移除工作区 "${target.path}" 的专属路由规则吗？`)) return
    const nextRoutes = routes.filter((_, i) => i !== index)
    syncToYaml(fallback, nextRoutes)
    if (editingTarget === index) setEditingTarget(null)
  }

  // 全局兜底模型变更（接收完整三元组，避免部分字段更新时互抹）
  const handleFallbackChange = (next: { provider: string; model: string; reasoningEffort: string }) => {
    const nextFallback: RouteSpec = {
      ...(next.provider ? { provider: next.provider } : {}),
      ...(next.model ? { model: next.model } : {}),
      ...(next.reasoningEffort ? { reasoningEffort: next.reasoningEffort } : {}),
    }
    syncToYaml(nextFallback, routes)
  }

  // 加载中视图
  if (snapshot === null || config === null) {
    return h('div', { className: 'sr-settings', 'aria-busy': true },
      h('style', null, SETTINGS_CSS),
      h('div', { className: 'sr-header' },
        h('div', { className: 'sr-header-info' },
          h('h3', { className: 'sr-title' }, '子代理工作区路由'),
          h('p', { className: 'sr-subtitle' }, '按项目目录为子代理自动分配不同的 AI 模型与思考等级。'),
        ),
      ),
      h('div', { style: { padding: '24px 0' } },
        busy ? h('p', { className: 'sr-hint', role: 'status', style: { marginBottom: 16 } }, '正在读取设置…') : null,
        busy ? h('div', { className: 'sr-skeleton', style: { height: 100, marginBottom: 16 } }) : null,
        busy ? h('div', { className: 'sr-skeleton', style: { height: 140 } }) : null,
        error ? h('p', { className: 'sr-error', role: 'alert' }, error) : null,
        !busy ? h('div', { style: { marginTop: 16 } },
          h('button', { type: 'button', className: 'sr-btn', onClick: () => void reload() }, '重新读取设置'),
        ) : null,
      ),
    )
  }

  const isBlocked = busy !== null

  // 头部主开关与标题
  const header = h('header', { className: 'sr-header' },
    h('div', { className: 'sr-header-info' },
      h('h3', { className: 'sr-title' }, '子代理工作区路由'),
      h('p', { className: 'sr-subtitle' }, '根据当前会话所在的项目目录，自动让子代理切换到最适用的模型，最长路径匹配优先。'),
    ),
    h('label', { className: 'sr-switch-control', title: config.enabled ? '点击禁用路由' : '点击启用路由' },
      h('span', { className: 'sr-switch-label' }, config.enabled ? '已启用' : '已暂停'),
      h('input', {
        type: 'checkbox',
        className: 'sr-switch-input',
        checked: config.enabled,
        disabled: isBlocked || !snapshot.canEditConfig,
        onChange: e => { setConfig({ ...config, enabled: e.target.checked }); setNotice(''); setError('') },
      }),
      h('div', { className: `sr-switch-track ${config.enabled ? 'sr-switch-checked' : ''}` },
        h('div', { className: 'sr-switch-thumb' }),
      ),
    ),
  )

  // 视图切换 Tab 栏
  const navRow = h('div', { className: 'sr-nav-row' },
    h('div', { className: 'sr-tabs' },
      h('button', {
        type: 'button',
        className: `sr-tab-btn ${viewMode === 'visual' ? 'sr-tab-active' : ''}`,
        onClick: () => handleSwitchTab('visual'),
      }, '规则设置'),
      h('button', {
        type: 'button',
        className: `sr-tab-btn ${viewMode === 'yaml' ? 'sr-tab-active' : ''}`,
        onClick: () => handleSwitchTab('yaml'),
      }, '原始 YAML 模式'),
    ),
  )

  // 可视化编辑区：全局兜底模型卡片（采用智能联动组件）
  const fallbackCard = h('div', { className: 'sr-card' },
    h('div', { className: 'sr-card-head' },
      h('h4', { className: 'sr-card-title' }, '全局默认模型（未匹配项目时使用）'),
    ),
    h('p', { className: 'sr-card-desc' }, '当子代理所在的工作区没有匹配到下方专属规则时使用。留空则直接继承父会话的模型。'),
    h(ModelRouteFields, {
      provider: fallback.provider ?? '',
      model: fallback.model ?? '',
      reasoningEffort: fallback.reasoningEffort ?? '',
      catalog: snapshot.catalog,
      disabled: isBlocked,
      allowInherit: true,
      onChange: next => handleFallbackChange(next),
    }),
  )

  // 规则编辑表单卡片 (新增 / 编辑)（采用智能联动组件）
  const ruleEditorBox = editingTarget !== null ? h('div', { className: 'sr-editor-box' },
    h('h5', null, editingTarget === 'new' ? '新建项目专属规则' : `修改规则 (${formState.path})`),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      h(WorkspacePathField, {
        key: `path-${editingTarget}`,
        value: formState.path,
        workspaces: snapshot.workspaces,
        disabled: isBlocked,
        onChange: path => setFormState(current => ({ ...current, path })),
      }),
      h('span', { className: 'sr-hint' }, '子代理在该目录或其子目录中派活时将生效（更长路径优先）。'),
      h(ModelRouteFields, {
        provider: formState.provider,
        model: formState.model,
        reasoningEffort: formState.reasoningEffort,
        catalog: snapshot.catalog,
        disabled: isBlocked,
        allowInherit: true,
        onChange: next => setFormState({
          ...formState,
          provider: next.provider,
          model: next.model,
          reasoningEffort: next.reasoningEffort,
        }),
      }),
      formError ? h('p', { className: 'sr-error', role: 'alert', style: { margin: 0 } }, formError) : null,
      h('div', { style: { display: 'flex', gap: 8, marginTop: 4 } },
        h('button', { type: 'button', className: 'sr-btn sr-btn-primary sr-btn-sm', onClick: handleCommitRule }, '确认保存规则'),
        h('button', { type: 'button', className: 'sr-btn sr-btn-sm', onClick: () => { setEditingTarget(null); setFormError('') } }, '取消'),
      ),
    ),
  ) : null

  // 规则列表卡片
  const routesCard = h('div', { className: 'sr-card' },
    h('div', { className: 'sr-card-head' },
      h('h4', { className: 'sr-card-title' }, `项目专属路由规则 (${routes.length})`),
      editingTarget === null && routes.length > 0 ? h('button', {
        type: 'button',
        className: 'sr-btn sr-btn-sm',
        onClick: handleStartAdd,
      }, '+ 新增规则') : null,
    ),
    h('p', { className: 'sr-card-desc' }, '根据工作区目录前缀进行匹配；当同一个项目有多个匹配规则时，路径层级更深的规则生效。'),
    ruleEditorBox,
    routes.length === 0 && editingTarget === null ? h('div', { className: 'sr-empty' },
      h('p', { className: 'sr-empty-text' }, '暂无任何项目规则。子代理将使用全局兜底模型或继承主会话设置。'),
      h('button', { type: 'button', className: 'sr-btn sr-btn-primary sr-btn-sm', onClick: handleStartAdd }, '+ 添加第一个项目规则'),
    ) : h('div', { className: 'sr-route-list' },
      routes.map((r, idx) => h('div', { key: `${r.path}-${idx}`, className: `sr-route-item ${editingTarget === idx ? 'sr-route-editing' : ''}` },
        h('div', { className: 'sr-route-main' },
          h('span', { className: 'sr-route-path', title: r.path }, r.path),
          h('div', { className: 'sr-route-meta' },
            r.provider && r.model ? h('span', { className: 'sr-badge-model' }, `${r.provider} / ${r.model}`) : h('span', { className: 'sr-hint' }, '继承父会话模型'),
            r.reasoningEffort ? h('span', { className: 'sr-badge-effort' }, `思考: ${r.reasoningEffort}`) : null,
          ),
        ),
        h('div', { className: 'sr-route-actions' },
          h('button', { type: 'button', className: 'sr-btn sr-btn-sm', disabled: isBlocked || editingTarget !== null, onClick: () => handleStartEdit(idx) }, '编辑'),
          h('button', { type: 'button', className: 'sr-btn sr-btn-danger sr-btn-sm', disabled: isBlocked || editingTarget !== null, onClick: () => handleDeleteRule(idx) }, '删除'),
        ),
      )),
    ),
  )

  // YAML 代码模式卡片
  const yamlCard = h('div', { className: 'sr-card' },
    h('div', { className: 'sr-card-head' },
      h('h4', { className: 'sr-card-title' }, '原始 YAML 编辑'),
      snapshot.table ? h('span', { className: 'sr-hint', style: { fontFamily: 'ui-monospace' } }, snapshot.table.file) : null,
    ),
    h('p', { className: 'sr-card-desc' }, '支持直接编辑完整的路由表 YAML 内容，保存时保持结构化规范。修改会与可视化表单双向同步。'),
    h('textarea', {
      className: 'sr-textarea',
      value: yamlText,
      disabled: isBlocked,
      spellCheck: false,
      onChange: (e: { target: { value: string } }) => { setYamlText(e.target.value); setError(''); setNotice('') },
    }),
  )

  // 高级设置（折叠）
  const advancedDetails = h('details', { className: 'sr-details' },
    h('summary', null, '高级选项（预检校验与存储路径）'),
    h('div', { className: 'sr-details-content' },
      h('div', { className: 'sr-field', style: { marginBottom: 12 } },
        h('label', { style: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' } },
          h('input', {
            type: 'checkbox',
            checked: config.preflight,
            disabled: isBlocked || !snapshot.canEditConfig,
            onChange: e => setConfig({ ...config, preflight: e.target.checked }),
          }),
          h('span', { style: { fontWeight: 600 } }, '派活前进行模型可用性预检'),
        ),
        h('span', { className: 'sr-hint' }, '创建子代理前调用底层模型接口预先核验 provider、model 和思考等级是否合法可用。'),
      ),
      h('div', { className: 'sr-field' },
        h('label', null, '自定义路由表存储路径'),
        h('input', {
          type: 'text',
          placeholder: '留空使用默认路径 $DSH_HOME/subagent-routes.yaml',
          value: config.routesFile,
          disabled: isBlocked || !snapshot.canEditConfig,
          onChange: e => setConfig({ ...config, routesFile: e.target.value }),
        }),
        h('span', { className: 'sr-hint' }, '支持以 ~ 开头。修改并保存后，插件将切换至新文件读取规则。'),
      ),
      !snapshot.canEditConfig ? h('p', { className: 'sr-hint', style: { marginTop: 8 } }, '当前宿主环境不支持修改插件基础配置，高级配置项已锁定。') : null,
    ),
  )

  // 底部统一保存条
  const saveDisabled = isBlocked || !isDirty || editingTarget !== null
  const footerBar = h('div', { className: 'sr-footer-bar' },
    h('div', { className: 'sr-footer-left' },
      h('button', {
        type: 'button',
        className: 'sr-btn sr-btn-primary sr-save-btn',
        disabled: saveDisabled,
        onClick: () => void handleSaveAll(),
      }, busy === 'saving' ? '正在保存…' : (isDirty ? '保存所有更改' : '已是最新配置')),
      h('button', {
        type: 'button',
        className: 'sr-btn',
        disabled: isBlocked || !isDirty,
        onClick: handleDiscardAll,
      }, '放弃修改'),
      h('button', {
        type: 'button',
        className: 'sr-btn',
        disabled: isBlocked,
        onClick: () => void reload(),
      }, busy === 'load' ? '读取中…' : '重新读取'),
    ),
    h('div', { className: 'sr-footer-right' },
      editingTarget !== null
        ? h('span', { className: 'sr-dirty-badge' }, '正在编辑单条规则，请先确认保存')
        : (isDirty ? h('span', { className: 'sr-dirty-badge' }, '● 有未保存的修改') : null),
    ),
  )

  return h('div', { className: 'sr-settings', 'aria-busy': isBlocked },
    h('style', null, SETTINGS_CSS),
    header,
    navRow,
    error ? h('div', { className: 'sr-error', role: 'alert' }, error) : null,
    notice ? h('div', { className: 'sr-notice', role: 'status' }, notice) : null,
    viewMode === 'visual' ? h('div', null, fallbackCard, routesCard) : yamlCard,
    advancedDetails,
    footerBar,
  )
}
