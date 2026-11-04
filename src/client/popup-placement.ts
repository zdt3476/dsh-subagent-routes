/** 与内容高度无关的浮层布局：先确定可用方向，再由 CSS 从锚点边缘向外生长。 */
export interface AnchorRect {
  left: number
  right: number
  top: number
  bottom: number
}
export interface Viewport { width: number; height: number }
export type Side = 'top' | 'bottom'
export interface PopupFrame {
  left: number
  top?: number
  bottom?: number
  width: number
  maxHeight: number
  side: Side
}

export const POPUP_MARGIN = 12
const ANCHOR_GAP = 8
const PANEL_WIDTH = 360
const PANEL_MAX_HEIGHT = 480
const PREFERRED_TOP_SPACE = 240

/** lockedSide 只在本次打开期间沿用；重新打开时不传，以适应锚点移动。 */
export function popupFrame(anchor: AnchorRect, viewport: Viewport, lockedSide?: Side): PopupFrame {
  const width = Math.max(0, Math.min(PANEL_WIDTH, viewport.width - POPUP_MARGIN * 2))
  const above = Math.max(0, anchor.top - ANCHOR_GAP - POPUP_MARGIN)
  const below = Math.max(0, viewport.height - anchor.bottom - ANCHOR_GAP - POPUP_MARGIN)
  const side = lockedSide ?? (above >= PREFERRED_TOP_SPACE || above >= below ? 'top' : 'bottom')
  return {
    left: Math.max(POPUP_MARGIN, Math.min(anchor.right - width, viewport.width - POPUP_MARGIN - width)),
    width,
    maxHeight: Math.min(PANEL_MAX_HEIGHT, side === 'top' ? above : below),
    side,
    ...(side === 'top'
      ? { bottom: viewport.height - anchor.top + ANCHOR_GAP }
      : { top: anchor.bottom + ANCHOR_GAP }),
  }
}
