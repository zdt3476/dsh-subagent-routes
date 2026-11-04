/**
 * 输入区浮层的面板内容。
 *
 * 两层紧凑菜单结构（约 360px）：
 * - 首页：展示当前实际生效状态，以及三个一级选项：
 *   1. 跟随全局策略（点击直接保存）
 *   2. 继承主代理（点击直接保存）
 *   3. 指定模型…（点击只进入本地二级选择页，绝不自动保存）
 * - 二级选择页：包含返回按钮、模型搜索框、供应商纵向单列分组与模型列表、思考档位调节、
 *   以及目录外「手动输入模型」表单。点击模型或提交手动输入直接保存，保存成功保留选择页方便微调。
 */

import { createElement as h, useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type { RouteSpec, SessionSnapshot } from '../shared/settings'
import { POPOVER_PANEL_CSS } from './panel-styles'
import { describe } from './route-text'
import { createSessionLoader, type SessionLoader } from './panel-loader'
import { sessionApi, type SessionApi } from './services'

export interface PopoverPanelProps {
  sessionId: string
  api?: SessionApi
  onClose: () => void
}

/** 成功提示的停留时长。 */
const NOTICE_TTL = 4000

export function PopoverPanel({ sessionId, api = sessionApi, onClose }: PopoverPanelProps): ReactElement {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [busy, setBusy] = useState<'load' | 'save' | null>('load')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  /** 当前页面层级：'home'（首页）或 'select'（二级选择页）。初始即使 custom 也落在首页。 */
  const [view, setView] = useState<'home' | 'select'>('home')

  /** 模型搜索关键词。 */
  const [searchQuery, setSearchQuery] = useState('')

  /** 已选但未提交的思考档位临时预览。 */
  const [pendingEffort, setPendingEffort] = useState<string | null>(null)

  /** 手动输入模型表单展开状态与草稿。 */
  const [manualOpen, setManualOpen] = useState(false)
  const [manualProvider, setManualProvider] = useState('')
  const [manualModel, setManualModel] = useState('')

  const generation = useRef(0)
  const loader = useRef<SessionLoader | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const adopt = useCallback((next: SessionSnapshot) => {
    setSnapshot(next)
  }, [])

  useEffect(() => {
    const instance = createSessionLoader(api, sessionId, () => ({
      onSnapshot: adopt,
      onError: message => setError(message),
      onSettled: () => setBusy(null),
    }))
    loader.current = instance
    setSnapshot(null)
    setError('')
    setNotice('')
    setView('home')
    setSearchQuery('')
    setManualOpen(false)
    setManualProvider('')
    setManualModel('')

    void instance.load()
    const unsubscribe = instance.subscribe(() => { void instance.load({ silent: true }) })
    return () => {
      unsubscribe()
      instance.invalidate()
      generation.current += 1
      loader.current = null
      if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
    }
  }, [api, adopt, sessionId])

  const commit = useCallback(async (
    mode: 'follow' | 'inherit' | 'custom',
    override: RouteSpec | null,
    successNotice: string,
    onSuccess?: () => void,
  ): Promise<void> => {
    if (busy !== null) return
    const token = ++generation.current
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const next = await api.save(sessionId, { mode, override })
      if (token !== generation.current) return
      adopt(next)
      setNotice(successNotice)
      onSuccess?.()
      if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
      noticeTimer.current = setTimeout(() => setNotice(''), NOTICE_TTL)
    } catch (cause) {
      if (token === generation.current) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    } finally {
      if (token === generation.current) {
        setBusy(null)
        setPendingEffort(null)
      }
    }
  }, [adopt, api, busy, sessionId])

  const locked = snapshot?.enabled === false
  const disabled = busy !== null || locked

  if (snapshot === null) {
    return h('div', { className: 'srpop', 'aria-busy': true },
      h('style', null, POPOVER_PANEL_CSS),
      h('div', { className: 'srpop-head' },
        h('span', { className: 'srpop-title' }, '子代理模型'),
        h('button', { type: 'button', className: 'srpop-close', 'aria-label': '关闭面板', onClick: onClose }, '×'),
      ),
      error === ''
        ? [
            h('div', { key: 'a', className: 'srpop-skeleton', style: { height: 44, margin: '12px 14px 4px' } }),
            h('div', { key: 'b', className: 'srpop-skeleton', style: { height: 140, margin: '8px 14px 14px' } }),
          ]
        : h('div', { className: 'srpop-body' },
            h('p', { className: 'srpop-error', role: 'alert' }, error),
            h('button', {
              type: 'button',
              className: 'srpop-primary',
              onClick: () => { setBusy('load'); setError(''); void loader.current?.load() },
            }, '重试'),
          ),
    )
  }

  const effective = snapshot.effective
  const sessionRecord = snapshot.session
  const groups = (snapshot.catalog ?? []).filter(group => group.models.length > 0)

  // 严格区分当前持久化状态：follow / inherit / custom，不可混同
  const isCustom = sessionRecord?.mode === 'custom'
  const isInherit = sessionRecord?.mode === 'inherit'
  const isFollow = sessionRecord === undefined

  const currentProvider = isCustom ? sessionRecord.provider : undefined
  const currentModel = isCustom ? sessionRecord.model : undefined
  const currentEffort = isCustom ? (sessionRecord.reasoningEffort ?? '') : ''

  // 匹配当前模型对象以获取其 reasoning effort 档位
  const selectedEntry = isCustom && currentModel !== undefined
    ? groups
        .flatMap(group => group.models.map(model => ({ group, model })))
        .find(item => item.model.id === currentModel && (currentProvider === undefined || item.group.id === currentProvider))
    : undefined
  const efforts = selectedEntry?.model.reasoning?.efforts ?? []

  // 目录外手动模型
  const manualActive = isCustom
    && currentProvider !== undefined
    && currentModel !== undefined
    && selectedEntry === undefined

  // 过滤供应商与模型
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredGroups = groups.map(group => {
    const groupMatches = group.name.toLowerCase().includes(normalizedQuery) || group.id.toLowerCase().includes(normalizedQuery)
    const matchingModels = group.models.filter(model =>
      groupMatches ||
      model.name.toLowerCase().includes(normalizedQuery) ||
      model.id.toLowerCase().includes(normalizedQuery),
    )
    return {
      ...group,
      models: matchingModels,
    }
  }).filter(group => group.models.length > 0)

  const handlePickModel = (provider: string, model: string, defaultEffort?: string): void => {
    if (disabled) return
    // 若已是当前选择且思考档位未变，不重复保存
    if (isCustom && currentProvider === provider && currentModel === model) return
    void commit('custom', {
      provider,
      model,
      ...(defaultEffort ? { reasoningEffort: defaultEffort } : {}),
    }, `已保存：${provider} / ${model}`)
  }

  const handlePickEffort = (effort: string): void => {
    if (disabled || currentProvider === undefined || currentModel === undefined) return
    setPendingEffort(effort)
    void commit('custom', {
      provider: currentProvider,
      model: currentModel,
      ...(effort === '' ? {} : { reasoningEffort: effort }),
    }, effort === '' ? '已恢复模型默认思考档位' : `思考档位已切换至「${effort}」`)
  }

  const handleSubmitManual = (): void => {
    const provider = manualProvider.trim()
    const model = manualModel.trim()
    if (disabled || provider === '' || model === '') return
    void commit('custom', { provider, model }, `已保存手动输入模型 ${provider} / ${model}`, () => {
      // 成功才收起并清空
      setManualOpen(false)
      setManualProvider('')
      setManualModel('')
    })
  }

  // --- 视图渲染：1. 首页 (view === 'home') ---
  const renderHome = () => {
    const effectiveDesc = describe(effective?.spec)

    return [
      h('div', { key: 'current', className: 'srpop-current' },
        h('div', { key: 'top', className: 'srpop-current-top' },
          h('span', { className: 'srpop-current-label' }, '当前实际生效'),
          h('span', { className: 'srpop-current-badge' },
            isCustom ? '本会话指定' : isInherit ? '继承主代理' : '跟随全局'),
        ),
        h('div', { key: 'val', className: 'srpop-current-val', title: effectiveDesc }, effectiveDesc),
        h('div', { key: 'sub', className: 'srpop-current-sub' },
          locked
            ? '插件总开关已关闭，任何配置均未生效。'
            : isCustom
              ? `本会话显式指定了模型，下一次派活优先使用此配置。`
              : isInherit
                ? '本会话强制继承主代理模型，不跟随项目路由规则。'
                : '跟随全局配置；若命中项目目录路由规则将按规则分发。',
        ),
      ),

      h('div', { key: 'modes', className: 'srpop-modes', role: 'group', 'aria-label': '子代理模型配置方式' },
        // 选项 1: 跟随全局
        h('button', {
          key: 'follow',
          type: 'button',
          className: 'srpop-mode',
          'aria-pressed': isFollow,
          disabled,
          onClick: () => {
            if (disabled || isFollow) return
            void commit('follow', null, '已切换为跟随全局策略')
          },
        },
          h('div', { className: 'srpop-mode-content' },
            h('span', { className: 'srpop-mode-title' }, '跟随全局策略'),
            h('span', { className: 'srpop-mode-desc' }, '清除本会话覆盖，使用项目规则或全局默认'),
          ),
          h('div', { className: 'srpop-mode-tail' },
            isFollow ? h('span', { className: 'srpop-check', 'aria-hidden': 'true' }, '✓') : null,
          ),
        ),

        // 选项 2: 继承主代理
        h('button', {
          key: 'inherit',
          type: 'button',
          className: 'srpop-mode',
          'aria-pressed': isInherit,
          disabled,
          onClick: () => {
            if (disabled || isInherit) return
            void commit('inherit', null, '已设置为强制继承主代理模型')
          },
        },
          h('div', { className: 'srpop-mode-content' },
            h('span', { className: 'srpop-mode-title' }, '继承主代理'),
            h('span', { className: 'srpop-mode-desc' }, '子代理直接使用主会话模型，忽略路由规则'),
          ),
          h('div', { className: 'srpop-mode-tail' },
            isInherit ? h('span', { className: 'srpop-check', 'aria-hidden': 'true' }, '✓') : null,
          ),
        ),

        // 选项 3: 指定模型… (只进入二级选择页，绝不自动保存)
        h('button', {
          key: 'custom',
          type: 'button',
          className: 'srpop-mode',
          'aria-pressed': isCustom,
          disabled,
          onClick: () => {
            if (disabled) return
            setView('select')
            setError('')
          },
        },
          h('div', { className: 'srpop-mode-content' },
            h('span', { className: 'srpop-mode-title' }, '指定模型…'),
            h('span', { className: 'srpop-mode-desc' },
              isCustom
                ? `已选：${currentProvider ?? ''} / ${currentModel ?? ''}`
                : '从可用供应商中点选或手动输入'),
          ),
          h('div', { className: 'srpop-mode-tail' },
            isCustom ? h('span', { className: 'srpop-check', 'aria-hidden': 'true' }, '✓') : null,
            h('span', { className: 'srpop-arrow', 'aria-hidden': 'true' }, '›'),
          ),
        ),
      ),
    ]
  }

  // --- 视图渲染：2. 二级选择页 (view === 'select') ---
  const renderSelect = () => {
    // 思考档位调节区（仅当已选模型支持多个档位时展示）
    const effortRow = isCustom && efforts.length > 1
      ? h('div', { className: 'srpop-efforts', role: 'group', 'aria-label': '思考档位' },
          h('span', { className: 'srpop-efforts-label' }, '思考档位'),
          [{ id: '', name: '默认' }, ...efforts].map(level => h('button', {
            key: level.id === '' ? '__default__' : level.id,
            type: 'button',
            className: 'srpop-effort',
            'aria-pressed': (pendingEffort ?? currentEffort) === level.id,
            disabled,
            onClick: () => handlePickEffort(level.id),
          }, level.name || level.id)),
        )
      : null

    // 手动输入模型表单（有可见 label，失败保持 form 和 draft，成功才收起）
    const manualForm = manualOpen
      ? h('form', {
          className: 'srpop-manual',
          onSubmit: (event: Event) => {
            event.preventDefault()
            handleSubmitManual()
          },
        },
          h('div', { className: 'srpop-manual-field' },
            h('label', { className: 'srpop-label', htmlFor: 'srpop-manual-provider-input' }, '提供商 (Provider)'),
            h('input', {
              id: 'srpop-manual-provider-input',
              className: 'srpop-input',
              placeholder: '例如 openai 或 anthropic',
              value: manualProvider,
              disabled,
              onChange: (e: Event) => setManualProvider((e.target as HTMLInputElement).value),
            }),
          ),
          h('div', { className: 'srpop-manual-field' },
            h('label', { className: 'srpop-label', htmlFor: 'srpop-manual-model-input' }, '模型标识 (Model)'),
            h('input', {
              id: 'srpop-manual-model-input',
              className: 'srpop-input',
              placeholder: '例如 gpt-4o 或 claude-3-5-sonnet',
              value: manualModel,
              disabled,
              onChange: (e: Event) => setManualModel((e.target as HTMLInputElement).value),
            }),
          ),
          h('div', { className: 'srpop-manual-actions' },
            h('button', {
              type: 'submit',
              className: 'srpop-primary',
              disabled: disabled || manualProvider.trim() === '' || manualModel.trim() === '',
            }, '保存并应用'),
            h('button', {
              type: 'button',
              className: 'srpop-ghost',
              onClick: () => {
                setManualOpen(false)
                // 取消时收起表单，但保留 draft 方便下次再次打开
              },
            }, '取消'),
          ),
        )
      : h('button', {
          type: 'button',
          className: 'srpop-link',
          disabled,
          onClick: () => setManualOpen(true),
        }, '+ 手动输入模型')

    return [
      // 搜索框
      h('div', { key: 'search', className: 'srpop-search-bar' },
        h('input', {
          className: 'srpop-input',
          type: 'search',
          placeholder: '搜索提供商或模型名称…',
          'aria-label': '搜索模型',
          value: searchQuery,
          disabled,
          onChange: (e: Event) => setSearchQuery((e.target as HTMLInputElement).value),
        }),
      ),

      effortRow,

      // 若当前指定的是目录外的自定义代理，展示当前选中项
      manualActive
        ? h('div', { key: 'manual-active', className: 'srpop-manual-current' },
            h('span', { className: 'srpop-dot', 'aria-hidden': 'true' }),
            h('span', { className: 'srpop-item-name', title: `${currentProvider} / ${currentModel}` },
              `${currentProvider} / ${currentModel} (手动输入)`),
            h('span', { className: 'srpop-check', 'aria-hidden': 'true' }, '✓'),
          )
        : null,

      // 垂直供应商分组与纵向单列模型列表
      groups.length === 0
        ? h('p', { key: 'empty-cat', className: 'srpop-empty' }, '未探测到可用的模型目录，请使用下方手动输入模型。')
        : filteredGroups.length === 0
          ? h('p', { key: 'no-match', className: 'srpop-empty' }, `未找到与「${searchQuery}」匹配的模型`)
          : h('div', { key: 'list', className: 'srpop-list', role: 'list' },
              filteredGroups.map(group => h('div', { key: group.id, className: 'srpop-group-wrap' },
                h('div', { className: 'srpop-group' },
                  h('span', { className: 'srpop-dot', 'aria-hidden': 'true' }),
                  h('span', { className: 'srpop-group-name', title: group.name || group.id }, group.name || group.id),
                ),
                group.models.map(model => {
                  const active = isCustom && currentModel === model.id && currentProvider === group.id
                  const effortCount = model.reasoning?.efforts?.length ?? 0
                  return h('button', {
                    key: model.id,
                    type: 'button',
                    className: 'srpop-item',
                    'data-active': active ? 'true' : 'false',
                    disabled,
                    title: model.name || model.id,
                    onClick: () => handlePickModel(group.id, model.id, model.reasoning?.defaultEffort),
                  },
                    h('span', { className: 'srpop-item-name' }, model.name || model.id),
                    effortCount > 1 ? h('span', { className: 'srpop-badge' }, `${effortCount} 档`) : null,
                    active ? h('span', { className: 'srpop-check', 'aria-hidden': 'true' }, '✓') : null,
                  )
                }),
              )),
            ),

      manualForm,
    ]
  }

  return h('div', { className: 'srpop', 'aria-busy': busy !== null },
    h('style', null, POPOVER_PANEL_CSS),

    // 顶部 Header：首页显示主标题；二级选择页显示返回按钮
    h('div', { className: 'srpop-head' },
      h('div', { className: 'srpop-head-start' },
        view === 'select'
          ? h('button', {
              type: 'button',
              className: 'srpop-back',
              'aria-label': '返回上一页',
              disabled: busy !== null,
              onClick: () => {
                // 返回首页不保存
                setView('home')
                setError('')
              },
            }, '‹ 返回')
          : null,
        h('h3', { className: 'srpop-title' }, view === 'select' ? '选择子代理模型' : '子代理模型'),
      ),
      h('button', {
        type: 'button',
        className: 'srpop-close',
        'aria-label': '关闭面板',
        onClick: onClose,
      }, '×'),
    ),

    // 内容主体
    h('div', { className: 'srpop-body' },
      view === 'home' ? renderHome() : renderSelect(),
      error ? h('p', { className: 'srpop-error', role: 'alert' }, error) : null,
      notice ? h('p', { className: 'srpop-notice', role: 'status' }, notice) : null,
    ),
  )
}
