import { describe, expect, it } from 'vitest'
import { popupFrame } from '../../src/client/popup-placement'

const viewport = { width: 900, height: 800 }

describe('popupFrame 内容无关的锚点布局', () => {
  it('底部输入框向上展开，以 bottom 固定底边且留 8px 间距', () => {
    const frame = popupFrame({ left: 40, right: 860, top: 680, bottom: 800 }, viewport)
    expect(frame).toEqual({ left: 500, width: 360, maxHeight: 480, side: 'top', bottom: 128 })
    expect(frame.top).toBeUndefined()
  })

  it('上方不足时向下展开，top 不依赖骨架或列表高度', () => {
    const anchor = { left: 40, right: 860, top: 180, bottom: 300 }
    const frame = popupFrame(anchor, viewport)
    expect(frame).toEqual({ left: 500, width: 360, maxHeight: 480, side: 'bottom', top: 308 })
    expect(popupFrame(anchor, viewport, frame.side)).toEqual(frame)
  })

  it('两侧都小时采用实际可用高度，不用200px下限压住输入框', () => {
    const frame = popupFrame({ left: 0, right: 320, top: 160, bottom: 280 }, { width: 320, height: 360 })
    expect(frame.side).toBe('top')
    expect(frame.maxHeight).toBe(140)
    expect(frame.width).toBe(296)
    expect(frame.left).toBe(12)
  })

  it.each([240, 280, 320, 420, 900])('%ipx 宽视口左右均保留12px', width => {
    for (const right of [24, 120, width, width + 80]) {
      const frame = popupFrame({ left: right - 100, right, top: 600, bottom: 700 }, { width, height: 800 })
      expect(frame.left).toBeGreaterThanOrEqual(12)
      expect(frame.left + frame.width).toBeLessThanOrEqual(width - 12)
    }
  })

  it('同次展开锁方向；重开则重新选择可用侧', () => {
    const anchor = { left: 40, right: 860, top: 100, bottom: 220 }
    expect(popupFrame(anchor, viewport, 'top').side).toBe('top')
    expect(popupFrame(anchor, viewport).side).toBe('bottom')
  })

  it('锁定侧空间消失时收为0而非制造负尺寸', () => {
    const frame = popupFrame({ left: 40, right: 860, top: 0, bottom: 120 }, viewport, 'top')
    expect(frame.maxHeight).toBe(0)
  })
})
