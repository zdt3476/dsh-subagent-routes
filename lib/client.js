/**
* @zdt3476/dsh-subagent-routes v0.1.0
* 按工作区目录给子智能体指定 provider/模型/思考等级的路由表：最长前缀匹配后注入子代理 AgentOptions。
* @license MIT
*/
window.__ModuleLoader__.load({id:`@zdt3476/dsh-subagent-routes`,factory:e=>{var t={exports:{}},n=t.exports;Object.defineProperty(n,Symbol.toStringTag,{value:`Module`});var r=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports);let i=e("react"),a=`@zdt3476/dsh-subagent-routes`,o=`subagent-routes`,s=`/api/subagent-routes/settings`,c=`/api/subagent-routes/session`,l=`
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
`,u=`
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
`;function d(e,t){return JSON.stringify([e,t])}function f(e){try{let t=JSON.parse(e);return!Array.isArray(t)||t.length!==2||t.some(e=>typeof e!=`string`)?void 0:{provider:t[0],model:t[1]}}catch{return}}function p(e,t){if(e&&t!==``)for(let n of e){let e=n.models.find(e=>e.id===t);if(e!==void 0)return{group:n,entry:e}}}function m(e,t){if(t===void 0)return e;let n=t.reasoning?.efforts;return!n||n.length===0?``:e!==``&&n.some(t=>t.id===e)?e:t.reasoning?.defaultEffort??``}let h={provider:`Provider（提供商）`,model:`模型名称 (Model)`,effort:`思考等级 (Reasoning Effort)`,manual:`手动输入`,fromList:`从列表选择`,inheritProvider:`（继承主代理提供商）`,inheritModel:`（继承主代理模型）`,pickProvider:`（请选择提供商）`,pickModel:`（请选择模型）`,customProvider:`例如 openai / anthropic / deepseek`,customModel:`例如 gpt-4.1 / claude-sonnet-4`,modelUnsupported:`该模型不支持思考等级`,modelUnsupportedHint:`所选模型无深度思考/推理模式，已自动禁用`,effortInherit:`继承或模型默认`,effortLinked:`已智能联动该模型支持的专属思考档位`,effortGeneric:`通用思考等级档位`,noReasoning:`当前模型不支持思考等级`},g=[{value:``,label:`继承或模型默认`},{value:`low`,label:`低 (low) - 快速响应`},{value:`medium`,label:`中 (medium) - 平衡`},{value:`high`,label:`高 (high) - 深度推理`},{value:`max`,label:`最大 (max) - 极限思考`}];function _({provider:e,model:t,reasoningEffort:n,catalog:r,disabled:a=!1,allowInherit:o=!1,classes:s,labels:c,allowManual:l=!0,onChange:u}){let _={...h,...c},v=Array.isArray(r)&&r.length>0,y=v?r.find(t=>t.id===e):void 0,b=p(r,t),x=y?.models??[],S=y?x.find(e=>e.id===t):b?.entry,[C,w]=(0,i.useState)(!v||!!e&&!y),[T,E]=(0,i.useState)(!v||!!t&&!b),D=S?.reasoning,O=!(!S||D&&D.efforts&&D.efforts.length!==0),k=!!D?.efforts?.length,A=e=>{if(e===`__custom__`){w(!0);return}w(!1);let i=r?.find(t=>t.id===e)?.models??[],a=i.some(e=>e.id===t)?t:i[0]?.id??``;u({provider:e,model:a,reasoningEffort:m(n,i.find(e=>e.id===a))})},j=t=>{if(t===`__custom__`){E(!0);return}if(E(!1),t===``){u({provider:e,model:``,reasoningEffort:n});return}let i=f(t);if(i===void 0)return;let a=r?.find(e=>e.id===i.provider)?.models.find(e=>e.id===i.model);u({provider:i.provider,model:i.model,reasoningEffort:m(n,a)})},M=`sr-provider-${(0,i.useId)().replace(/:/g,``)}`,N=`sr-model-${(0,i.useId)().replace(/:/g,``)}`,P=`sr-effort-${(0,i.useId)().replace(/:/g,``)}`,F=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:M},_.provider),v&&l?(0,i.createElement)(`button`,{type:`button`,className:s.link,disabled:a,onClick:()=>{let e=!C;w(e),e&&E(!0)}},C?_.fromList:_.manual):null),C||!v?(0,i.createElement)(`input`,{type:`text`,id:M,className:s.input,placeholder:_.customProvider,value:e,disabled:a,onChange:e=>u({provider:e.target.value.trim(),model:t,reasoningEffort:n})}):(0,i.createElement)(`select`,{id:M,className:s.select,value:y?e:``,disabled:a,onChange:e=>A(e.target.value)},(0,i.createElement)(`option`,{value:``},o?_.inheritProvider:_.pickProvider),r.map(e=>(0,i.createElement)(`option`,{key:e.id,value:e.id},`${e.name||e.id} (${e.id})`)),l?(0,i.createElement)(`option`,{value:`__custom__`},`+ ${_.manual}…`):null)),I=(y?[y]:r??[]).filter(e=>e.models.length>0).map(e=>(0,i.createElement)(`optgroup`,{key:e.id,label:e.name||e.id},e.models.map(t=>(0,i.createElement)(`option`,{key:d(e.id,t.id),value:d(e.id,t.id)},t.name&&t.name!==t.id?`${t.name} (${t.id})`:t.id)))),L=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:N},_.model),v&&l?(0,i.createElement)(`button`,{type:`button`,className:s.link,disabled:a,onClick:()=>E(e=>!e)},T?_.fromList:_.manual):null),T||!v?(0,i.createElement)(`input`,{type:`text`,id:N,className:s.input,placeholder:_.customModel,value:t,disabled:a,onChange:t=>u({provider:e,model:t.target.value.trim(),reasoningEffort:n})}):(0,i.createElement)(`select`,{id:N,className:s.select,value:t&&(S!==void 0||b!==void 0)?d(e||b?.group.id||``,t):``,disabled:a,onChange:e=>j(e.target.value)},(0,i.createElement)(`option`,{value:``},o?_.inheritModel:_.pickModel),I,l?(0,i.createElement)(`option`,{value:`__custom__`},`+ ${_.manual}…`):null)),R,z=``;O?(R=(0,i.createElement)(`select`,{id:P,className:s.select,value:``,disabled:!0,title:_.noReasoning},(0,i.createElement)(`option`,{value:``},_.modelUnsupported)),z=_.modelUnsupportedHint):k&&D?(R=(0,i.createElement)(`select`,{id:P,className:s.select,value:n,disabled:a,onChange:n=>u({provider:e,model:t,reasoningEffort:n.target.value})},(0,i.createElement)(`option`,{value:``},`${_.effortInherit}${D.defaultEffort?` (${D.defaultEffort})`:``}`),D.efforts.map(e=>(0,i.createElement)(`option`,{key:e.id,value:e.id},`${e.name||e.id} (${e.id})${e.description?` - ${e.description}`:``}`))),z=_.effortLinked):(R=(0,i.createElement)(`select`,{id:P,className:s.select,value:n,disabled:a,onChange:n=>u({provider:e,model:t,reasoningEffort:n.target.value})},g.map(e=>(0,i.createElement)(`option`,{key:e.value,value:e.value},e.label))),z=_.effortGeneric);let B=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:P},_.effort)),R,z?(0,i.createElement)(`span`,{className:s.hint},z):null);return(0,i.createElement)(`div`,{className:s.grid},F,L,B)}let v={caller:{label:`本次调用指定`,hint:`派活方在工具参数里点名了模型，插件的配置没有介入。`},session:{label:`本会话指定`,hint:`你在本会话里临时指定的配置，优先于项目规则。`},workspace:{label:`项目规则`,hint:`命中了当前目录的项目路由规则。`},fallback:{label:`全局兜底`,hint:`没有命中任何项目规则，使用全局默认配置。`},inherit:{label:`继承主代理`,hint:`没有任何配置介入，子代理直接继承主代理的模型。`}};function y(e){return e?.reasoningEffort===void 0?void 0:`思考等级 ${e.reasoningEffort}`}function b(e){return e?.reasoningEffort}function x(e){if(e===void 0)return`继承主代理`;let t=e.provider===void 0||e.model===void 0?void 0:`${e.provider} / ${e.model}`;if(t===void 0)return y(e)??`继承主代理`;let n=b(e);return n===void 0?t:`${t} · ${n}`}function S(e){if(e===null)return{label:`继承主代理`,source:`inherit`,sourceLabel:v.inherit.label,isOverride:!1};let t=e.effective?.spec,n=e.effective?.source??`inherit`;return{label:x(t),source:n,sourceLabel:v[n]?.label??n,isOverride:e.session!==void 0}}function C(e,t,n){let r=0,i=0,a;return{load:async(o={})=>{let s=o.silent===!0,c=r,l=++i;a?.abort();let u=new AbortController;a=u;try{let a=await e.load(t,u.signal);c===r&&l===i&&n().onSnapshot(a)}catch(e){if(u.signal.aborted||c!==r||l!==i)return;s||n().onError(e instanceof Error?e.message:String(e))}finally{c===r&&!s&&n().onSettled()}},invalidate:()=>(r+=1,a?.abort(),a=void 0,r),isCurrent:e=>e===r,subscribe:t=>{let n=e.subscribe?.(t);return()=>{n?.()}}}}let w=new Set;function T(){for(let e of w)e()}async function E(e,t){let n=await fetch(e,{credentials:`same-origin`,cache:`no-store`,...t}),r;try{r=await n.json()}catch{throw Error(`宿主接口不可用（HTTP ${n.status}），请重载插件后重试`)}if(!n.ok){let e=r?.error;throw Error(typeof e==`string`?e:`请求失败（HTTP ${n.status}）`)}return r}function D(e){return{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}}let O={load:e=>E(s,{signal:e}),saveTable:async e=>{let t=await E(s,D({kind:`table`,...e}));return T(),t},saveConfig:async(e,t)=>{await E(s,D({kind:`config`,config:e,revision:t})),T()}},k={load:(e,t)=>E(`${c}?sessionId=${encodeURIComponent(e)}`,{signal:t}),save:async(e,t)=>{let n={action:`save`,sessionId:e,mode:t.mode,...t.override===void 0?{}:{override:t.override}},r=await E(c,D(n));return T(),r},freeze:async e=>{let t=await E(c,D({action:`freeze`,sessionId:e}));return T(),t},subscribe:e=>(w.add(e),()=>{w.delete(e)})},A={grid:`srp-grid`,field:`srp-field`,fieldHead:`srp-field-head`,label:`srp-label`,link:`srp-btn`,input:`srp-input`,select:`srp-select`,hint:`srp-hint`};function j({sessionId:e,api:t=k}){let[n,r]=(0,i.useState)(null),[a,o]=(0,i.useState)(`follow`),[s,c]=(0,i.useState)({provider:``,model:``,reasoningEffort:``}),[u,d]=(0,i.useState)(`load`),f=(0,i.useRef)(null),[p,m]=(0,i.useState)(``),[h,g]=(0,i.useState)(``),y=(0,i.useRef)(0),b=(0,i.useCallback)(e=>{r(e),o(e.mode);let t=e.session?.mode===`custom`?e.session:void 0;c({provider:t?.provider??``,model:t?.model??``,reasoningEffort:t?.reasoningEffort??``})},[]),S=(0,i.useRef)(null),w=(0,i.useCallback)(async e=>{e?.silent===!0?await S.current?.load({silent:!0}):(d(`load`),m(``),await S.current?.load())},[]);(0,i.useEffect)(()=>{let n=C(t,e,()=>({onSnapshot:b,onError:e=>m(e),onSettled:()=>d(null)}));S.current=n,r(null),m(``),g(``),n.load();let i=n.subscribe(()=>{n.load({silent:!0})});return()=>{i(),n.invalidate(),y.current+=1,S.current=null}},[t,b,e]);let T=n?.enabled===!1,E=e=>{requestAnimationFrame(()=>{f.current?.querySelector(e)?.scrollIntoView({block:`nearest`,behavior:`smooth`})})},D=e=>{if(o(e),g(``),m(``),e!==`custom`)return;E(`.srp-field:last-of-type`);let t=n?.effective?.spec??n?.workspace?.spec;c(e=>e.provider!==``||e.model!==``?e:{provider:t?.provider??``,model:t?.model??``,reasoningEffort:t?.reasoningEffort??``})},O=async()=>{let n=++y.current;d(`save`),m(``),g(``);try{let r=null;if(a===`custom`){let e=s.provider.trim(),t=s.model.trim(),n=s.reasoningEffort.trim();if(e===``||t===``){m(`请选择完整的提供商与模型；只指定思考等级会覆盖项目规则里的模型`);return}r={provider:e,model:t,...n===``?{}:{reasoningEffort:n}}}let i=await t.save(e,{mode:a,override:r});if(n!==y.current)return;b(i),g(a===`follow`?`已恢复跟随全局策略`:a===`inherit`?`已设置为强制继承主代理模型`:`已生效：下一次派活开始使用新配置`)}catch(e){n===y.current&&(m(e instanceof Error?e.message:String(e)),E(`.srp-status.is-error`))}finally{n===y.current&&d(null)}},j=async()=>{let n=++y.current;d(`freeze`),m(``),g(``);try{let r=await t.freeze(e);if(n!==y.current)return;b(r),g(`已写入项目规则，并清除了本会话的临时指定`)}catch(e){n===y.current&&m(e instanceof Error?e.message:String(e))}finally{n===y.current&&d(null)}};if(n===null)return(0,i.createElement)(`div`,{className:`sr-panel`,"aria-busy":p===``},(0,i.createElement)(`style`,null,l),(0,i.createElement)(`div`,{className:`srp-head`},(0,i.createElement)(`div`,{className:`srp-head-text`},(0,i.createElement)(`h2`,{className:`srp-title`},`子代理模型`),(0,i.createElement)(`p`,{className:`srp-sub`},`控制本会话新派出的子代理。`))),(0,i.createElement)(`div`,{className:`srp-scroll`},p===``?[(0,i.createElement)(`div`,{key:`a`,className:`srp-skeleton`,style:{height:84}}),(0,i.createElement)(`div`,{key:`b`,className:`srp-skeleton`,style:{height:180}})]:[(0,i.createElement)(`p`,{key:`err`,className:`srp-status is-error`,role:`alert`},p),(0,i.createElement)(`div`,{key:`retry`,className:`srp-actions`},(0,i.createElement)(`button`,{type:`button`,className:`srp-btn is-primary`,onClick:()=>void w()},`重试`))]));let M=n.effective,N=M===void 0?v.inherit:v[M.source]??v.inherit,P=n.session!==void 0,F=u!==null||T,I=n.session?.mode===`custom`,L=(0,i.createElement)(`div`,{className:`srp-now${P?` is-session`:``}`},(0,i.createElement)(`div`,{className:`srp-now-top`},(0,i.createElement)(`span`,{className:`srp-now-label`},`当前生效`),(0,i.createElement)(`span`,{className:`srp-now-value`,title:x(M?.spec)},x(M?.spec)),(0,i.createElement)(`span`,{className:`srp-now-badge`},N.label)),(0,i.createElement)(`p`,{className:`srp-now-meta`,style:{margin:0}},M?.workspacePath===void 0?N.hint:`命中规则目录 ${M.workspacePath}。${N.hint}`),n.directory===void 0?(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`未能读取会话所在目录，项目规则无法匹配。`):(0,i.createElement)(`p`,{className:`srp-now-meta`,style:{margin:0}},`工作目录 ${n.directory}`),T?(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`插件当前已暂停，任何配置都不会生效。请在设置页重新启用。`):null,n.tableAvailable?null:(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`路由表当前无法解析，项目规则暂不可用；本会话的临时指定仍然有效。`)),R=n.defaultPolicy===`inherit`?`全局：继承主代理模型`:`全局：按项目规则路由`,z=u===`save`?`保存中…`:a===`follow`?`跟随全局策略`:a===`inherit`?`应用继承`:`应用到此会话`,B=(0,i.createElement)(`div`,{className:`srp-card`},(0,i.createElement)(`div`,{className:`srp-card-head`},(0,i.createElement)(`h3`,{className:`srp-card-title`},`本会话配置`)),(0,i.createElement)(`div`,{className:`srp-modes`,role:`group`,"aria-label":`子代理配置来源`},(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`follow`,disabled:F,onClick:()=>D(`follow`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`跟随全局策略`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:R},R)),(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`inherit`,disabled:F,onClick:()=>D(`inherit`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`继承主代理`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:`强制继承主模型`},`只影响本会话`)),(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`custom`,disabled:F,onClick:()=>D(`custom`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`指定一套`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:`指定专属模型`},`只影响本会话`))),a===`custom`?(0,i.createElement)(_,{provider:s.provider,model:s.model,reasoningEffort:s.reasoningEffort,catalog:n.catalog,disabled:F,allowInherit:!0,allowManual:!1,classes:A,labels:{manual:`手动输入`},onChange:e=>{c(e),g(``),m(``)}}):a===`inherit`?(0,i.createElement)(`p`,{className:`srp-hint`,style:{margin:0}},`已选强制继承：子代理将无条件直接复用主代理的模型与思考等级。`):(0,i.createElement)(`p`,{className:`srp-hint`,style:{margin:0}},n.workspace===void 0?n.defaultPolicy===`inherit`?`全局策略为继承主代理，当前没有指定本会话配置。`:`当前目录未命中项目规则，子代理将使用全局兜底配置或主模型。`:`命中项目规则：${x(n.workspace.spec)}`)),V=(0,i.createElement)(`div`,{className:`srp-footer`},(0,i.createElement)(`div`,{className:`srp-actions`},(0,i.createElement)(`button`,{type:`button`,className:`srp-btn is-primary`,disabled:F,onClick:()=>void O()},z),(0,i.createElement)(`button`,{type:`button`,className:`srp-btn`,disabled:F||!I,title:I?`把本会话的指定写进项目路由规则`:`当前未自定义指定一套模型，无法固化`,onClick:()=>void j()},u===`freeze`?`固化中…`:`固化为项目规则`),(0,i.createElement)(`button`,{type:`button`,className:`srp-btn`,disabled:u!==null,onClick:()=>void w()},u===`load`?`读取中…`:`刷新`)),p?(0,i.createElement)(`p`,{className:`srp-status is-error`,role:`alert`},p):null,h?(0,i.createElement)(`p`,{className:`srp-status`,role:`status`},h):null);return(0,i.createElement)(`div`,{ref:f,className:`sr-panel`,"aria-busy":u!==null},(0,i.createElement)(`style`,null,l),(0,i.createElement)(`div`,{className:`srp-head`},(0,i.createElement)(`div`,{className:`srp-head-text`},(0,i.createElement)(`h2`,{className:`srp-title`},`子代理模型`),(0,i.createElement)(`p`,{className:`srp-sub`},`控制本会话新派出的子代理。已在运行的子代理保持原配置。`))),(0,i.createElement)(`div`,{className:`srp-scroll`},(0,i.createElement)(`div`,{className:`srp-layout`},(0,i.createElement)(`div`,{className:`srp-col-summary`},L),(0,i.createElement)(`div`,{className:`srp-col-controls`},B))),V)}
/**
* @license React
* react-dom.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var M=r((t=>{var n=e("react");function r(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}var i=Symbol.for(`react.portal`),a=Symbol.for(`react.optimistic_key`);function o(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:i,key:r==null?null:r===a?a:``+r,children:e,containerInfo:t,implementation:n}}n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,t.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(r(299));return o(e,t,null,n)}})),N=r(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=M()}))();function P({sessionId:e,api:t=k,onClose:n}){let[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(`load`),[c,l]=(0,i.useState)(``),[d,f]=(0,i.useState)(``),[p,m]=(0,i.useState)(`home`),[h,g]=(0,i.useState)(``),[_,v]=(0,i.useState)(null),[y,b]=(0,i.useState)(!1),[S,w]=(0,i.useState)(``),[T,E]=(0,i.useState)(``),D=(0,i.useRef)(0),O=(0,i.useRef)(null),A=(0,i.useRef)(null),j=(0,i.useCallback)(e=>{a(e)},[]);(0,i.useEffect)(()=>{let n=C(t,e,()=>({onSnapshot:j,onError:e=>l(e),onSettled:()=>s(null)}));O.current=n,a(null),l(``),f(``),m(`home`),g(``),b(!1),w(``),E(``),n.load();let r=n.subscribe(()=>{n.load({silent:!0})});return()=>{r(),n.invalidate(),D.current+=1,O.current=null,A.current!==null&&clearTimeout(A.current)}},[t,j,e]);let M=(0,i.useCallback)(async(n,r,i,a)=>{if(o!==null)return;let c=++D.current;s(`save`),l(``),f(``);try{let o=await t.save(e,{mode:n,override:r});if(c!==D.current)return;j(o),f(i),a?.(),A.current!==null&&clearTimeout(A.current),A.current=setTimeout(()=>f(``),4e3)}catch(e){c===D.current&&l(e instanceof Error?e.message:String(e))}finally{c===D.current&&(s(null),v(null))}},[j,t,o,e]),N=r?.enabled===!1,P=o!==null||N;if(r===null)return(0,i.createElement)(`div`,{className:`srpop`,"aria-busy":!0},(0,i.createElement)(`style`,null,u),(0,i.createElement)(`div`,{className:`srpop-head`},(0,i.createElement)(`span`,{className:`srpop-title`},`子代理模型`),(0,i.createElement)(`button`,{type:`button`,className:`srpop-close`,"aria-label":`关闭面板`,onClick:n},`×`)),c===``?[(0,i.createElement)(`div`,{key:`a`,className:`srpop-skeleton`,style:{height:44,margin:`12px 14px 4px`}}),(0,i.createElement)(`div`,{key:`b`,className:`srpop-skeleton`,style:{height:140,margin:`8px 14px 14px`}})]:(0,i.createElement)(`div`,{className:`srpop-body`},(0,i.createElement)(`p`,{className:`srpop-error`,role:`alert`},c),(0,i.createElement)(`button`,{type:`button`,className:`srpop-primary`,onClick:()=>{s(`load`),l(``),O.current?.load()}},`重试`)));let F=r.effective,I=r.session,L=(r.catalog??[]).filter(e=>e.models.length>0),R=I?.mode===`custom`,z=I?.mode===`inherit`,B=I===void 0,V=R?I.provider:void 0,H=R?I.model:void 0,U=R?I.reasoningEffort??``:``,W=R&&H!==void 0?L.flatMap(e=>e.models.map(t=>({group:e,model:t}))).find(e=>e.model.id===H&&(V===void 0||e.group.id===V)):void 0,G=W?.model.reasoning?.efforts??[],K=R&&V!==void 0&&H!==void 0&&W===void 0,q=h.trim().toLowerCase(),J=L.map(e=>{let t=e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q),n=e.models.filter(e=>t||e.name.toLowerCase().includes(q)||e.id.toLowerCase().includes(q));return{...e,models:n}}).filter(e=>e.models.length>0),Y=(e,t,n)=>{P||R&&V===e&&H===t||M(`custom`,{provider:e,model:t,...n?{reasoningEffort:n}:{}},`已保存：${e} / ${t}`)},X=e=>{P||V===void 0||H===void 0||(v(e),M(`custom`,{provider:V,model:H,...e===``?{}:{reasoningEffort:e}},e===``?`已恢复模型默认思考档位`:`思考档位已切换至「${e}」`))},Z=()=>{let e=S.trim(),t=T.trim();P||e===``||t===``||M(`custom`,{provider:e,model:t},`已保存手动输入模型 ${e} / ${t}`,()=>{b(!1),w(``),E(``)})};return(0,i.createElement)(`div`,{className:`srpop`,"aria-busy":o!==null},(0,i.createElement)(`style`,null,u),(0,i.createElement)(`div`,{className:`srpop-head`},(0,i.createElement)(`div`,{className:`srpop-head-start`},p===`select`?(0,i.createElement)(`button`,{type:`button`,className:`srpop-back`,"aria-label":`返回上一页`,disabled:o!==null,onClick:()=>{m(`home`),l(``)}},`‹ 返回`):null,(0,i.createElement)(`h3`,{className:`srpop-title`},p===`select`?`选择子代理模型`:`子代理模型`)),(0,i.createElement)(`button`,{type:`button`,className:`srpop-close`,"aria-label":`关闭面板`,onClick:n},`×`)),(0,i.createElement)(`div`,{className:`srpop-body`},p===`home`?(()=>{let e=x(F?.spec);return[(0,i.createElement)(`div`,{key:`current`,className:`srpop-current`},(0,i.createElement)(`div`,{key:`top`,className:`srpop-current-top`},(0,i.createElement)(`span`,{className:`srpop-current-label`},`当前实际生效`),(0,i.createElement)(`span`,{className:`srpop-current-badge`},R?`本会话指定`:z?`继承主代理`:`跟随全局`)),(0,i.createElement)(`div`,{key:`val`,className:`srpop-current-val`,title:e},e),(0,i.createElement)(`div`,{key:`sub`,className:`srpop-current-sub`},N?`插件总开关已关闭，任何配置均未生效。`:R?`本会话显式指定了模型，下一次派活优先使用此配置。`:z?`本会话强制继承主代理模型，不跟随项目路由规则。`:`跟随全局配置；若命中项目目录路由规则将按规则分发。`)),(0,i.createElement)(`div`,{key:`modes`,className:`srpop-modes`,role:`group`,"aria-label":`子代理模型配置方式`},(0,i.createElement)(`button`,{key:`follow`,type:`button`,className:`srpop-mode`,"aria-pressed":B,disabled:P,onClick:()=>{P||B||M(`follow`,null,`已切换为跟随全局策略`)}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`跟随全局策略`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},`清除本会话覆盖，使用项目规则或全局默认`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},B?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)),(0,i.createElement)(`button`,{key:`inherit`,type:`button`,className:`srpop-mode`,"aria-pressed":z,disabled:P,onClick:()=>{P||z||M(`inherit`,null,`已设置为强制继承主代理模型`)}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`继承主代理`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},`子代理直接使用主会话模型，忽略路由规则`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},z?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)),(0,i.createElement)(`button`,{key:`custom`,type:`button`,className:`srpop-mode`,"aria-pressed":R,disabled:P,onClick:()=>{P||(m(`select`),l(``))}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`指定模型…`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},R?`已选：${V??``} / ${H??``}`:`从可用供应商中点选或手动输入`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},R?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null,(0,i.createElement)(`span`,{className:`srpop-arrow`,"aria-hidden":`true`},`›`))))]})():(()=>{let e=R&&G.length>1?(0,i.createElement)(`div`,{className:`srpop-efforts`,role:`group`,"aria-label":`思考档位`},(0,i.createElement)(`span`,{className:`srpop-efforts-label`},`思考档位`),[{id:``,name:`默认`},...G].map(e=>(0,i.createElement)(`button`,{key:e.id===``?`__default__`:e.id,type:`button`,className:`srpop-effort`,"aria-pressed":(_??U)===e.id,disabled:P,onClick:()=>X(e.id)},e.name||e.id))):null,t=y?(0,i.createElement)(`form`,{className:`srpop-manual`,onSubmit:e=>{e.preventDefault(),Z()}},(0,i.createElement)(`div`,{className:`srpop-manual-field`},(0,i.createElement)(`label`,{className:`srpop-label`,htmlFor:`srpop-manual-provider-input`},`提供商 (Provider)`),(0,i.createElement)(`input`,{id:`srpop-manual-provider-input`,className:`srpop-input`,placeholder:`例如 openai 或 anthropic`,value:S,disabled:P,onChange:e=>w(e.target.value)})),(0,i.createElement)(`div`,{className:`srpop-manual-field`},(0,i.createElement)(`label`,{className:`srpop-label`,htmlFor:`srpop-manual-model-input`},`模型标识 (Model)`),(0,i.createElement)(`input`,{id:`srpop-manual-model-input`,className:`srpop-input`,placeholder:`例如 gpt-4o 或 claude-3-5-sonnet`,value:T,disabled:P,onChange:e=>E(e.target.value)})),(0,i.createElement)(`div`,{className:`srpop-manual-actions`},(0,i.createElement)(`button`,{type:`submit`,className:`srpop-primary`,disabled:P||S.trim()===``||T.trim()===``},`保存并应用`),(0,i.createElement)(`button`,{type:`button`,className:`srpop-ghost`,onClick:()=>{b(!1)}},`取消`))):(0,i.createElement)(`button`,{type:`button`,className:`srpop-link`,disabled:P,onClick:()=>b(!0)},`+ 手动输入模型`);return[(0,i.createElement)(`div`,{key:`search`,className:`srpop-search-bar`},(0,i.createElement)(`input`,{className:`srpop-input`,type:`search`,placeholder:`搜索提供商或模型名称…`,"aria-label":`搜索模型`,value:h,disabled:P,onChange:e=>g(e.target.value)})),e,K?(0,i.createElement)(`div`,{key:`manual-active`,className:`srpop-manual-current`},(0,i.createElement)(`span`,{className:`srpop-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`srpop-item-name`,title:`${V} / ${H}`},`${V} / ${H} (手动输入)`),(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`)):null,L.length===0?(0,i.createElement)(`p`,{key:`empty-cat`,className:`srpop-empty`},`未探测到可用的模型目录，请使用下方手动输入模型。`):J.length===0?(0,i.createElement)(`p`,{key:`no-match`,className:`srpop-empty`},`未找到与「${h}」匹配的模型`):(0,i.createElement)(`div`,{key:`list`,className:`srpop-list`,role:`list`},J.map(e=>(0,i.createElement)(`div`,{key:e.id,className:`srpop-group-wrap`},(0,i.createElement)(`div`,{className:`srpop-group`},(0,i.createElement)(`span`,{className:`srpop-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`srpop-group-name`,title:e.name||e.id},e.name||e.id)),e.models.map(t=>{let n=R&&H===t.id&&V===e.id,r=t.reasoning?.efforts?.length??0;return(0,i.createElement)(`button`,{key:t.id,type:`button`,className:`srpop-item`,"data-active":n?`true`:`false`,disabled:P,title:t.name||t.id,onClick:()=>Y(e.id,t.id,t.reasoning?.defaultEffort)},(0,i.createElement)(`span`,{className:`srpop-item-name`},t.name||t.id),r>1?(0,i.createElement)(`span`,{className:`srpop-badge`},`${r} 档`):null,n?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)})))),t]})(),c?(0,i.createElement)(`p`,{className:`srpop-error`,role:`alert`},c):null,d?(0,i.createElement)(`p`,{className:`srpop-notice`,role:`status`},d):null))}let F=new class{openedId=null;triggers=new Map;listeners=new Set;getOpenedSessionId(){return this.openedId}isOpen(e){return this.openedId===e}open(e,t){t&&this.triggers.set(e,t),this.openedId!==e&&(this.openedId=e,this.notify())}close(e,t){if(e!==void 0&&this.openedId!==e||this.openedId===null)return;let n=this.openedId,r=this.triggers.get(n);if(this.openedId=null,this.notify(),t?.restoreFocus!==!1&&r!==void 0&&typeof r.focus==`function`){let e=()=>{try{r.focus({preventScroll:!0})}catch{}};typeof requestAnimationFrame==`function`?requestAnimationFrame(e):e()}}toggle(e,t){t&&this.triggers.set(e,t),this.openedId===e?this.close(e):this.open(e,t)}getTrigger(e){return this.triggers.get(e)??null}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}notify(){for(let e of this.listeners)try{e()}catch(e){console.error(`[subagent-routes] popover listener error`,e)}}};function I(e,t,n){let r=Math.max(0,Math.min(360,t.width-24)),i=Math.max(0,e.top-8-12),a=Math.max(0,t.height-e.bottom-8-12),o=n??(i>=240||i>=a?`top`:`bottom`);return{left:Math.max(12,Math.min(e.right-r,t.width-12-r)),width:r,maxHeight:Math.min(480,o===`top`?i:a),side:o,...o===`top`?{bottom:t.height-e.top+8}:{top:e.bottom+8}}}function L(e){let t=F.getTrigger(e);if(t===null||!t.isConnected)return;let n=t.closest(`[data-composer-card]`);return n instanceof HTMLElement?n:t}function R({sessionId:e,api:t}){let[n,r]=(0,i.useState)(()=>F.isOpen(e)),a=(0,i.useRef)(null),[o,s]=(0,i.useState)(null);if((0,i.useEffect)(()=>{let t=()=>r(F.isOpen(e));return t(),F.subscribe(t)},[e]),(0,i.useLayoutEffect)(()=>{if(!n){s(null);return}let t,r=()=>{let n=L(e);if(n===void 0){s(null);return}let r=I(n.getBoundingClientRect(),{width:window.innerWidth,height:window.innerHeight},t);t=r.side,s(e=>e!==null&&e.left===r.left&&e.top===r.top&&e.bottom===r.bottom&&e.width===r.width&&e.maxHeight===r.maxHeight?e:r)};r();let i=new ResizeObserver(r),a=L(e);return a!==void 0&&i.observe(a),window.addEventListener(`resize`,r),window.addEventListener(`scroll`,r,!0),()=>{i.disconnect(),window.removeEventListener(`resize`,r),window.removeEventListener(`scroll`,r,!0)}},[n,e]),(0,i.useEffect)(()=>{if(!n)return;let t=!1,r=()=>{if(t)return;let e=a.current,n=e?.querySelector(`.srpop-mode[aria-pressed="true"]:not([disabled])`)??e?.querySelector(`.srpop-mode:not([disabled])`);n&&(n.focus({preventScroll:!0}),t=!0)},i=requestAnimationFrame(r),o=new MutationObserver(r);a.current&&o.observe(a.current,{childList:!0,subtree:!0});let s=t=>{t.key===`Escape`&&(t.preventDefault(),t.stopPropagation(),F.close(e,{restoreFocus:!0}))},c=t=>{let n=t.target;!n||a.current?.contains(n)||F.getTrigger(e)?.contains(n)||F.close(e,{restoreFocus:!1})};return window.addEventListener(`keydown`,s),window.addEventListener(`pointerdown`,c,!0),()=>{cancelAnimationFrame(i),o.disconnect(),window.removeEventListener(`keydown`,s),window.removeEventListener(`pointerdown`,c,!0)}},[n,e]),!n)return null;let c=(0,i.createElement)(`div`,{ref:a,className:`sr-popover-portal`,role:`dialog`,"aria-label":`子代理模型配置`,"aria-modal":`false`,"data-side":o?.side,style:{visibility:o===null?`hidden`:`visible`,boxSizing:`border-box`,minWidth:0,left:o?.left,top:o?.top,bottom:o?.bottom,width:o?.width,maxHeight:o?.maxHeight}},(0,i.createElement)(`style`,null,`
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
`),(0,i.createElement)(P,{key:e,sessionId:e,...t===void 0?{}:{api:t},onClose:()=>F.close(e,{restoreFocus:!0})}));return typeof document>`u`?c:(0,N.createPortal)(c,document.body)}function z({sessionId:e,onOpen:t,api:n=k}){let[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(()=>F.isOpen(e)),c=(0,i.useRef)(null);if((0,i.useEffect)(()=>{let t=()=>{s(F.isOpen(e))};return t(),F.subscribe(t)},[e]),(0,i.useEffect)(()=>{o&&c.current!==null&&F.open(e,c.current)},[e,o]),(0,i.useEffect)(()=>{let t=!0,r=0,i,o=()=>{let o=++r;i?.abort(),i=new AbortController,n.load(e,i.signal).then(e=>{t&&o===r&&a(e)}).catch(()=>{})};a(null);let s=n.subscribe?.(o);return o(),()=>{t=!1,s?.(),i?.abort()}},[n,e]),r===null)return null;let{label:l,sourceLabel:u,isOverride:d}=S(r);return(0,i.createElement)(i.Fragment,null,(0,i.createElement)(`style`,{key:`css`},`
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
`),(0,i.createElement)(`button`,{key:`chip`,ref:c,type:`button`,className:`sr-chip${d?` is-override`:``}${o?` is-open`:``}`,onClick:()=>{t?t():F.toggle(e,c.current)},title:`子代理：${l}（${u}）— 点击切换子代理配置`,"aria-label":`子代理当前使用 ${l}，来源${u}；点击切换子代理配置`,"aria-expanded":o,"aria-haspopup":`dialog`},(0,i.createElement)(`span`,{className:`sr-chip-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`sr-chip-label`},`子 ${l}`),(0,i.createElement)(`span`,{className:`sr-chip-arrow`,"aria-hidden":`true`},o?`▴`:`▾`)))}function B(e,t=[]){let n=[`# 子代理工作区路由表`,`# 最长前缀匹配优先；未匹配项目回落至全局兜底配置（若有）。`],r=e&&(e.provider||e.model||e.reasoningEffort);if(r&&(n.push(``),n.push(`# 全局兜底配置（未匹配项目时使用）`),n.push(`default:`),e.provider&&n.push(`  provider: ${e.provider}`),e.model&&n.push(`  model: ${e.model}`),e.reasoningEffort&&n.push(`  reasoningEffort: ${e.reasoningEffort}`)),t.length>0){n.push(``),n.push(`# 项目专属路由规则`),n.push(`routes:`);for(let e of t)n.push(`  - path: ${e.path}`),e.provider&&n.push(`    provider: ${e.provider}`),e.model&&n.push(`    model: ${e.model}`),e.reasoningEffort&&n.push(`    reasoningEffort: ${e.reasoningEffort}`)}else r||(n.push(``),n.push(`routes: []`));return n.push(``),n.join(`
`)}function V(e){let t=e.trim();if(!t)return{data:{fallback:void 0,routes:[]}};let n=t.split(/\r?\n/),r=!1,i=!1,a={},o=[],s=null,c=()=>{s&&s.path&&o.push({path:s.path,provider:s.provider,model:s.model,reasoningEffort:s.reasoningEffort}),s=null};for(let e=0;e<n.length;e++){let t=n[e],o=t.replace(/#.*$/,``).trimEnd();if(!o.trim())continue;let l=t.search(/\S/),u=o.trim();if(l===0){if(c(),u.startsWith(`default:`)){r=!0,i=!1;continue}if(u.startsWith(`routes:`)){r=!1,i=!0;continue}r=!1,i=!1}else if(r&&l>0){let e=u.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);if(e){let[,t,n]=e,r=n.trim().replace(/^['"](.*)['"]$/,`$1`);t===`provider`?a.provider=r:t===`model`?a.model=r:t===`reasoningEffort`&&(a.reasoningEffort=r)}}else if(i&&l>0){if(u.startsWith(`- `)){c(),s={};let e=u.slice(2).trim();if(e){let t=e.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);if(t){let[,e,n]=t,r=n.trim().replace(/^['"](.*)['"]$/,`$1`);e===`path`?s.path=r:e===`provider`?s.provider=r:e===`model`?s.model=r:e===`reasoningEffort`&&(s.reasoningEffort=r)}}continue}if(s){let e=u.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);if(e){let[,t,n]=e,r=n.trim().replace(/^['"](.*)['"]$/,`$1`);t===`path`?s.path=r:t===`provider`?s.provider=r:t===`model`?s.model=r:t===`reasoningEffort`&&(s.reasoningEffort=r)}}}}return c(),{data:{fallback:a.provider||a.model||a.reasoningEffort?a:void 0,routes:o}}}let H=`
.sr-settings {
  --sr-bg: var(--dsw-alias-bg-base, #f8fafc);
  --sr-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --sr-surface-subtle: #f1f5f9;
  --sr-text: var(--dsw-alias-label-primary, #0f172a);
  --sr-muted: #475569;
  --sr-line: var(--dsw-alias-border-default, #e2e8f0);
  --sr-control-line: var(--dsw-alias-border-strong, #cbd5e1);
  --sr-accent: #0f766e;
  --sr-accent-hover: #115e59;
  --sr-accent-text: #ffffff;
  --sr-accent-subtle: #f0fdfa;
  --sr-error: #b91c1c;
  --sr-error-bg: #fef2f2;
  --sr-success: #15803d;
  --sr-success-bg: #f0fdf4;
  --sr-warning: #d97706;
  --sr-warning-bg: #fffbeb;
  --sr-tag-bg: #e0f2fe;
  --sr-tag-text: #0369a1;
  color: var(--sr-text);
  font: 13px/20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  width: 100%;
  max-width: 860px;
  min-width: 0;
  text-align: left;
}
[data-ds-dark-theme] .sr-settings {
  --sr-bg: var(--dsw-alias-bg-base, #141a23);
  --sr-surface: var(--dsw-alias-bg-layer-1, #1e293b);
  --sr-surface-subtle: #243247;
  --sr-text: var(--dsw-alias-label-primary, #f8fafc);
  --sr-muted: var(--dsw-alias-label-secondary, #94a3b8);
  --sr-line: var(--dsw-alias-border-default, #334155);
  --sr-control-line: var(--dsw-alias-border-strong, #475569);
  --sr-accent: #2dd4bf;
  --sr-accent-hover: #5eead4;
  --sr-accent-text: #042f2e;
  --sr-accent-subtle: #134e4833;
  --sr-error: #f87171;
  --sr-error-bg: #450a0a44;
  --sr-success: #4ade80;
  --sr-success-bg: #052e1644;
  --sr-warning: #fbbf24;
  --sr-warning-bg: #451a0344;
  --sr-tag-bg: #07598544;
  --sr-tag-text: #7dd3fc;
}
.sr-settings *, .sr-settings *::before, .sr-settings *::after { box-sizing: border-box; }

/* 头部与总控开关 */
.sr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--sr-line);
}
.sr-header-info { min-width: 0; flex: 1; }
.sr-title { font-size: 18px; line-height: 26px; margin: 0 0 4px; font-weight: 650; }
.sr-subtitle { font-size: 13px; line-height: 18px; color: var(--sr-muted); margin: 0; }

/* 主开关 Switch */
.sr-switch-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  margin-top: 2px;
}
.sr-switch-control:has(:disabled) {
  cursor: not-allowed;
  opacity: 0.6;
}
.sr-switch-label { font-weight: 600; font-size: 13px; color: var(--sr-text); }
.sr-switch-track {
  width: 44px;
  height: 24px;
  background: var(--sr-control-line);
  border-radius: 9999px;
  position: relative;
  transition: background-color 0.2s ease;
}
.sr-switch-track.sr-switch-checked { background: var(--sr-accent); }
.sr-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}
.sr-switch-track.sr-switch-checked .sr-switch-thumb { transform: translateX(20px); }
.sr-switch-input { position: absolute; opacity: 0; width: 0; height: 0; }
.sr-switch-input:focus-visible + .sr-switch-track {
  outline: 2px solid var(--sr-accent);
  outline-offset: 2px;
}

/* 视图切换 Tabs */
.sr-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 12px;
  flex-wrap: wrap;
}
.sr-tabs {
  display: inline-flex;
  background: var(--sr-surface-subtle);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid var(--sr-line);
}
.sr-tab-btn {
  border: none;
  background: transparent;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sr-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}
.sr-tab-btn:hover:not(:disabled) { color: var(--sr-text); }
.sr-tab-btn.sr-tab-active {
  background: var(--sr-surface);
  color: var(--sr-text);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* 状态通知 */
.sr-error {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--sr-error-bg);
  color: var(--sr-error);
  border: 1px solid var(--sr-error);
  border-radius: 6px;
  font-size: 12px;
  line-height: 18px;
  word-break: break-all;
}
.sr-notice {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--sr-success-bg);
  color: var(--sr-success);
  border: 1px solid var(--sr-success);
  border-radius: 6px;
  font-size: 12px;
  line-height: 18px;
}

/* 规则卡片容器 */
.sr-card {
  background: var(--sr-surface);
  border: 1px solid var(--sr-line);
  border-radius: 8px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}
.sr-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.sr-card-title {
  font-size: 14px;
  line-height: 20px;
  font-weight: 650;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sr-card-desc { font-size: 12px; color: var(--sr-muted); margin: 0 0 12px; }

/* 全局默认策略二选一选项 */
.sr-policy-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .sr-policy-options { grid-template-columns: minmax(0, 1fr); }
}
.sr-policy-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid var(--sr-control-line);
  border-radius: 6px;
  background: var(--sr-surface);
  color: var(--sr-text);
  cursor: pointer;
  font: inherit;
  transition: all 0.15s ease;
}
.sr-policy-option:hover:not(:disabled) {
  background: var(--sr-surface-subtle);
  border-color: var(--sr-accent);
}
.sr-policy-option[aria-checked='true'] {
  border-color: var(--sr-accent);
  background: var(--sr-accent-subtle);
  box-shadow: inset 0 0 0 1px var(--sr-accent);
}
.sr-policy-option:focus-visible {
  outline: 2px solid var(--sr-accent);
  outline-offset: 2px;
}
.sr-policy-option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.sr-policy-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-text);
}
.sr-policy-desc {
  font-size: 12px;
  line-height: 16px;
  color: var(--sr-muted);
}

/* 兜底网格表单 */
.sr-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 768px) {
  .sr-form-grid { grid-template-columns: minmax(0, 1fr); }
}

.sr-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.sr-field-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sr-field label { font-size: 12px; font-weight: 600; color: var(--sr-text); }
.sr-field-link {
  font-size: 11px;
  color: var(--sr-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  text-decoration: underline;
  transition: color 0.15s ease;
}
.sr-field-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
  pointer-events: none;
}
.sr-field-link:hover:not(:disabled) { color: var(--sr-accent); }
.sr-field input, .sr-field select {
  border: 1px solid var(--sr-control-line);
  border-radius: 6px;
  color: var(--sr-text);
  background: var(--sr-surface);
  width: 100%;
  min-width: 0;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  height: 36px;
  cursor: default;
  transition: border-color 0.15s ease;
}
.sr-field select { cursor: pointer; }
.sr-field input::placeholder { color: var(--sr-muted); opacity: 0.8; }
.sr-hint { font-size: 12px; line-height: 16px; color: var(--sr-muted); overflow-wrap: anywhere; }

/* 禁用态（通用控件） */
.sr-field input:disabled, .sr-field select:disabled, .sr-textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--sr-surface-subtle);
  border-color: var(--sr-line);
}

/* 项目规则列表 */
.sr-route-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.sr-route-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--sr-surface-subtle);
  border: 1px solid var(--sr-line);
  border-radius: 6px;
  transition: all 0.15s ease;
}
.sr-route-item:hover { border-color: var(--sr-control-line); }
.sr-route-item.sr-route-editing {
  border-color: var(--sr-accent);
  background: var(--sr-accent-subtle);
}
.sr-route-main { min-width: 0; flex: 1; }
.sr-route-path {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
.sr-route-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.sr-badge-model {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  padding: 2px 7px;
  background: var(--sr-surface);
  border: 1px solid var(--sr-line);
  border-radius: 4px;
  color: var(--sr-text);
}
.sr-badge-effort {
  font-size: 11px;
  padding: 2px 7px;
  background: var(--sr-tag-bg);
  color: var(--sr-tag-text);
  border-radius: 4px;
  font-weight: 500;
}
.sr-route-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 空状态卡片 */
.sr-empty {
  text-align: center;
  padding: 32px 16px;
  background: var(--sr-surface-subtle);
  border: 1px dashed var(--sr-control-line);
  border-radius: 8px;
  margin-top: 8px;
}
.sr-empty-text { font-size: 13px; color: var(--sr-muted); margin: 0 0 12px; }

/* 行内编辑器 / 模态卡片 */
.sr-editor-box {
  background: var(--sr-surface-subtle);
  border: 1px solid var(--sr-accent);
  border-radius: 8px;
  padding: 14px 16px;
  margin: 10px 0;
}
.sr-editor-box h5 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--sr-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 按钮通用 */
.sr-btn {
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--sr-line);
  color: var(--sr-text);
  background: var(--sr-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
  user-select: none;
}
.sr-btn:hover:not(:disabled) { background: var(--sr-surface-subtle); border-color: var(--sr-control-line); }
.sr-btn:active:not(:disabled) { transform: translateY(1px); }
.sr-btn.sr-btn-primary {
  background: var(--sr-accent);
  color: var(--sr-accent-text);
  border-color: var(--sr-accent);
  font-weight: 600;
}
.sr-btn.sr-btn-primary:hover:not(:disabled) { background: var(--sr-accent-hover); border-color: var(--sr-accent-hover); }
.sr-btn.sr-btn-danger {
  color: var(--sr-error);
  border-color: transparent;
  background: transparent;
}
.sr-btn.sr-btn-danger:hover:not(:disabled) { background: var(--sr-error-bg); }
.sr-btn.sr-btn-sm { height: 28px; padding: 0 8px; font-size: 11px; }
.sr-btn:focus-visible, .sr-field input:focus-visible, .sr-field select:focus-visible, .sr-textarea:focus-visible {
  outline: 2px solid var(--sr-accent);
  outline-offset: 2px;
}
.sr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 文本域 (YAML 模式) */
.sr-textarea {
  border: 1px solid var(--sr-control-line);
  border-radius: 6px;
  color: var(--sr-text);
  background: var(--sr-surface);
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  font: 13px/20px ui-monospace, SFMono-Regular, Consolas, monospace;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  resize: vertical;
  min-height: 240px;
}

/* 高级设置折叠 */
.sr-details {
  border-top: 1px solid var(--sr-line);
  padding-top: 14px;
  margin-top: 20px;
}
.sr-details summary {
  font-size: 12px;
  font-weight: 600;
  color: var(--sr-muted);
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sr-details summary:hover { color: var(--sr-text); }
.sr-details-content { margin-top: 12px; padding-left: 2px; }

/* 底部操作固定条 */
.sr-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--sr-line);
  flex-wrap: wrap;
}
.sr-footer-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sr-footer-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sr-save-btn { height: 36px; padding: 0 18px; font-size: 13px; font-weight: 600; }
.sr-dirty-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--sr-warning);
}

/* 骨架屏 Skeleton */
.sr-skeleton {
  background: linear-gradient(90deg, var(--sr-surface-subtle) 25%, var(--sr-line) 50%, var(--sr-surface-subtle) 75%);
  background-size: 200% 100%;
  animation: sr-shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes sr-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`,U={grid:`sr-form-grid`,field:`sr-field`,fieldHead:`sr-field-head`,label:``,link:`sr-field-link`,input:``,select:``,hint:`sr-hint`};function W(e){return e instanceof Error?e.message:String(e)}function G({view:e,api:t=O}){return e===`summary`?(0,i.createElement)(`span`,null,`为不同工作区目录为子代理指定 AI 模型与思考等级`):(0,i.createElement)(J,{api:t})}let K={path:``,provider:``,model:``,reasoningEffort:``};function q({value:e,workspaces:t,disabled:n=!1,onChange:r}){let a=t??[],o=a.length>0,s=o?a.some(t=>t.path===e):!1,[c,l]=(0,i.useState)(!o||e!==``&&!s);return(0,i.createElement)(`div`,{className:`sr-field`},(0,i.createElement)(`div`,{className:`sr-field-head`},(0,i.createElement)(`label`,null,`项目根目录绝对路径 *`),o?(0,i.createElement)(`button`,{type:`button`,className:`sr-field-link`,disabled:n,onClick:()=>l(e=>!e)},c?`从工作区选择`:`手动输入`):null),c||!o?(0,i.createElement)(`input`,{type:`text`,placeholder:`支持以 ~ 开头，例如 ~/PersonalRepos/products/frontend-app 或 ~/WorkRepos/company/repo`,value:e,disabled:n,onChange:e=>r(e.target.value)}):(0,i.createElement)(`select`,{value:s?e:``,disabled:n,onChange:e=>{e.target.value===`__custom__`?l(!0):r(e.target.value)}},(0,i.createElement)(`option`,{value:``},`（请选择工作区项目）`),a.map(e=>(0,i.createElement)(`option`,{key:e.path,value:e.path},e.title&&e.title!==e.path?`${e.title} — ${e.path}`:e.path)),(0,i.createElement)(`option`,{value:`__custom__`},`+ 手动输入其他目录…`)))}function J({api:e}){let[t,n]=(0,i.useState)(null),[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(`visual`),[c,l]=(0,i.useState)({}),[u,d]=(0,i.useState)([]),[f,p]=(0,i.useState)(``),[m,h]=(0,i.useState)(null),[g,v]=(0,i.useState)(K),[y,b]=(0,i.useState)(``),[x,S]=(0,i.useState)(`load`),[C,w]=(0,i.useState)(``),[T,E]=(0,i.useState)(``),D=e=>{n(e),a(e.config);let t=e.table?.text??``;if(p(t),e.table?.parsed)l(e.table.parsed.fallback??{}),d([...e.table.parsed.routes]);else{let e=V(t);e.data&&(l(e.data.fallback??{}),d([...e.data.routes]))}};(0,i.useEffect)(()=>{let t=new AbortController;return e.load(t.signal).then(e=>{t.signal.aborted||D(e)}).catch(e=>{t.signal.aborted||w(W(e))}).finally(()=>{t.signal.aborted||S(null)}),()=>t.abort()},[e]);let O=t!==null&&JSON.stringify(r)!==JSON.stringify(t.config),k=t?.table!=null&&f!==t.table.text,A=O||k;(0,i.useEffect)(()=>{if(!A)return;let e=e=>{e.preventDefault(),e.returnValue=``};return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[A]);let j=async()=>{if(!A||window.confirm(`重新读取会放弃未保存的修改，是否继续？`)){S(`load`),w(``),E(``),h(null);try{D(await e.load())}catch(e){w(W(e))}finally{S(null)}}},M=(e,t)=>{l(e),d(t);let n=B(e,t);p(n)},N=e=>{if(e===`visual`&&o===`yaml`){let e=V(f);e.data&&(l(e.data.fallback??{}),d([...e.data.routes]))}s(e),w(``)},P=async()=>{if(t!==null&&r!==null&&A){if(m!==null)w(`请先完成或取消当前单条规则的编辑（点击「确认保存规则」或「取消」）后再保存全局设置。`);else{S(`saving`),w(``),E(``);try{let n=t.table?.revision;O&&t.canEditConfig&&(await e.saveConfig(r,t.configRevision),r.routesFile!==t.config.routesFile&&(n=(await e.load()).table?.revision)),k&&t.table&&n&&await e.saveTable({text:f,revision:n});let i=await e.load();D(i),E(`设置已成功保存并立即生效！后续新建的子代理将自动应用新规则。`)}catch(e){w(W(e))}finally{S(null)}}}},F=()=>{t!==null&&(D(t),h(null),w(``),E(``))},I=()=>{h(`new`),v(K),b(``)},L=e=>{let t=u[e];h(e),v({path:t.path,provider:t.provider??``,model:t.model??``,reasoningEffort:t.reasoningEffort??``}),b(``)},R=()=>{let e=g.path.trim();if(!e){b(`工作区目录路径不能为空`);return}let t=/^[a-zA-Z]:[/\\]/.test(e);if(!e.startsWith(`/`)&&!e.startsWith(`~`)&&!t){b(`路径必须是绝对路径（例如 /Users/... 或 C:\\...）或以 ~ 开头`);return}let n=g.provider.trim()||void 0,r=g.model.trim()||void 0,i=g.reasoningEffort.trim()||void 0;if(n===void 0!=(r===void 0)){b(`Provider 与 Model 必须同时提供或同时留空`);return}if(n===void 0&&i===void 0){b(`至少需要指定 模型(Provider+Model) 或 思考等级`);return}if(u.some((t,n)=>n!==m&&t.path===e)){b(`已存在针对目录 "${e}" 的规则`);return}let a={path:e,...n?{provider:n,model:r}:{},...i?{reasoningEffort:i}:{}},o=[...u];m===`new`?o.push(a):typeof m==`number`&&(o[m]=a),M(c,o),h(null),v(K),b(``)},z=e=>{let t=u[e];if(!window.confirm(`确定要移除工作区 "${t.path}" 的专属路由规则吗？`))return;let n=u.filter((t,n)=>n!==e);M(c,n),m===e&&h(null)},G=e=>{let t={...e.provider?{provider:e.provider}:{},...e.model?{model:e.model}:{},...e.reasoningEffort?{reasoningEffort:e.reasoningEffort}:{}};M(t,u)};if(t===null||r===null)return(0,i.createElement)(`div`,{className:`sr-settings`,"aria-busy":!0},(0,i.createElement)(`style`,null,H),(0,i.createElement)(`div`,{className:`sr-header`},(0,i.createElement)(`div`,{className:`sr-header-info`},(0,i.createElement)(`h3`,{className:`sr-title`},`子代理工作区路由`),(0,i.createElement)(`p`,{className:`sr-subtitle`},`按项目目录为子代理自动分配不同的 AI 模型与思考等级。`))),(0,i.createElement)(`div`,{style:{padding:`24px 0`}},x?(0,i.createElement)(`p`,{className:`sr-hint`,role:`status`,style:{marginBottom:16}},`正在读取设置…`):null,x?(0,i.createElement)(`div`,{className:`sr-skeleton`,style:{height:100,marginBottom:16}}):null,x?(0,i.createElement)(`div`,{className:`sr-skeleton`,style:{height:140}}):null,C?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`},C):null,x?null:(0,i.createElement)(`div`,{style:{marginTop:16}},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,onClick:()=>void j()},`重新读取设置`))));let J=x!==null,Y=(0,i.createElement)(`header`,{className:`sr-header`},(0,i.createElement)(`div`,{className:`sr-header-info`},(0,i.createElement)(`h3`,{className:`sr-title`},`子代理工作区路由`),(0,i.createElement)(`p`,{className:`sr-subtitle`},`根据当前会话所在的项目目录，自动让子代理切换到最适用的模型，最长路径匹配优先。`)),(0,i.createElement)(`label`,{className:`sr-switch-control`,title:r.enabled?`点击禁用路由`:`点击启用路由`},(0,i.createElement)(`span`,{className:`sr-switch-label`},r.enabled?`已启用`:`已暂停`),(0,i.createElement)(`input`,{type:`checkbox`,className:`sr-switch-input`,checked:r.enabled,disabled:J||!t.canEditConfig,onChange:e=>{a({...r,enabled:e.target.checked}),E(``),w(``)}}),(0,i.createElement)(`div`,{className:`sr-switch-track ${r.enabled?`sr-switch-checked`:``}`},(0,i.createElement)(`div`,{className:`sr-switch-thumb`})))),X=(0,i.createElement)(`div`,{className:`sr-nav-row`},(0,i.createElement)(`div`,{className:`sr-tabs`},(0,i.createElement)(`button`,{type:`button`,className:`sr-tab-btn ${o===`visual`?`sr-tab-active`:``}`,onClick:()=>N(`visual`)},`规则设置`),(0,i.createElement)(`button`,{type:`button`,className:`sr-tab-btn ${o===`yaml`?`sr-tab-active`:``}`,onClick:()=>N(`yaml`)},`原始 YAML 模式`))),Z=r.fallbackPolicy??`rules`,Q=Z===`inherit`,$=e=>(0,i.createElement)(`p`,{key:e,className:`sr-hint is-warn`,style:{margin:`0 0 12px`}},`当前全局策略是「继承主代理模型」，下列配置已保存但暂不生效；切回「使用路由规则」即恢复。`),ee=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`全局默认策略`)),(0,i.createElement)(`p`,{className:`sr-card-desc`},`当会话未单独指定、且当前工作区目录未命中任何专属规则时，子代理的兜底行为。`),(0,i.createElement)(`div`,{className:`sr-policy-options`,role:`radiogroup`,"aria-label":`全局默认策略`},(0,i.createElement)(`button`,{type:`button`,className:`sr-policy-option`,role:`radio`,"aria-checked":Z===`inherit`,disabled:J||!t.canEditConfig,onClick:()=>{a({...r,fallbackPolicy:`inherit`}),E(``),w(``)}},(0,i.createElement)(`span`,{className:`sr-policy-name`},`继承主代理模型`),(0,i.createElement)(`span`,{className:`sr-policy-desc`},`子代理直接复用主代理的模型与思考等级，不应用下方通用路由配置。`)),(0,i.createElement)(`button`,{type:`button`,className:`sr-policy-option`,role:`radio`,"aria-checked":Z===`rules`,disabled:J||!t.canEditConfig,onClick:()=>{a({...r,fallbackPolicy:`rules`}),E(``),w(``)}},(0,i.createElement)(`span`,{className:`sr-policy-name`},`使用路由规则`),(0,i.createElement)(`span`,{className:`sr-policy-desc`},`查阅项目专属路由规则；未命中时使用下方配置的全局默认模型。`)))),te=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`全局默认模型（未匹配项目时使用）`)),(0,i.createElement)(`p`,{className:`sr-card-desc`},`当子代理所在的工作区没有匹配到下方专属规则时使用。留空则直接继承父会话的模型。`),Q?$(`policy-fallback`):null,(0,i.createElement)(_,{provider:c.provider??``,model:c.model??``,reasoningEffort:c.reasoningEffort??``,catalog:t.catalog,disabled:J,allowInherit:!0,classes:U,onChange:e=>G(e)})),ne=m===null?null:(0,i.createElement)(`div`,{className:`sr-editor-box`},(0,i.createElement)(`h5`,null,m===`new`?`新建项目专属规则`:`修改规则 (${g.path})`),(0,i.createElement)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:12}},(0,i.createElement)(q,{key:`path-${m}`,value:g.path,workspaces:t.workspaces,disabled:J,onChange:e=>v(t=>({...t,path:e}))}),(0,i.createElement)(`span`,{className:`sr-hint`},`子代理在该目录或其子目录中派活时将生效（更长路径优先）。`),(0,i.createElement)(_,{provider:g.provider,model:g.model,reasoningEffort:g.reasoningEffort,catalog:t.catalog,disabled:J,allowInherit:!0,classes:U,onChange:e=>v({...g,provider:e.provider,model:e.model,reasoningEffort:e.reasoningEffort})}),y?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`,style:{margin:0}},y):null,(0,i.createElement)(`div`,{style:{display:`flex`,gap:8,marginTop:4}},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-btn-sm`,onClick:R},`确认保存规则`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,onClick:()=>{h(null),b(``)}},`取消`)))),re=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`项目专属路由规则 (${u.length})`),m===null&&u.length>0?(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,onClick:I},`+ 新增规则`):null),(0,i.createElement)(`p`,{className:`sr-card-desc`},`根据工作区目录前缀进行匹配；当同一个项目有多个匹配规则时，路径层级更深的规则生效。`),Q?$(`policy-routes`):null,ne,u.length===0&&m===null?(0,i.createElement)(`div`,{className:`sr-empty`},(0,i.createElement)(`p`,{className:`sr-empty-text`},`暂无任何项目规则。子代理将使用全局兜底模型或继承主会话设置。`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-btn-sm`,onClick:I},`+ 添加第一个项目规则`)):(0,i.createElement)(`div`,{className:`sr-route-list`},u.map((e,t)=>(0,i.createElement)(`div`,{key:`${e.path}-${t}`,className:`sr-route-item ${m===t?`sr-route-editing`:``}`},(0,i.createElement)(`div`,{className:`sr-route-main`},(0,i.createElement)(`span`,{className:`sr-route-path`,title:e.path},e.path),(0,i.createElement)(`div`,{className:`sr-route-meta`},e.provider&&e.model?(0,i.createElement)(`span`,{className:`sr-badge-model`},`${e.provider} / ${e.model}`):(0,i.createElement)(`span`,{className:`sr-hint`},`继承父会话模型`),e.reasoningEffort?(0,i.createElement)(`span`,{className:`sr-badge-effort`},`思考: ${e.reasoningEffort}`):null)),(0,i.createElement)(`div`,{className:`sr-route-actions`},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,disabled:J||m!==null,onClick:()=>L(t)},`编辑`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-danger sr-btn-sm`,disabled:J||m!==null,onClick:()=>z(t)},`删除`)))))),ie=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`原始 YAML 编辑`),t.table?(0,i.createElement)(`span`,{className:`sr-hint`,style:{fontFamily:`ui-monospace`}},t.table.file):null),(0,i.createElement)(`p`,{className:`sr-card-desc`},`支持直接编辑完整的路由表 YAML 内容，保存时保持结构化规范。修改会与可视化表单双向同步。`),(0,i.createElement)(`textarea`,{className:`sr-textarea`,"aria-label":`路由表内容（YAML）`,value:f,disabled:J,spellCheck:!1,onChange:e=>{p(e.target.value),w(``),E(``)}})),ae=(0,i.createElement)(`details`,{className:`sr-details`},(0,i.createElement)(`summary`,null,`高级选项（预检校验与存储路径）`),(0,i.createElement)(`div`,{className:`sr-details-content`},(0,i.createElement)(`div`,{className:`sr-field`,style:{marginBottom:12}},(0,i.createElement)(`label`,{style:{display:`flex`,alignItems:`center`,gap:8,cursor:`pointer`}},(0,i.createElement)(`input`,{type:`checkbox`,checked:r.preflight,disabled:J||!t.canEditConfig,onChange:e=>a({...r,preflight:e.target.checked})}),(0,i.createElement)(`span`,{style:{fontWeight:600}},`派活前进行模型可用性预检`)),(0,i.createElement)(`span`,{className:`sr-hint`},`创建子代理前调用底层模型接口预先核验 provider、model 和思考等级是否合法可用。`)),(0,i.createElement)(`div`,{className:`sr-field`},(0,i.createElement)(`label`,null,`自定义路由表存储路径`),(0,i.createElement)(`input`,{type:`text`,placeholder:`留空使用默认路径 $DSH_HOME/subagent-routes.yaml`,value:r.routesFile,disabled:J||!t.canEditConfig,onChange:e=>a({...r,routesFile:e.target.value})}),(0,i.createElement)(`span`,{className:`sr-hint`},`支持以 ~ 开头。修改并保存后，插件将切换至新文件读取规则。`)),t.canEditConfig?null:(0,i.createElement)(`p`,{className:`sr-hint`,style:{marginTop:8}},`当前宿主环境不支持修改插件基础配置，高级配置项已锁定。`))),oe=(0,i.createElement)(`div`,{className:`sr-footer-bar`},(0,i.createElement)(`div`,{className:`sr-footer-left`},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-save-btn`,disabled:J||!A||m!==null,onClick:()=>void P()},x===`saving`?`正在保存…`:A?`保存所有更改`:`已是最新配置`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,disabled:J||!A,onClick:F},`放弃修改`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,disabled:J,onClick:()=>void j()},x===`load`?`读取中…`:`重新读取`)),(0,i.createElement)(`div`,{className:`sr-footer-right`},m===null?A?(0,i.createElement)(`span`,{className:`sr-dirty-badge`},`● 有未保存的修改`):null:(0,i.createElement)(`span`,{className:`sr-dirty-badge`},`正在编辑单条规则，请先确认保存`)));return(0,i.createElement)(`div`,{className:`sr-settings`,"aria-busy":J},(0,i.createElement)(`style`,null,H),Y,X,C?(0,i.createElement)(`div`,{className:`sr-error`,role:`alert`},C):null,T?(0,i.createElement)(`div`,{className:`sr-notice`,role:`status`},T):null,o===`visual`?(0,i.createElement)(`div`,null,ee,te,re):ie,ae,oe)}let Y=`${a}/route`,X=[`slots`,`sidebarRightTabs`,`sidebarRight`,`locale`],Z={"tab.title":`子代理`,"guide.title":`子代理模型`,"guide.description":`切换本会话的子代理配置，并看清当前生效的来源。`},Q={"tab.title":`Subagent`,"guide.title":`Subagent model`,"guide.description":`Switch this session’s subagent route and see which layer is in effect.`};function $(e,t){try{t()}catch(t){let n=t instanceof Error?t.message:String(t),r=Error(`[${o}] ${e} 注册失败：${n}`,{cause:t});throw console.error(r.message,t),r}}function ee(e){let t=e.effect??(e=>{e()}),n=e.locale.bind(a),r=(e,t)=>n(e)??t;$(`locale`,()=>{e.locale.register(a,{zh:Z,en:Q})});for(let[t,n]of[[`plugins.bundle.config`,a],[`plugins.row.config`,`${a}#${o}`]])$(`settings:${t}`,()=>{e.slots.inject(t,()=>e.slots.register({name:t,key:n},G))});$(`sidebar-tab-type`,()=>{t(()=>e.sidebarRightTabs.register({id:Y,kind:`subagentroute`,priority:`extension`,title:()=>r(`tab.title`,`子代理`),guide:[{id:`route`,order:30,title:()=>r(`guide.title`,`子代理模型`),description:()=>r(`guide.description`,`切换本会话的子代理配置。`)}]}),`subagent-routes: sidebar tab type`)}),$(`sidebar-tab-body`,()=>{e.slots.inject(`sidebar.right.pane.tab`,()=>e.slots.register({name:`sidebar.right.pane.tab`,key:Y,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(j,{key:t,sessionId:t})})))}),$(`sidebar-tab-title`,()=>{e.slots.inject(`sidebar.right.pane.tab.title`,()=>e.slots.register({name:`sidebar.right.pane.tab.title`,key:Y},(()=>r(`tab.title`,`子代理`))))}),$(`composer-chip`,()=>{e.slots.inject(`conversation.input.right`,()=>e.slots.register({name:`conversation.input.right`,id:`${a}-chip`,kind:`list`,scope:`session`,order:0,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(z,{key:t,sessionId:t})})))}),$(`composer-overlay`,()=>{e.slots.inject(`conversation.input.overlay`,()=>e.slots.register({name:`conversation.input.overlay`,id:`${a}-overlay`,kind:`list`,scope:`session`,order:0,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(R,{key:t,sessionId:t})})))})}return n.apply=ee,n.inject=X,n.name=`@zdt3476/dsh-subagent-routes`,t.exports}});
//# sourceMappingURL=client.js.map