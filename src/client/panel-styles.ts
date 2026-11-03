/**
 * 侧边栏控制台的样式。
 *
 * 全部走宿主语义令牌：面板底色取会话区底色，卡面取 layer-1，
 * 强调色只用品牌色一处，避免右侧栏里出现一套自造的配色体系。
 * 未定义的令牌一律带深色兜底，缺失时也不会掉成透明。
 */
export const PANEL_CSS = `
.sr-panel {
  --srp-text: var(--dsw-alias-label-primary, #1a1a19);
  --srp-muted: var(--dsw-alias-label-secondary, #6b6b66);
  /* 明确用于 11px 小字：tertiary 在浅底上只有约 3:1，达不到 AA 正文要求 */
  --srp-faint: var(--dsw-alias-label-secondary, #6b6b66);
  --srp-line: var(--dsw-alias-border-l1, #e5e4e0);
  --srp-line-strong: var(--dsw-alias-border-l2, #d3d2cd);
  --srp-card: var(--dsw-alias-bg-layer-1, #faf9f7);
  --srp-card-hover: var(--dsw-alias-bg-layer-2, #f3f2ee);
  --srp-accent: var(--dsw-alias-brand-primary, #3f7f6f);
  --srp-accent-ink: var(--dsw-alias-label-primary-inverted, #ffffff);
  --srp-danger: var(--dsw-alias-state-error-primary, #b4453a);
  --srp-warn: var(--dsw-alias-state-warn-primary, #9a6b12);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--srp-text);
  font: var(--dsw-font-xs-13, 13px/20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}
.sr-panel *, .sr-panel *::before, .sr-panel *::after { box-sizing: border-box; }

/* 标题区：一句说明「这里管的是谁」，不做大标题堆叠 */
.srp-head { display: flex; flex-direction: column; gap: 4px; }
.srp-title {
  margin: 0;
  font: var(--dsw-font-s-strong-14, 600 14px/20px -apple-system, sans-serif);
  color: var(--srp-text);
}
.srp-sub { margin: 0; font-size: 12px; line-height: 18px; color: var(--srp-muted); }

/* 当前生效：整块面板唯一的强调色落点 */
.srp-now {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--srp-line);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--srp-card);
}
.srp-now-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.srp-now-label { font-size: 11px; line-height: 16px; color: var(--srp-faint); flex: none; letter-spacing: 0.02em; }
.srp-now-value {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srp-now-badge {
  flex: none;
  font-size: 11px;
  line-height: 16px;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid var(--srp-line-strong);
  color: var(--srp-muted);
}
.srp-now.is-session .srp-now-badge {
  border-color: transparent;
  background: var(--srp-accent);
  color: var(--srp-accent-ink);
}
.srp-now-meta {
  font-size: 11px;
  line-height: 16px;
  color: var(--srp-faint);
  /* 目录路径是没有空格的长串，默认不断行会撑破 300px 的窄栏 */
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* 卡片 */
.srp-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--srp-line);
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--srp-card);
}
.srp-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.srp-card-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--srp-text); }

/* 模式选择：两个并排的整块按钮，热区够大、选中态明确 */
/*
  两个模式按钮：放得下就并排，放不下自动叠成整行。
  用 flex-basis 而不是容器查询——侧栏宽度由拖拽决定，
  但网格列宽的下限在这里就够表达了，也不必依赖容器查询的支持面。
*/
.srp-modes { display: flex; flex-wrap: wrap; gap: 8px; }
.srp-mode {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  text-align: left;
  border: 1px solid var(--srp-line-strong);
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--srp-text);
  cursor: pointer;
  font: inherit;
  /* 低于 132px 时宁可整行独占，也别把说明文字折成三行 */
  flex: 1 1 132px;
  /* 并排时说明文字折两行、独占时一行，固定下限让两种形态的按钮等高 */
  min-height: 56px;
  min-width: 0;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.srp-mode:hover:not(:disabled) { background: var(--srp-card-hover); }
.srp-mode[aria-pressed='true'] {
  border-color: var(--srp-accent);
  box-shadow: inset 0 0 0 1px var(--srp-accent);
}
.srp-mode:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 2px; }
.srp-mode:disabled { opacity: 0.5; cursor: not-allowed; }
.srp-mode-name { font-size: 12px; font-weight: 600; }
.srp-mode-desc { font-size: 11px; line-height: 15px; color: var(--srp-muted); }

/* 字段 */
.srp-grid { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.srp-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.srp-field-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
.srp-label { font-size: 11px; line-height: 16px; color: var(--srp-muted); }
.srp-select, .srp-input {
  width: 100%;
  min-width: 0;
  font: inherit;
  font-size: 12px;
  padding: 6px 8px;
  color: var(--srp-text);
  background: var(--dsw-alias-bg-base, #ffffff);
  border: 1px solid var(--srp-line-strong);
  border-radius: var(--dsw-radius-sm, 6px);
}
.srp-select:focus-visible, .srp-input:focus-visible {
  outline: 2px solid var(--srp-accent);
  outline-offset: 1px;
  border-color: var(--srp-accent);
}
.srp-select:disabled, .srp-input:disabled { opacity: 0.55; cursor: not-allowed; }
.srp-hint {
  font-size: 11px;
  line-height: 15px;
  color: var(--srp-faint);
  overflow-wrap: anywhere;
}
.srp-hint.is-warn { color: var(--srp-warn); }
.srp-hint.is-error { color: var(--srp-danger); }

/* 按钮 */
.srp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
/* 主操作独占一行：300px 窄栏里三个按钮并排会把「刷新」挤成孤零零的第二行 */
.srp-actions .srp-btn.is-primary { flex: 1 1 100%; }
.srp-btn {
  font: inherit;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--dsw-radius-sm, 6px);
  border: 1px solid var(--srp-line-strong);
  background: transparent;
  color: var(--srp-text);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.srp-btn:hover:not(:disabled) { background: var(--srp-card-hover); }
.srp-btn:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 2px; }
.srp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.srp-btn.is-primary {
  background: var(--srp-accent);
  border-color: var(--srp-accent);
  color: var(--srp-accent-ink);
}
.srp-btn.is-primary:hover:not(:disabled) { filter: brightness(0.94); }

/* 状态条 */
.srp-status {
  font-size: 12px;
  line-height: 18px;
  padding: 8px 10px;
  border-radius: var(--dsw-radius-sm, 6px);
  border: 1px solid var(--srp-line);
  background: var(--srp-card);
  color: var(--srp-muted);
}
.srp-status.is-error { color: var(--srp-danger); border-color: currentColor; }

/* 骨架屏：与最终内容同高，避免加载完成后跳动 */
.srp-skeleton {
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-skeleton, #eceae6);
  animation: srp-pulse 1.4s ease-in-out infinite;
}
@keyframes srp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .srp-skeleton { animation: none; }
  .srp-mode, .srp-btn { transition: none; }
}
`

/**
 * 输入区药丸的样式。
 *
 * 必须与面板样式分开：药丸在会话页一亮相就要有形状，而面板样式只在用户
 * 打开右侧栏、面板真正挂载时才注入——两者绑在一起会让药丸先裸奔成原生按钮。
 */
export const CHIP_CSS = `
.sr-chip {
  --src-text: var(--dsw-alias-label-secondary, #6b6b66);
  --src-strong: var(--dsw-alias-label-primary, #1a1a19);
  --src-line: var(--dsw-alias-border-l1, #e5e4e0);
  --src-hover: var(--dsw-alias-interactive-bg-hover, #f0efec);
  --src-accent: var(--dsw-alias-brand-primary, #3f7f6f);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 220px;
  padding: 3px 8px;
  font: var(--dsw-font-xxs-12, 12px/18px -apple-system, sans-serif);
  color: var(--src-text);
  background: transparent;
  border: 1px solid var(--src-line);
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}
/* 输入区窄到放不下时先让标签截断，别把发送按钮挤出去 */
@media (max-width: 720px) {
  .sr-chip { max-width: 148px; }
}
.sr-chip:hover { background: var(--src-hover); }
.sr-chip:focus-visible { outline: 2px solid var(--src-accent); outline-offset: 2px; }
.sr-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; opacity: 0.55; }
.sr-chip.is-override { color: var(--src-strong); border-color: var(--src-accent); }
.sr-chip.is-override .sr-chip-dot { background: var(--src-accent); opacity: 1; }
.sr-chip-label { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.sr-chip-arrow { flex: none; opacity: 0.65; }
`
