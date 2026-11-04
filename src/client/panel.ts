/**
 * 右侧栏与就地浮层控制台面板：看清「这个会话接下来派出的子代理会用哪套配置」，并当场改掉它。
 *
 * 面板核心职责：
 * 1. 现在生效的是什么（以及为什么是它——会话指定 / 项目规则 / 全局兜底 / 继承主代理）；
 * 2. 想换成什么（三态：跟随全局策略 / 强制继承主代理 / 指定一套）；
 * 3. 改完能不能沉淀下来（固化为项目规则）。
 *
 * 两种形态（sidebar 与 popover）共用同一个组件，通过 variant 区分样式修饰与关闭按钮。
 */

import { createElement as h, useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type { RouteSpec, SessionMode, SessionSnapshot } from '../shared/settings'
import { PANEL_CSS } from './panel-styles'
import { RouteFields, type RouteFieldsClasses, type RouteValue } from './route-fields'
import { SOURCE_TEXT, describe } from './route-text'
import { createSessionLoader, type LoadOptions, type SessionLoader } from './panel-loader'
import { sessionApi, type SessionApi } from './services'

/** 供测试使用的纯函数导出：来源文案与生效值描述（转发自共享模块）。 */
export const internals = { describe, SOURCE_TEXT }

const PANEL_CLASSES: RouteFieldsClasses = {
  grid: 'srp-grid',
  field: 'srp-field',
  fieldHead: 'srp-field-head',
  label: 'srp-label',
  link: 'srp-btn',
  input: 'srp-input',
  select: 'srp-select',
  hint: 'srp-hint',
}

export interface RoutePanelProps {
  sessionId: string
  api?: SessionApi
}

/**
 * 侧栏路由控制台面板。
 *
 * 输入区的就地浮层用的是另一套组件（popover-panel）：浮层空间紧张、
 * 以「点即生效」的列表为主；侧栏空间充裕、以配置表单为主。
 * 两者共用同一份共享判定与数据面，只是呈现形态不同。
 */
export function RoutePanel({ sessionId, api = sessionApi }: RoutePanelProps): ReactElement {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [mode, setMode] = useState<SessionMode>('follow')
  const [draft, setDraft] = useState<RouteValue>({ provider: '', model: '', reasoningEffort: '' })
  const [busy, setBusy] = useState<'load' | 'save' | 'freeze' | null>('load')
  /** 面板根节点：用于把刚展开/刚报错的内容滚进可视区。 */
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // 切会话时递增代次，丢弃迟到的写操作响应
  const generation = useRef(0)

  const adopt = useCallback((next: SessionSnapshot) => {
    setSnapshot(next)
    setMode(next.mode)
    const customSpec = next.session?.mode === 'custom' ? next.session : undefined
    setDraft({
      provider: customSpec?.provider ?? '',
      model: customSpec?.model ?? '',
      reasoningEffort: customSpec?.reasoningEffort ?? '',
    })
  }, [])

  const loader = useRef<SessionLoader | null>(null)
  const load = useCallback(async (options?: LoadOptions) => {
    const silent = options?.silent === true
    if (silent) {
      await loader.current?.load({ silent: true })
      return
    }
    setBusy('load')
    setError('')
    await loader.current?.load()
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
    void instance.load()

    const unsubscribe = instance.subscribe(() => { void instance.load({ silent: true }) })
    return () => {
      unsubscribe()
      instance.invalidate()
      generation.current += 1
      loader.current = null
    }
  }, [api, adopt, sessionId])

  const locked = snapshot?.enabled === false

  /*
   * 把某个区域滚进可视区。
   * 浮层高度有限，custom 模式展开三字段或错误提示出现时，
   * 内容可能落在滚动区外——用户会以为「没有这个选项」或「保存没反应」。
   */
  const reveal = (selector: string): void => {
    requestAnimationFrame(() => {
      rootRef.current?.querySelector(selector)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const handleMode = (next: SessionMode): void => {
    setMode(next)
    setNotice('')
    setError('')
    if (next !== 'custom') return
    // 切到自定义后把最后一个字段带进视野，避免用户以为只有两个下拉
    reveal('.srp-field:last-of-type')
    // 切到「指定」时优先拿当前生效值或工作区规则做初值，省掉用户从头选一遍
    const seed = snapshot?.effective?.spec ?? snapshot?.workspace?.spec
    setDraft(current => {
      if (current.provider !== '' || current.model !== '') return current
      return {
        provider: seed?.provider ?? '',
        model: seed?.model ?? '',
        reasoningEffort: seed?.reasoningEffort ?? '',
      }
    })
  }

  const handleSave = async (): Promise<void> => {
    const token = ++generation.current
    setBusy('save')
    setError('')
    setNotice('')
    try {
      let override: RouteSpec | null = null
      if (mode === 'custom') {
        const provider = draft.provider.trim()
        const model = draft.model.trim()
        const reasoningEffort = draft.reasoningEffort.trim()
        if (provider === '' || model === '') {
          setError('请选择完整的提供商与模型；只指定思考等级会覆盖项目规则里的模型')
          return
        }
        override = {
          provider,
          model,
          ...(reasoningEffort === '' ? {} : { reasoningEffort }),
        }
      }
      const next = await api.save(sessionId, { mode, override })
      if (token !== generation.current) return
      adopt(next)
      if (mode === 'follow') {
        setNotice('已恢复跟随全局策略')
      } else if (mode === 'inherit') {
        setNotice('已设置为强制继承主代理模型')
      } else {
        setNotice('已生效：下一次派活开始使用新配置')
      }
    } catch (cause) {
      if (token === generation.current) {
        setError(cause instanceof Error ? cause.message : String(cause))
        reveal('.srp-status.is-error')
      }
    } finally {
      if (token === generation.current) setBusy(null)
    }
  }

  const handleFreeze = async (): Promise<void> => {
    const token = ++generation.current
    setBusy('freeze')
    setError('')
    setNotice('')
    try {
      const next = await api.freeze(sessionId)
      if (token !== generation.current) return
      adopt(next)
      setNotice('已写入项目规则，并清除了本会话的临时指定')
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (token === generation.current) setBusy(null)
    }
  }

  // 加载与错误态骨架
  if (snapshot === null) {
    return h('div', { className: 'sr-panel', 'aria-busy': error === '' },
      h('style', null, PANEL_CSS),
      h('div', { className: 'srp-head' },
        h('div', { className: 'srp-head-text' },
          h('h2', { className: 'srp-title' }, '子代理模型'),
          h('p', { className: 'srp-sub' }, '控制本会话新派出的子代理。'),
        ),
      ),
      h('div', { className: 'srp-scroll' },
        // 失败是确定状态：给出原因与重试，不再继续播放「正在加载」的骨架。
        error === ''
          ? [
              h('div', { key: 'a', className: 'srp-skeleton', style: { height: 84 } }),
              h('div', { key: 'b', className: 'srp-skeleton', style: { height: 180 } }),
            ]
          : [
              h('p', { key: 'err', className: 'srp-status is-error', role: 'alert' }, error),
              h('div', { key: 'retry', className: 'srp-actions' },
                h('button', { type: 'button', className: 'srp-btn is-primary', onClick: () => void load() }, '重试')),
            ],
      ),
    )
  }

  const effective = snapshot.effective
  const source = effective === undefined ? SOURCE_TEXT.inherit : SOURCE_TEXT[effective.source] ?? SOURCE_TEXT.inherit
  // 只有本会话真的改过才用「已指定」的强调态；follow 与没配过必须一致。
  const isSessionOverride = snapshot.session !== undefined
  const disabled = busy !== null || locked
  const canFreeze = snapshot.session?.mode === 'custom'

  // 左侧（或上方）：当前生效与环境状态
  const summaryBlock = h('div', { className: `srp-now${isSessionOverride ? ' is-session' : ''}` },
    h('div', { className: 'srp-now-top' },
      h('span', { className: 'srp-now-label' }, '当前生效'),
      h('span', { className: 'srp-now-value', title: describe(effective?.spec) }, describe(effective?.spec)),
      h('span', { className: 'srp-now-badge' }, source.label),
    ),
    h('p', { className: 'srp-now-meta', style: { margin: 0 } },
      effective?.workspacePath === undefined
        ? source.hint
        : `命中规则目录 ${effective.workspacePath}。${source.hint}`),
    snapshot.directory === undefined
      ? h('p', { className: 'srp-hint is-warn', style: { margin: 0 } }, '未能读取会话所在目录，项目规则无法匹配。')
      : h('p', { className: 'srp-now-meta', style: { margin: 0 } }, `工作目录 ${snapshot.directory}`),
    locked
      ? h('p', { className: 'srp-hint is-warn', style: { margin: 0 } },
          '插件当前已暂停，任何配置都不会生效。请在设置页重新启用。')
      : null,
    snapshot.tableAvailable
      ? null
      : h('p', { className: 'srp-hint is-warn', style: { margin: 0 } },
          '路由表当前无法解析，项目规则暂不可用；本会话的临时指定仍然有效。'),
  )

  // 模式切换按钮说明文案
  const followDesc = snapshot.defaultPolicy === 'inherit'
    ? '全局：继承主代理模型'
    : '全局：按项目规则路由'

  // 主保存按钮文案
  const saveLabel = busy === 'save'
    ? '保存中…'
    : mode === 'follow'
      ? '跟随全局策略'
      : mode === 'inherit'
        ? '应用继承'
        : '应用到此会话'

  // 右侧（或下方）：三态配置、表单与操作按钮
  const controlsBlock = h('div', { className: 'srp-card' },
    h('div', { className: 'srp-card-head' },
      h('h3', { className: 'srp-card-title' }, '本会话配置'),
    ),
    h('div', { className: 'srp-modes', role: 'group', 'aria-label': '子代理配置来源' },
      h('button', {
        type: 'button',
        className: 'srp-mode',
        'aria-pressed': mode === 'follow',
        disabled,
        onClick: () => handleMode('follow'),
      },
        h('span', { className: 'srp-mode-name' }, '跟随全局策略'),
        h('span', { className: 'srp-mode-desc', title: followDesc }, followDesc),
      ),
      h('button', {
        type: 'button',
        className: 'srp-mode',
        'aria-pressed': mode === 'inherit',
        disabled,
        onClick: () => handleMode('inherit'),
      },
        h('span', { className: 'srp-mode-name' }, '继承主代理'),
        h('span', { className: 'srp-mode-desc', title: '强制继承主模型' }, '只影响本会话'),
      ),
      h('button', {
        type: 'button',
        className: 'srp-mode',
        'aria-pressed': mode === 'custom',
        disabled,
        onClick: () => handleMode('custom'),
      },
        h('span', { className: 'srp-mode-name' }, '指定一套'),
        h('span', { className: 'srp-mode-desc', title: '指定专属模型' }, '只影响本会话'),
      ),
    ),

    mode === 'custom'
      ? h(RouteFields, {
          provider: draft.provider,
          model: draft.model,
          reasoningEffort: draft.reasoningEffort,
          catalog: snapshot.catalog,
          disabled,
          allowInherit: true,
          allowManual: false,
          classes: PANEL_CLASSES,
          labels: { manual: '手动输入' },
          onChange: next => {
            setDraft(next)
            setNotice('')
            setError('')
          },
        })
      : mode === 'inherit'
        ? h('p', { className: 'srp-hint', style: { margin: 0 } },
            '已选强制继承：子代理将无条件直接复用主代理的模型与思考等级。')
        : h('p', { className: 'srp-hint', style: { margin: 0 } },
            snapshot.workspace === undefined
              ? (snapshot.defaultPolicy === 'inherit'
                  ? '全局策略为继承主代理，当前没有指定本会话配置。'
                  : '当前目录未命中项目规则，子代理将使用全局兜底配置或主模型。')
              : `命中项目规则：${describe(snapshot.workspace.spec)}`),

  )

  /*
   * 面板分三段：头部、可滚动内容、底部操作条。
   *
   * 操作条不能放进内容区做 sticky——内容一高它就会盖住最后一个字段；
   * 也不能靠给内容区补 padding 来躲，那样正常状态下会留下一大片死白。
   * 用 flex 把内容区独立成滚动容器，操作条天然占住自己的位置。
   */
  const footerBlock = h('div', { className: 'srp-footer' },
    h('div', { className: 'srp-actions' },
      h('button', {
        type: 'button',
        className: 'srp-btn is-primary',
        disabled,
        onClick: () => void handleSave(),
      }, saveLabel),
      h('button', {
        type: 'button',
        className: 'srp-btn',
        disabled: disabled || !canFreeze,
        title: canFreeze ? '把本会话的指定写进项目路由规则' : '当前未自定义指定一套模型，无法固化',
        onClick: () => void handleFreeze(),
      }, busy === 'freeze' ? '固化中…' : '固化为项目规则'),
      h('button', {
        type: 'button',
        className: 'srp-btn',
        disabled: busy !== null,
        onClick: () => void load(),
      }, busy === 'load' ? '读取中…' : '刷新'),
    ),

    error ? h('p', { className: 'srp-status is-error', role: 'alert' }, error) : null,
    notice ? h('p', { className: 'srp-status', role: 'status' }, notice) : null,
  )

  return h('div', {
    ref: rootRef,
    className: 'sr-panel',
    'aria-busy': busy !== null,
  },
    h('style', null, PANEL_CSS),
    h('div', { className: 'srp-head' },
      h('div', { className: 'srp-head-text' },
        h('h2', { className: 'srp-title' }, '子代理模型'),
        h('p', { className: 'srp-sub' }, '控制本会话新派出的子代理。已在运行的子代理保持原配置。'),
      ),
    ),
    h('div', { className: 'srp-scroll' },
      h('div', { className: 'srp-layout' },
        h('div', { className: 'srp-col-summary' }, summaryBlock),
        h('div', { className: 'srp-col-controls' }, controlsBlock),
      ),
    ),
    footerBlock,
  )
}
