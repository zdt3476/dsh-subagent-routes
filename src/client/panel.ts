/**
 * 右侧栏控制台：看清「这个会话接下来派出的子代理会用哪套配置」，并当场改掉它。
 *
 * 面板只说三件事：
 * 1. 现在生效的是什么（以及为什么是它——会话覆盖 / 项目规则 / 全局兜底 / 继承）；
 * 2. 想换成什么（跟随规则，或指定一套）；
 * 3. 改完能不能沉淀下来（固化为项目规则）。
 *
 * 规则本身仍由设置页维护：这里不重复一套规则编辑器，避免两个地方都能改同一份 YAML。
 */

import { createElement as h, useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type { RouteSpec, SessionSnapshot } from '../shared/settings'
import { PANEL_CSS } from './panel-styles'
import { RouteFields, type RouteFieldsClasses, type RouteValue } from './route-fields'
import { SOURCE_TEXT, describe } from './route-text'
import { sessionApi, type SessionApi } from './services'

/** 供测试使用的纯函数导出：来源文案与生效值描述（转发自共享模块）。 */
export const internals = { describe, SOURCE_TEXT }

const PANEL_CLASSES: RouteFieldsClasses = {
  // 侧栏最窄约 300px，三列会把每个下拉挤到 70px 左右，因此这里强制纵向堆叠。
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

type Mode = 'follow' | 'custom'

/**
 * 路由控制台面板。
 *
 * 所有写操作都以宿主返回的最新快照为准：面板不自行推算「改完会怎样」，
 * 否则一旦优先级规则调整，界面显示与实际派活就会不一致。
 */
export function RoutePanel({ sessionId, api = sessionApi }: RoutePanelProps): ReactElement {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [mode, setMode] = useState<Mode>('follow')
  const [draft, setDraft] = useState<RouteValue>({ provider: '', model: '', reasoningEffort: '' })
  const [busy, setBusy] = useState<'load' | 'save' | 'freeze' | null>('load')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // 切会话时丢弃上一个会话迟到的响应，避免把 A 的结果写进 B 的面板。
  const generation = useRef(0)

  const adopt = useCallback((next: SessionSnapshot) => {
    setSnapshot(next)
    setMode(next.override === undefined ? 'follow' : 'custom')
    setDraft({
      provider: next.override?.provider ?? '',
      model: next.override?.model ?? '',
      reasoningEffort: next.override?.reasoningEffort ?? '',
    })
  }, [])

  const load = useCallback(async () => {
    const token = ++generation.current
    setBusy('load')
    setError('')
    try {
      const next = await api.load(sessionId)
      if (token === generation.current) adopt(next)
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (token === generation.current) setBusy(null)
    }
  }, [api, adopt, sessionId])

  useEffect(() => {
    setSnapshot(null)
    setError('')
    setNotice('')
    void load()
    return () => {
      // 卸载时让在途请求作废。
      generation.current += 1
    }
  }, [load])

  const locked = snapshot?.enabled === false

  const handleMode = (next: Mode): void => {
    setMode(next)
    setNotice('')
    setError('')
    if (next === 'follow') return
    // 切到「指定」时优先拿当前生效值做初值，省掉用户从头选一遍。
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
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const provider = draft.provider.trim()
      const model = draft.model.trim()
      const reasoningEffort = draft.reasoningEffort.trim()
      // 只填思考等级会让本会话覆盖整个项目规则（连模型一起），
      // 用户多半只是想把模型「换档」，所以这里要求把模型一起选好。
      if (mode === 'custom' && (provider === '' || model === '')) {
        setError('请选择完整的提供商与模型；只指定思考等级会覆盖项目规则里的模型')
        return
      }
      const override = mode === 'follow'
        ? null
        : {
            provider,
            model,
            ...(reasoningEffort === '' ? {} : { reasoningEffort }),
          }
      const next = await api.save(sessionId, override)
      adopt(next)
      setNotice(mode === 'follow' ? '已回到项目规则' : '已生效：下一次派活开始使用新配置')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }

  const handleFreeze = async (): Promise<void> => {
    setBusy('freeze')
    setError('')
    setNotice('')
    try {
      const next = await api.freeze(sessionId)
      adopt(next)
      setNotice('已写入项目规则，并清除了本会话的临时指定')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }

  if (snapshot === null) {
    return h('div', { className: 'sr-panel', 'aria-busy': error === '' },
      h('style', null, PANEL_CSS),
      h('div', { className: 'srp-head' },
        h('h2', { className: 'srp-title' }, '子代理模型'),
        h('p', { className: 'srp-sub' }, '控制本会话新派出的子代理。'),
      ),
      // 失败是确定状态：给出原因与重试，不再继续播放「正在加载」的骨架。
      error === ''
        ? [
            h('div', { key: 'a', className: 'srp-skeleton', style: { height: 84 } }),
            h('div', { key: 'b', className: 'srp-skeleton', style: { height: 220 } }),
          ]
        : [
            h('p', { key: 'err', className: 'srp-status is-error', role: 'alert' }, error),
            h('div', { key: 'retry', className: 'srp-actions' },
              h('button', { type: 'button', className: 'srp-btn is-primary', onClick: () => void load() }, '重试')),
          ],
    )
  }

  const effective = snapshot.effective
  const source = effective === undefined ? SOURCE_TEXT.inherit : SOURCE_TEXT[effective.source] ?? SOURCE_TEXT.inherit
  const isOverride = snapshot.override !== undefined
  const disabled = busy !== null || locked

  return h('div', { className: 'sr-panel', 'aria-busy': busy !== null },
    h('style', null, PANEL_CSS),

    h('div', { className: 'srp-head' },
      h('h2', { className: 'srp-title' }, '子代理模型'),
      h('p', { className: 'srp-sub' },
        '控制本会话新派出的子代理。已在运行的子代理保持原配置。'),
    ),

    // 当前生效：面板里最需要一眼看清的东西
    h('div', { className: `srp-now${isOverride ? ' is-session' : ''}` },
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
    ),

    // 模式 + 指定值
    h('div', { className: 'srp-card' },
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
          h('span', { className: 'srp-mode-name' }, '跟随项目规则'),
          h('span', { className: 'srp-mode-desc' }, '按目录自动选择，不用每次改'),
        ),
        h('button', {
          type: 'button',
          className: 'srp-mode',
          'aria-pressed': mode === 'custom',
          disabled,
          onClick: () => handleMode('custom'),
        },
          h('span', { className: 'srp-mode-name' }, '指定一套'),
          h('span', { className: 'srp-mode-desc' }, '只影响本会话，优先于项目规则'),
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
              // 改了参数就清掉上一条报错，否则修正后仍停在「请选择完整的提供商与模型」。
              setError('')
            },
          })
        : h('p', { className: 'srp-hint', style: { margin: 0 } },
            snapshot.workspace === undefined
              ? '当前目录没有命中项目规则，子代理会继承全局兜底或主会话模型。'
              : `当前目录命中规则：${describe(snapshot.workspace.spec)}`),

      h('div', { className: 'srp-actions' },
        h('button', {
          type: 'button',
          className: 'srp-btn is-primary',
          disabled,
          onClick: () => void handleSave(),
        }, busy === 'save' ? '保存中…' : (mode === 'follow' ? '回到项目规则' : '应用到此会话')),
        h('button', {
          type: 'button',
          className: 'srp-btn',
          disabled: disabled || !isOverride,
          title: isOverride ? '把本会话的指定写进项目路由规则' : '先指定一套配置才能固化',
          onClick: () => void handleFreeze(),
        }, busy === 'freeze' ? '固化中…' : '固化为项目规则'),
        h('button', {
          type: 'button',
          className: 'srp-btn',
          disabled: busy !== null,
          onClick: () => void load(),
        }, busy === 'load' ? '读取中…' : '刷新'),
      ),

      // 反馈放在按钮之后：出现时不把按钮往下推，避免点完立刻错位。
      error ? h('p', { className: 'srp-status is-error', role: 'alert' }, error) : null,
      notice ? h('p', { className: 'srp-status', role: 'status' }, notice) : null,
    ),
  )
}
