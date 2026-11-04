/**
 * 控制台面板与输入区浮层的样式。
 *
 * 全部走宿主语义令牌：面板底色取会话区底色，卡面取 layer-1，
 * 强调色只用品牌色一处，避免右侧栏与输入区浮层出现自造配色体系。
 * 遵循 6-3-1 配色原则，杜绝蓝紫渐变与纯黑 (#000000)。
 * 未定义的令牌一律带浅/深双套合理兜底，缺失时也不会掉成透明。
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
  /*
   * 角标专用深色：10px 小字在 14% 强调色底上对比度只有 3.66:1，
   * 达不到 AA 的 4.5:1。单列一个更深的前景色，别为了一个小角标改全局强调色。
   */
  --srp-accent-strong: var(--dsw-alias-brand-primary-strong, #2c5c50);
  --srp-accent-ink: var(--dsw-alias-label-primary-inverted, #ffffff);
  --srp-danger: var(--dsw-alias-state-error-primary, #b4453a);
  --srp-warn: var(--dsw-alias-state-warn-primary, #9a6b12);
  /* 浮起表面的底色；单列成变量，好让深色兜底只改一处 */
  --srp-surface: var(--dsw-alias-bg-base, #ffffff);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-width: 0;
  height: 100%;
  /* 面板本身不滚动：滚动交给中段的 .srp-scroll，底部操作条才能始终留在原位 */
  overflow: hidden;
  color: var(--srp-text);
  font: var(--dsw-font-xs-13, 13px/20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}
.sr-panel *, .sr-panel *::before, .sr-panel *::after { box-sizing: border-box; }

/*
 * 深色主题兜底。
 *
 * 正常情况下所有取值都来自宿主的 --dsw-alias-* 令牌，会自动跟随主题；
 * 但令牌缺失时（宿主版本差异、隔离预览）回退值是浅色的，深色主题下会亮成一块白板。
 * 这里按既有设置页同样的约定补一套深色回退，保证缺令牌时也不会刺眼。
 */
[data-ds-dark-theme] .sr-panel,
[data-ds-dark-theme] .sr-popover-anchor {
  --srp-text: var(--dsw-alias-label-primary, #f2f1ee);
  --srp-muted: var(--dsw-alias-label-secondary, #a8a7a2);
  --srp-faint: var(--dsw-alias-label-secondary, #a8a7a2);
  --srp-line: var(--dsw-alias-border-l1, #35342f);
  --srp-line-strong: var(--dsw-alias-border-l2, #4a4842);
  --srp-card: var(--dsw-alias-bg-layer-1, #232320);
  --srp-card-hover: var(--dsw-alias-bg-layer-2, #2c2c28);
  --srp-accent: var(--dsw-alias-brand-primary, #6fae9c);
  --srp-accent-strong: var(--dsw-alias-brand-primary-strong, #9ed4c4);
  --srp-accent-ink: var(--dsw-alias-label-primary-inverted, #14140f);
  --srp-danger: var(--dsw-alias-state-error-primary, #e08a7f);
  --srp-warn: var(--dsw-alias-state-warn-primary, #d6a94a);
  --srp-surface: var(--dsw-alias-bg-base, #1b1b18);
}

/*
 * 中段滚动容器：独占剩余高度并在内部滚动。
 * min-height: 0 是关键——flex 子项默认 min-height:auto 会撑破父级，导致它根本不滚动。
 */
.srp-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 浮层模式修饰：高度自适应、受视口约束并允许内部滚动 */

/* 标题区：支持横排与可选关闭按钮 */
.srp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.srp-head-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.srp-title {
  margin: 0;
  font: var(--dsw-font-s-strong-14, 600 14px/20px -apple-system, sans-serif);
  color: var(--srp-text);
}
.srp-sub {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-muted);
}

/* 浮层关闭按钮 */
.srp-close-btn {
  appearance: none;
  background: transparent;
  border: none;
  border-radius: var(--dsw-radius-sm, 6px);
  /* 32px 热区：24px 处于 WCAG 2.5.8 的下限，鼠标快速划过时容易点空或误触外部关闭 */
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: var(--srp-muted);
  cursor: pointer;
  flex: none;
  padding: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.srp-close-btn:hover {
  background: var(--srp-card-hover);
  color: var(--srp-text);
}
.srp-close-btn:focus-visible {
  outline: 2px solid var(--srp-accent);
  outline-offset: 1px;
}

/* 响应式两栏容器（宽屏两栏、窄屏堆叠） */
.srp-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}
.srp-col-summary {
  flex: 1 1 240px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.srp-col-controls {
  flex: 1.4 1 300px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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

/* 三态模式选择 */
.srp-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/*
 * 420px 附近三个按钮并排时每个只剩约 114px，副文本「全局：按项目规则路由」
 * 会被挤到贴边。这个宽度以下改成单列，让说明文字有正常行宽。
 */
@media (max-width: 440px) {
  .srp-modes { flex-direction: column; }
  .srp-mode { flex: 1 1 auto; min-height: 0; }
}
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
  flex: 1 1 100px;
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
.srp-mode-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.srp-mode-desc { font-size: 11px; line-height: 15px; color: var(--srp-muted); overflow: hidden; text-overflow: ellipsis; }

/* 字段与下拉 */
/* 侧栏最窄约 300px、浮层窄屏也相近：三列会把每个下拉挤到 70px 左右，因此强制纵向堆叠 */
.srp-grid { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.srp-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.srp-field-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
.srp-label { font-size: 11px; line-height: 16px; color: var(--srp-muted); }
.srp-select, .srp-input {
  width: 100%;
  min-width: 0;
  /* 显式等高：select 与手动输入的 input 原生行高不同，靠 padding 推算会差 1~2px */
  height: 32px;
  font: inherit;
  font-size: 12px;
  padding: 0 8px;
  color: var(--srp-text);
  background: var(--srp-surface, var(--dsw-alias-bg-base, #ffffff));
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

/*
 * 底部操作条：三段式布局的固定第三段。
 * 它不参与滚动，因此内容再高也不会被压住；同时只有内容真的超出时才占用高度，
 * 正常状态下不会在底部留下空白。
 */
.srp-footer {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 -16px -16px;
  padding: 10px 16px;
  background: var(--srp-surface, var(--dsw-alias-bg-base, #ffffff));
  border-top: 1px solid var(--srp-line);
}

/* 操作按钮组 */
.srp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
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

/* 状态反馈条 */
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

/* 骨架屏 */
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
 * 输入区就地浮层容器的样式。
 *
 * 挂载在 conversation.input.overlay 槽位内。
 * 宿主该槽位锚点在 composer card 内：position:absolute; inset:0 0 auto; height:0。
 * 按照 DSH 官方命令弹窗标准规格：
 * position: absolute; bottom: calc(100% + 4px); left: 0; right: 0; z-index: 100;
 * box-shadow: var(--dsw-elevation-prominent); border-radius: var(--dsw-radius-md)。
 */
/*
 * 浮层容器：portal 挂到 body，用 fixed 定位 + 组件算出的 left/top。
 *
 * 不能用绝对定位挂在 composer 的 overlay 锚点上：那个锚点高 0 且在卡片内，
 * 真实宿主里会把浮层压扁（曾只剩 181px）。fixed + portal 完全避开这层约束。
 */
export const POPOVER_CSS = `
.sr-popover-portal {
  position: fixed;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  /* 宽度由组件按 composer 卡片实测写入，这里只兜底 */
  min-width: 280px;
  max-width: calc(100vw - 24px);
  box-shadow: var(--dsw-elevation-prominent, 0 8px 24px rgba(0, 0, 0, 0.12));
  border-radius: var(--dsw-radius-md, 8px);
  border: 1px solid var(--srp-line, var(--dsw-alias-border-l1, #e5e4e0));
  /*
   * 容器底色必须跟着面板一起变深：panel 的深色令牌只作用于 .srpop 自身，
   * 容器若固定浅色回退值，深色下会把面板衬成一块白板。
   */
  background: var(--dsw-alias-bg-layer-2, #f7f6f3);
  overflow: hidden;
}
[data-ds-dark-theme] .sr-popover-portal {
  border-color: var(--dsw-alias-border-l1, #35342f);
  background: var(--dsw-alias-bg-layer-2, #232320);
}
/*
 * 浮层里的面板要撑满容器，并由容器的 max-height 决定滚动高度。
 * min-height: 0 是必须的：flex 子项默认 min-height:auto 会按内容撑开，
 * 让外层 max-height 失效，面板于是超出可用空间压住输入框。
 */
.sr-popover-portal > .srpop {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
`

/**
 * 输入区药丸的样式。
 */
export const CHIP_CSS = `
/*
 * 药丸的深色兜底：药丸单独成样式表（它比面板更早出现），
 * 因此深色覆盖也要在这里写一遍，否则缺令牌时深色下会出现浅色白边。
 */
[data-ds-dark-theme] .sr-chip {
  --src-text: var(--dsw-alias-label-secondary, #a8a7a2);
  --src-strong: var(--dsw-alias-label-primary, #f2f1ee);
  --src-line: var(--dsw-alias-border-l1, #35342f);
  --src-hover: var(--dsw-alias-interactive-bg-hover, #2c2c28);
  --src-accent: var(--dsw-alias-brand-primary, #6fae9c);
}
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

/**
 * 浮层专用面板样式。
 *
 * 与侧栏控制台分开维护：浮层空间紧张，需要更紧凑的节奏与「点即生效」的列表形态；
 * 侧栏则以表单为主。两者共用同一份语义令牌体系，避免出现两种视觉语言。
 * 配色遵循 6-3-1：底色 layer-2 占主导，卡片/分组 30%，强调色只用于选中态与主按钮。
 */
export const POPOVER_PANEL_CSS = `
.srpop {
  --srp-text: var(--dsw-alias-label-primary, #1a1a19);
  --srp-muted: var(--dsw-alias-label-secondary, #575752);
  --srp-line: var(--dsw-alias-border-l1, #e5e4e0);
  --srp-line-strong: var(--dsw-alias-border-l2, #d3d2cd);
  --srp-surface: var(--dsw-alias-bg-layer-2, #f7f6f3);
  --srp-card: var(--dsw-alias-bg-layer-1, #eeede9);
  --srp-hover: var(--dsw-alias-interactive-bg-hover, #e8e7e2);
  --srp-accent: var(--dsw-alias-brand-primary, #2c5c50);
  --srp-accent-strong: var(--dsw-alias-brand-primary-strong, #2c5c50);
  --srp-accent-ink: var(--dsw-alias-label-primary-inverted, #ffffff);
  --srp-accent-bg: color-mix(in srgb, var(--srp-accent) 10%, transparent);
  --srp-danger: var(--dsw-alias-state-error-primary, #b4453a);
  --srp-warn: var(--dsw-alias-state-warn-primary, #9a6b12);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  min-width: 0;
  overflow: hidden;
  color: var(--srp-text);
  background: var(--srp-surface);
  border-radius: inherit;
  font: 13px/20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.srpop *, .srpop *::before, .srpop *::after { box-sizing: border-box; }

[data-ds-dark-theme] .srpop {
  --srp-text: var(--dsw-alias-label-primary, #f2f1ee);
  --srp-muted: var(--dsw-alias-label-secondary, #a8a7a2);
  --srp-line: var(--dsw-alias-border-l1, #35342f);
  --srp-line-strong: var(--dsw-alias-border-l2, #4a4842);
  --srp-surface: var(--dsw-alias-bg-layer-2, #232320);
  --srp-card: var(--dsw-alias-bg-layer-1, #2c2c28);
  --srp-hover: var(--dsw-alias-interactive-bg-hover, #353530);
  --srp-accent: var(--dsw-alias-brand-primary, #9ed4c4);
  --srp-accent-strong: var(--dsw-alias-brand-primary-strong, #9ed4c4);
  --srp-accent-ink: var(--dsw-alias-label-primary-inverted, #14140f);
  --srp-accent-bg: color-mix(in srgb, var(--srp-accent) 16%, transparent);
  --srp-danger: var(--dsw-alias-state-error-primary, #e08a7f);
  --srp-warn: var(--dsw-alias-state-warn-primary, #d6a94a);
}

/* 顶部栏：14px/600/20px 标题 + 关闭与返回按钮 */
.srpop-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid var(--srp-line);
}
.srpop-head-start {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.srpop-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--srp-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.srpop-back {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--srp-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  padding: 6px 8px;
  min-height: 32px;
  margin-left: -6px;
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color .15s ease, color .15s ease;
}
.srpop-back:hover:not(:disabled) { background: var(--srp-hover); color: var(--srp-text); }
.srpop-back:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-back:disabled { opacity: .5; cursor: not-allowed; }

.srpop-close {
  flex: none;
  appearance: none;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: var(--srp-muted);
  background: transparent;
  border: none;
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease;
}
.srpop-close:hover { background: var(--srp-hover); color: var(--srp-text); }
.srpop-close:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }

/* 主体：单列纵向滚动流 */
.srpop-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 首页：当前生效状态卡片 */
.srpop-current {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--srp-card);
  border: 1px solid var(--srp-line);
}
.srpop-current-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.srpop-current-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: var(--srp-muted);
}
.srpop-current-badge {
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 999px;
  color: var(--srp-accent-strong);
  background: var(--srp-accent-bg);
  border: 1px solid color-mix(in srgb, var(--srp-accent) 25%, transparent);
}
.srpop-current-val {
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: var(--srp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srpop-current-sub {
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-muted);
  overflow-wrap: anywhere;
}

/* 首页选项列表：单列纵向 */
.srpop-modes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.srpop-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 52px;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--srp-line);
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--srp-card);
  color: var(--srp-text);
  cursor: pointer;
  font: inherit;
  transition: border-color .15s ease, background-color .15s ease;
}
.srpop-mode:hover:not(:disabled) {
  background: var(--srp-hover);
  border-color: var(--srp-line-strong);
}
.srpop-mode[aria-pressed='true'] {
  border-color: var(--srp-accent);
  background: var(--srp-accent-bg);
  box-shadow: inset 0 0 0 1px var(--srp-accent);
}
.srpop-mode:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-mode:disabled { opacity: .5; cursor: not-allowed; }

.srpop-mode-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.srpop-mode-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--srp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srpop-mode-desc {
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srpop-mode-tail {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.srpop-check {
  color: var(--srp-accent);
  font-size: 13px;
  font-weight: 600;
}
.srpop-arrow {
  color: var(--srp-muted);
  font-size: 14px;
  line-height: 1;
}

/* 搜索框 */
.srpop-search-bar {
  display: flex;
  align-items: center;
  width: 100%;
}
.srpop-input {
  width: 100%;
  min-width: 0;
  height: 32px;
  min-height: 32px;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 0 10px;
  color: var(--srp-text);
  background: var(--srp-surface);
  border: 1px solid var(--srp-line-strong);
  border-radius: var(--dsw-radius-sm, 6px);
  transition: border-color .15s ease;
}
.srpop-input::placeholder { color: var(--srp-muted); }
.srpop-input:focus-visible {
  outline: 2px solid var(--srp-accent);
  outline-offset: -1px;
  border-color: var(--srp-accent);
}
.srpop-input:disabled { opacity: .55; cursor: not-allowed; }

/* 思考档位调节 */
.srpop-efforts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  background: var(--srp-card);
  border: 1px solid var(--srp-line);
  border-radius: var(--dsw-radius-sm, 6px);
}
.srpop-efforts-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: var(--srp-muted);
  margin-right: 4px;
  flex: none;
}
.srpop-effort {
  appearance: none;
  border: 1px solid var(--srp-line-strong);
  background: var(--srp-surface);
  color: var(--srp-text);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  padding: 4px 10px;
  min-height: 32px;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color .12s ease, border-color .12s ease;
}
.srpop-effort:hover:not(:disabled) { background: var(--srp-hover); }
.srpop-effort[aria-pressed='true'] {
  background: var(--srp-accent);
  border-color: var(--srp-accent);
  color: var(--srp-accent-ink);
  font-weight: 500;
}
.srpop-effort:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-effort:disabled { opacity: .5; cursor: not-allowed; }

/* 垂直供应商分组与模型单列列表 */
.srpop-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.srpop-group-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.srpop-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  color: var(--srp-muted);
}
.srpop-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--srp-accent);
  opacity: .85;
}
.srpop-group-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.srpop-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 34px;
  padding: 6px 10px;
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  text-align: left;
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  transition: background-color .12s ease, border-color .12s ease;
}
.srpop-item:hover:not(:disabled) {
  background: var(--srp-hover);
  border-color: var(--srp-line);
}
.srpop-item[data-active='true'] {
  background: var(--srp-accent-bg);
  border-color: var(--srp-accent);
  font-weight: 600;
}
.srpop-item:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-item:disabled { opacity: .5; cursor: not-allowed; }
.srpop-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srpop-badge {
  flex: none;
  min-width: 18px;
  padding: 0 5px;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  border-radius: 999px;
  color: var(--srp-accent-strong);
  background: color-mix(in srgb, var(--srp-accent) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--srp-accent) 30%, transparent);
}

/* 目录外手动模型当前选中态展示 */
.srpop-manual-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  min-height: 34px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--srp-accent-bg);
  border: 1px solid var(--srp-accent);
}

/* 手动输入模型入口与表单 */
.srpop-link {
  align-self: flex-start;
  appearance: none;
  border: none;
  background: transparent;
  color: var(--srp-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  padding: 6px 8px;
  min-height: 32px;
  cursor: pointer;
  border-radius: var(--dsw-radius-sm, 6px);
  transition: color .15s ease, background-color .15s ease;
}
.srpop-link:hover:not(:disabled) {
  color: var(--srp-text);
  background: var(--srp-hover);
}
.srpop-link:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-link:disabled { opacity: .5; cursor: not-allowed; }

.srpop-manual {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--srp-line);
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--srp-card);
}
.srpop-manual-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.srpop-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: var(--srp-muted);
}
.srpop-manual-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}
.srpop-primary {
  appearance: none;
  border: 1px solid var(--srp-accent);
  background: var(--srp-accent);
  color: var(--srp-accent-ink);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  padding: 5px 14px;
  min-height: 32px;
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  transition: filter .15s ease;
}
.srpop-primary:hover:not(:disabled) { filter: brightness(0.92); }
.srpop-primary:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-primary:disabled { opacity: .5; cursor: not-allowed; }

.srpop-ghost {
  appearance: none;
  border: 1px solid var(--srp-line-strong);
  background: transparent;
  color: var(--srp-text);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  padding: 5px 12px;
  min-height: 32px;
  border-radius: var(--dsw-radius-sm, 6px);
  cursor: pointer;
  transition: background-color .15s ease;
}
.srpop-ghost:hover:not(:disabled) { background: var(--srp-hover); }
.srpop-ghost:focus-visible { outline: 2px solid var(--srp-accent); outline-offset: 1px; }
.srpop-ghost:disabled { opacity: .5; cursor: not-allowed; }

.srpop-hint {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-muted);
  overflow-wrap: anywhere;
}
.srpop-empty {
  margin: 0;
  padding: 12px 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-muted);
  text-align: center;
}
.srpop-error {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-danger);
  border: 1px solid color-mix(in srgb, var(--srp-danger) 32%, transparent);
  background: color-mix(in srgb, var(--srp-danger) 8%, transparent);
  border-radius: var(--dsw-radius-sm, 6px);
  overflow-wrap: anywhere;
}
.srpop-notice {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--srp-text);
  border: 1px solid var(--srp-line);
  background: var(--srp-card);
  border-radius: var(--dsw-radius-sm, 6px);
  overflow-wrap: anywhere;
}
.srpop-skeleton {
  border-radius: var(--dsw-radius-sm, 6px);
  background: var(--dsw-alias-bg-skeleton, #eceae6);
  animation: srpop-pulse 1.4s ease-in-out infinite;
}
@keyframes srpop-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }
@media (prefers-reduced-motion: reduce) {
  .srpop-skeleton { animation: none; }
  .srpop-mode, .srpop-item, .srpop-effort, .srpop-close, .srpop-back, .srpop-primary, .srpop-ghost { transition: none; }
}
`
