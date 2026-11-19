import { createElement as h, useEffect, useState, type ReactElement } from 'react'
import type { PluginConfig, RouteSpec, SettingsSnapshot, WorkspaceEntry, WorkspaceRoute } from '../shared/settings'
import { parseSimpleRouteYaml, serializeRouteTable } from '../shared/yaml-utils'
import { RouteFields, type RouteFieldsClasses } from './route-fields'
import { settingsApi, type SettingsApi } from './services'
import { SETTINGS_CSS } from './styles'

export interface SettingsProps {
  view?: 'summary' | 'page'
  api?: SettingsApi
}

/**
 * 设置页命名空间下的选择器样式类名。
 *
 * input / select 留空：设置页的样式挂在 `.sr-field` 后代选择器上
 * （`.sr-field input {...}`），组件里再写类名反而会重复。
 */
const SETTINGS_CLASSES: RouteFieldsClasses = {
  grid: 'sr-form-grid',
  field: 'sr-field',
  fieldHead: 'sr-field-head',
  label: '',
  link: 'sr-field-link',
  input: '',
  select: '',
  hint: 'sr-hint',
}

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

  /*
   * 策略选「继承」时，下方的兜底模型与项目规则都不会再生效。
   * 若不在界面上说出来，用户会以为规则改了没反应——这是最容易踩的坑，
   * 因此下方两张卡片统一挂上这行提示，而不是让它们默默失效。
   */
  const currentPolicy = config.fallbackPolicy ?? 'rules'
  const policyInactive = currentPolicy === 'inherit'
  /*
   * 每张卡片各建一个元素，不复用同一个 React element：
   * 同一实例出现在两处时 React 只会渲染其中之一，另一处的提示会静默消失。
   */
  const inactiveNote = (key: string) => h('p', {
    key,
    className: 'sr-hint is-warn',
    style: { margin: '0 0 12px' },
  }, '当前全局策略是「继承主代理模型」，下列配置已保存但暂不生效；切回「使用路由规则」即恢复。')

  // 可视化编辑区：全局默认策略卡片
  const policyCard = h('div', { className: 'sr-card' },
    h('div', { className: 'sr-card-head' },
      h('h4', { className: 'sr-card-title' }, '全局默认策略'),
    ),
    h('p', { className: 'sr-card-desc' },
      '当会话未单独指定、且当前工作区目录未命中任何专属规则时，子代理的兜底行为。'),
    h('div', { className: 'sr-policy-options', role: 'radiogroup', 'aria-label': '全局默认策略' },
      h('button', {
        type: 'button',
        className: 'sr-policy-option',
        role: 'radio',
        'aria-checked': currentPolicy === 'inherit',
        disabled: isBlocked || !snapshot.canEditConfig,
        onClick: () => {
          setConfig({ ...config, fallbackPolicy: 'inherit' })
          setNotice('')
          setError('')
        },
      },
        h('span', { className: 'sr-policy-name' }, '继承主代理模型'),
        h('span', { className: 'sr-policy-desc' }, '子代理直接复用主代理的模型与思考等级，不应用下方通用路由配置。'),
      ),
      h('button', {
        type: 'button',
        className: 'sr-policy-option',
        role: 'radio',
        'aria-checked': currentPolicy === 'rules',
        disabled: isBlocked || !snapshot.canEditConfig,
        onClick: () => {
          setConfig({ ...config, fallbackPolicy: 'rules' })
          setNotice('')
          setError('')
        },
      },
        h('span', { className: 'sr-policy-name' }, '使用路由规则'),
        h('span', { className: 'sr-policy-desc' }, '查阅项目专属路由规则；未命中时使用下方配置的全局默认模型。'),
      ),
    ),
  )

  // 可视化编辑区：全局兜底模型卡片（采用智能联动组件）
  const fallbackCard = h('div', { className: 'sr-card' },
    h('div', { className: 'sr-card-head' },
      h('h4', { className: 'sr-card-title' }, '全局默认模型（未匹配项目时使用）'),
    ),
    h('p', { className: 'sr-card-desc' }, '当子代理所在的工作区没有匹配到下方专属规则时使用。留空则直接继承父会话的模型。'),
    policyInactive ? inactiveNote('policy-fallback') : null,
    h(RouteFields, {
      provider: fallback.provider ?? '',
      model: fallback.model ?? '',
      reasoningEffort: fallback.reasoningEffort ?? '',
      catalog: snapshot.catalog,
      disabled: isBlocked,
      allowInherit: true,
      classes: SETTINGS_CLASSES,
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
      h(RouteFields, {
        provider: formState.provider,
        model: formState.model,
        reasoningEffort: formState.reasoningEffort,
        catalog: snapshot.catalog,
        disabled: isBlocked,
        allowInherit: true,
        classes: SETTINGS_CLASSES,
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
    policyInactive ? inactiveNote('policy-routes') : null,
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
      'aria-label': '路由表内容（YAML）',
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
    viewMode === 'visual' ? h('div', null, policyCard, fallbackCard, routesCard) : yamlCard,
    advancedDetails,
    footerBar,
  )
}
