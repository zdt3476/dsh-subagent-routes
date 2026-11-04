import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RouteStatusChip } from '../../src/client/status-chip'
import type { SessionApi } from '../../src/client/services'
import type { SessionSnapshot } from '../../src/shared/settings'

const SNAPSHOT: SessionSnapshot = {
  sessionId: 's1',
  directory: '/work/app',
  tableAvailable: true,
  enabled: true,
  mode: 'follow',
  defaultPolicy: 'rules',
  workspace: { spec: { provider: 'ws-p', model: 'ws-m' }, path: '/work/app' },
  effective: { source: 'workspace', spec: { provider: 'ws-p', model: 'ws-m' }, workspacePath: '/work/app' },
}

function api(snapshot: SessionSnapshot | Error): SessionApi {
  return {
    load: vi.fn(async () => {
      if (snapshot instanceof Error) throw snapshot
      return snapshot
    }),
    save: vi.fn(),
    freeze: vi.fn(),
  }
}

describe('输入区状态药丸', () => {
  it('首次渲染（尚未拿到数据）不输出任何 DOM', () => {
    const html = renderToStaticMarkup(h(RouteStatusChip, { sessionId: 's1', onOpen: () => undefined, api: api(SNAPSHOT) }))
    // 服务端渲染只有首帧：数据未到时不占位，避免输入区出现空框。
    expect(html).toBe('')
  })

  it('样式常量本身携带药丸规则，不依赖面板', async () => {
    const { CHIP_CSS, PANEL_CSS } = await import('../../src/client/panel-styles')
    expect(CHIP_CSS).toContain('.sr-chip')
    // 拆分后，面板样式里不应再残留药丸规则（否则两处维护会分叉）。
    expect(PANEL_CSS).not.toContain('.sr-chip')
  })

  it('药丸样式包含窄屏收缩与焦点可见规则', async () => {
    const { CHIP_CSS } = await import('../../src/client/panel-styles')
    expect(CHIP_CSS).toContain('@media (max-width: 720px)')
    expect(CHIP_CSS).toContain('.sr-chip:focus-visible')
    expect(CHIP_CSS).toContain('text-overflow: ellipsis')
  })
})

describe('胶囊与面板必须对同一状态给出同一个说法', () => {
  it('全局兜底只配了思考等级时，生效值不是「继承主代理」', async () => {
    const { describeRoute } = await import('../../src/client/route-text')
    // 复现用户看到的错配：来源是 fallback（面板显示「全局兜底」），
    // 但生效配置只有 reasoningEffort。旧实现里胶囊会因为缺 provider/model
    // 而显示「继承主代理」，与面板的「全局兜底」自相矛盾。
    const snapshot: SessionSnapshot = {
      sessionId: 's1',
      directory: '/work/app',
      tableAvailable: true,
      enabled: true,
      mode: 'follow',
      defaultPolicy: 'rules',
      effective: { source: 'fallback', spec: { reasoningEffort: 'high' } },
    }
    const chip = describeRoute(snapshot)
    expect(chip.label).not.toBe('继承主代理')
    expect(chip.label).toBe('思考等级 high')
    expect(chip.sourceLabel).toBe('全局兜底')
  })

  it('确实没有任何配置时，来源与生效值都指向继承', async () => {
    const { describeRoute } = await import('../../src/client/route-text')
    const snapshot: SessionSnapshot = {
      sessionId: 's1',
      directory: undefined,
      tableAvailable: true,
      enabled: true,
      mode: 'follow',
      defaultPolicy: 'rules',
    }
    const chip = describeRoute(snapshot)
    expect(chip.label).toBe('继承主代理')
    expect(chip.sourceLabel).toBe('继承主代理')
  })

  it('面板与胶囊共用同一套来源文案，不存在两份定义', async () => {
    const shared = await import('../../src/client/route-text')
    const panel = await import('../../src/client/panel')
    // 同一个对象引用即证明面板没有另写一份，避免再次分叉。
    expect(panel.internals.SOURCE_TEXT).toBe(shared.SOURCE_TEXT)
  })
})
