/**
* @zdt3476/dsh-subagent-routes v0.1.2
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
[data-ds-dark-theme] .sr-panel {
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

/* 标题区 */
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
`;function d(e,t){return JSON.stringify([e,t])}function f(e){try{let t=JSON.parse(e);return!Array.isArray(t)||t.length!==2||t.some(e=>typeof e!=`string`)?void 0:{provider:t[0],model:t[1]}}catch{return}}function p(e,t){if(e&&t!==``)for(let n of e){let e=n.models.find(e=>e.id===t);if(e!==void 0)return{group:n,entry:e}}}function m(e,t){if(t===void 0)return e;let n=t.reasoning?.efforts;return!n||n.length===0?``:e!==``&&n.some(t=>t.id===e)?e:t.reasoning?.defaultEffort??``}let h={provider:`Provider（提供商）`,model:`模型名称 (Model)`,effort:`思考等级 (Reasoning Effort)`,manual:`手动输入`,fromList:`从列表选择`,inheritProvider:`（继承主代理提供商）`,inheritModel:`（继承主代理模型）`,pickProvider:`（请选择提供商）`,pickModel:`（请选择模型）`,customProvider:`例如 openai / anthropic / deepseek`,customModel:`例如 gpt-4.1 / claude-sonnet-4`,modelUnsupported:`该模型不支持思考等级`,modelUnsupportedHint:`所选模型无深度思考/推理模式，已自动禁用`,effortInherit:`继承或模型默认`,effortLinked:`已智能联动该模型支持的专属思考档位`,effortGeneric:`通用思考等级档位`,noReasoning:`当前模型不支持思考等级`},g=[{value:``,label:`继承或模型默认`},{value:`low`,label:`低 (low) - 快速响应`},{value:`medium`,label:`中 (medium) - 平衡`},{value:`high`,label:`高 (high) - 深度推理`},{value:`max`,label:`最大 (max) - 极限思考`}];function _({provider:e,model:t,reasoningEffort:n,catalog:r,disabled:a=!1,allowInherit:o=!1,classes:s,labels:c,allowManual:l=!0,onChange:u}){let _={...h,...c},v=Array.isArray(r)&&r.length>0,y=v?r.find(t=>t.id===e):void 0,b=e===``?p(r,t):void 0,x=y?.models??[],S=y?x.find(e=>e.id===t):b?.entry,[C,w]=(0,i.useState)(!v||!!e&&!y),[T,E]=(0,i.useState)(!v||!!t&&S===void 0),[D,O]=(0,i.useState)({hasCatalog:v,provider:e,model:t});if(D.hasCatalog!==v||D.provider!==e||D.model!==t){let n=!D.hasCatalog&&v;O({hasCatalog:v,provider:e,model:t}),v?n?(w(!!e&&!y),E(!!t&&S===void 0)):(!C&&e&&!y&&w(!0),!T&&t&&S===void 0&&E(!0)):(w(!0),E(!0))}let k=S?.reasoning,ee=!(!S||k&&k.efforts&&k.efforts.length!==0),A=!!k?.efforts?.length,j=e=>{if(e===`__custom__`){w(!0);return}w(!1);let i=r?.find(t=>t.id===e)?.models??[],a=i.some(e=>e.id===t)?t:i[0]?.id??``;u({provider:e,model:a,reasoningEffort:m(n,i.find(e=>e.id===a))})},te=t=>{if(t===`__custom__`){E(!0);return}if(E(!1),t===``){u({provider:o&&!C?``:e,model:``,reasoningEffort:n});return}let i=f(t);if(i===void 0)return;let a=r?.find(e=>e.id===i.provider)?.models.find(e=>e.id===i.model);u({provider:i.provider,model:i.model,reasoningEffort:m(n,a)})},M=`sr-provider-${(0,i.useId)().replace(/:/g,``)}`,N=`sr-model-${(0,i.useId)().replace(/:/g,``)}`,P=`sr-effort-${(0,i.useId)().replace(/:/g,``)}`,ne=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:M},_.provider),v&&l?(0,i.createElement)(`button`,{type:`button`,className:s.link,disabled:a,onClick:()=>{let e=!C;w(e),e&&E(!0)}},C?_.fromList:_.manual):null),C||!v?(0,i.createElement)(`input`,{type:`text`,id:M,className:s.input,placeholder:_.customProvider,value:e,disabled:a,onChange:e=>u({provider:e.target.value.trim(),model:t,reasoningEffort:n})}):(0,i.createElement)(`select`,{id:M,className:s.select,value:y?e:``,disabled:a,onChange:e=>j(e.target.value)},(0,i.createElement)(`option`,{value:``},o?_.inheritProvider:_.pickProvider),r.map(e=>(0,i.createElement)(`option`,{key:e.id,value:e.id},`${e.name||e.id} (${e.id})`)),l?(0,i.createElement)(`option`,{value:`__custom__`},`+ ${_.manual}…`):null)),F=(y?[y]:r??[]).filter(e=>e.models.length>0).map(e=>(0,i.createElement)(`optgroup`,{key:e.id,label:e.name||e.id},e.models.map(t=>(0,i.createElement)(`option`,{key:d(e.id,t.id),value:d(e.id,t.id)},t.name&&t.name!==t.id?`${t.name} (${t.id})`:t.id)))),I=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:N},_.model),v&&l?(0,i.createElement)(`button`,{type:`button`,className:s.link,disabled:a,onClick:()=>E(e=>!e)},T?_.fromList:_.manual):null),T||!v?(0,i.createElement)(`input`,{type:`text`,id:N,className:s.input,placeholder:_.customModel,value:t,disabled:a,onChange:t=>u({provider:e,model:t.target.value.trim(),reasoningEffort:n})}):(0,i.createElement)(`select`,{id:N,className:s.select,value:t&&S!==void 0?d(e||b?.group.id||``,t):``,disabled:a,onChange:e=>te(e.target.value)},(0,i.createElement)(`option`,{value:``},o?_.inheritModel:_.pickModel),F,l?(0,i.createElement)(`option`,{value:`__custom__`},`+ ${_.manual}…`):null)),L,R=``;ee?(L=(0,i.createElement)(`select`,{id:P,className:s.select,value:``,disabled:!0,title:_.noReasoning},(0,i.createElement)(`option`,{value:``},_.modelUnsupported)),R=_.modelUnsupportedHint):A&&k?(L=(0,i.createElement)(`select`,{id:P,className:s.select,value:n,disabled:a,onChange:n=>u({provider:e,model:t,reasoningEffort:n.target.value})},(0,i.createElement)(`option`,{value:``},`${_.effortInherit}${k.defaultEffort?` (${k.defaultEffort})`:``}`),k.efforts.map(e=>(0,i.createElement)(`option`,{key:e.id,value:e.id},`${e.name||e.id} (${e.id})${e.description?` - ${e.description}`:``}`))),R=_.effortLinked):(L=(0,i.createElement)(`select`,{id:P,className:s.select,value:n,disabled:a,onChange:n=>u({provider:e,model:t,reasoningEffort:n.target.value})},g.map(e=>(0,i.createElement)(`option`,{key:e.value,value:e.value},e.label))),R=_.effortGeneric);let z=(0,i.createElement)(`div`,{className:s.field},(0,i.createElement)(`div`,{className:s.fieldHead},(0,i.createElement)(`label`,{className:s.label,htmlFor:P},_.effort)),L,R?(0,i.createElement)(`span`,{className:s.hint},R):null);return(0,i.createElement)(`div`,{className:s.grid},ne,I,z)}let v={caller:{label:`本次调用指定`,hint:`派活方在工具参数里点名了模型，插件的配置没有介入。`},session:{label:`本会话指定`,hint:`你在本会话里临时指定的配置，优先于项目规则。`},workspace:{label:`项目规则`,hint:`命中了当前目录的项目路由规则。`},fallback:{label:`全局兜底`,hint:`没有命中任何项目规则，使用全局默认配置。`},inherit:{label:`继承主代理`,hint:`没有任何配置介入，子代理直接继承主代理的模型。`}};function y(e){return e?.reasoningEffort===void 0?void 0:`思考等级 ${e.reasoningEffort}`}function b(e){return e?.reasoningEffort}function x(e){if(e===void 0)return`继承主代理`;let t=e.provider===void 0||e.model===void 0?void 0:`${e.provider} / ${e.model}`;if(t===void 0)return y(e)??`继承主代理`;let n=b(e);return n===void 0?t:`${t} · ${n}`}function S(e){if(e===null)return{label:`继承主代理`,source:`inherit`,sourceLabel:v.inherit.label,isOverride:!1};let t=e.effective?.spec,n=e.effective?.source??`inherit`;return{label:x(t),source:n,sourceLabel:v[n]?.label??n,isOverride:e.session!==void 0}}function C(e,t,n){let r=0,i=0,a;return{load:async(o={})=>{let s=o.silent===!0,c=r,l=++i;a?.abort();let u=new AbortController;a=u;try{let a=await e.load(t,u.signal);c===r&&l===i&&n().onSnapshot(a)}catch(e){if(u.signal.aborted||c!==r||l!==i)return;s||n().onError(e instanceof Error?e.message:String(e))}finally{c===r&&l===i&&!s&&n().onSettled()}},invalidate:()=>(r+=1,a?.abort(),a=void 0,r),isCurrent:e=>e===r,subscribe:t=>{let n=e.subscribe?.(t);return()=>{n?.()}}}}let w=new Set;function T(){for(let e of w)e()}async function E(e,t){let n=await fetch(e,{credentials:`same-origin`,cache:`no-store`,...t}),r;try{r=await n.json()}catch{throw Error(`宿主接口不可用（HTTP ${n.status}），请重载插件后重试`)}if(!n.ok){let e=r?.error;throw Error(typeof e==`string`?e:`请求失败（HTTP ${n.status}）`)}return r}function D(e){return{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)}}let O={load:e=>E(s,{signal:e}),saveTable:async e=>{let t=await E(s,D({kind:`table`,...e}));return T(),t},saveConfig:async(e,t)=>{await E(s,D({kind:`config`,config:e,revision:t})),T()}},k={load:(e,t)=>E(`${c}?sessionId=${encodeURIComponent(e)}`,{signal:t}),save:async(e,t)=>{let n={action:`save`,sessionId:e,mode:t.mode,...t.override===void 0?{}:{override:t.override}},r=await E(c,D(n));return T(),r},freeze:async e=>{let t=await E(c,D({action:`freeze`,sessionId:e}));return T(),t},subscribe:e=>(w.add(e),()=>{w.delete(e)})},ee={grid:`srp-grid`,field:`srp-field`,fieldHead:`srp-field-head`,label:`srp-label`,link:`srp-btn`,input:`srp-input`,select:`srp-select`,hint:`srp-hint`};function A({sessionId:e,api:t=k}){let[n,r]=(0,i.useState)(null),[a,o]=(0,i.useState)(`follow`),[s,c]=(0,i.useState)({provider:``,model:``,reasoningEffort:``}),[u,d]=(0,i.useState)(`load`),f=(0,i.useRef)(null),[p,m]=(0,i.useState)(``),[h,g]=(0,i.useState)(``),y=(0,i.useCallback)(e=>{r(t=>e.catalog===void 0&&t?.catalog!==void 0&&t.sessionId===e.sessionId?{...e,catalog:t.catalog}:e),o(e.mode);let t=e.session?.mode===`custom`?e.session:void 0;c({provider:t?.provider??``,model:t?.model??``,reasoningEffort:t?.reasoningEffort??``})},[]),b=(0,i.useRef)(null),S=(0,i.useCallback)(async e=>{e?.silent===!0?await b.current?.load({silent:!0}):(d(`load`),m(``),await b.current?.load())},[]);(0,i.useEffect)(()=>{let n=C(t,e,()=>({onSnapshot:y,onError:e=>m(e),onSettled:()=>d(null)}));b.current=n,r(null),m(``),g(``),n.load();let i=n.subscribe(()=>{n.load({silent:!0})});return()=>{i(),n.invalidate(),b.current=null}},[t,y,e]);let w=n?.enabled===!1,T=e=>{requestAnimationFrame(()=>{f.current?.querySelector(e)?.scrollIntoView({block:`nearest`,behavior:`smooth`})})},E=e=>{if(o(e),g(``),m(``),e!==`custom`)return;T(`.srp-field:last-of-type`);let t=n?.effective?.spec??n?.workspace?.spec;c(e=>e.provider!==``||e.model!==``?e:{provider:t?.provider??``,model:t?.model??``,reasoningEffort:t?.reasoningEffort??``})},D=async()=>{let n=null;if(a===`custom`){let e=s.provider.trim(),t=s.model.trim(),r=s.reasoningEffort.trim();if(e===``||t===``){g(``),m(`请选择完整的提供商与模型；只指定思考等级会覆盖项目规则里的模型`),T(`.srp-status.is-error`);return}n={provider:e,model:t,...r===``?{}:{reasoningEffort:r}}}let r=b.current,i=r?.invalidate(),o=()=>r===null||i===void 0||r.isCurrent(i);d(`save`),m(``),g(``);try{let r=await t.save(e,{mode:a,override:n});if(!o())return;y(r),g(a===`follow`?`已恢复跟随全局策略`:a===`inherit`?`已设置为强制继承主代理模型`:`已生效：下一次派活开始使用新配置`)}catch(e){o()&&(m(e instanceof Error?e.message:String(e)),T(`.srp-status.is-error`))}finally{o()&&d(null)}},O=async()=>{let n=b.current,r=n?.invalidate(),i=()=>n===null||r===void 0||n.isCurrent(r);d(`freeze`),m(``),g(``);try{let n=await t.freeze(e);if(!i())return;y(n),g(`已写入项目规则，并清除了本会话的临时指定`)}catch(e){i()&&(m(e instanceof Error?e.message:String(e)),T(`.srp-status.is-error`))}finally{i()&&d(null)}};if(n===null)return(0,i.createElement)(`div`,{className:`sr-panel`,"aria-busy":p===``},(0,i.createElement)(`style`,null,l),(0,i.createElement)(`div`,{className:`srp-head`},(0,i.createElement)(`div`,{className:`srp-head-text`},(0,i.createElement)(`h2`,{className:`srp-title`},`子代理模型`),(0,i.createElement)(`p`,{className:`srp-sub`},`控制本会话新派出的子代理。`))),(0,i.createElement)(`div`,{className:`srp-scroll`},p===``?[(0,i.createElement)(`div`,{key:`a`,className:`srp-skeleton`,style:{height:84}}),(0,i.createElement)(`div`,{key:`b`,className:`srp-skeleton`,style:{height:180}})]:[(0,i.createElement)(`p`,{key:`err`,className:`srp-status is-error`,role:`alert`},p),(0,i.createElement)(`div`,{key:`retry`,className:`srp-actions`},(0,i.createElement)(`button`,{type:`button`,className:`srp-btn is-primary`,onClick:()=>void S()},`重试`))]));let A=n.effective,j=A===void 0?v.inherit:v[A.source]??v.inherit,te=n.session!==void 0,M=u!==null||w,N=n.defaultPolicy===`inherit`?`全局策略为继承主代理，请先在设置页改为「使用路由规则」再固化。`:void 0,P=n.session?.mode===`custom`&&N===void 0,ne=(0,i.createElement)(`div`,{className:`srp-now${te?` is-session`:``}`},(0,i.createElement)(`div`,{className:`srp-now-top`},(0,i.createElement)(`span`,{className:`srp-now-label`},`当前生效`),(0,i.createElement)(`span`,{className:`srp-now-value`,title:x(A?.spec)},x(A?.spec)),(0,i.createElement)(`span`,{className:`srp-now-badge`},j.label)),(0,i.createElement)(`p`,{className:`srp-now-meta`,style:{margin:0}},A?.workspacePath===void 0?j.hint:`命中规则目录 ${A.workspacePath}。${j.hint}`),n.directory===void 0?(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`未能读取会话所在目录，项目规则无法匹配。`):(0,i.createElement)(`p`,{className:`srp-now-meta`,style:{margin:0}},`工作目录 ${n.directory}`),w?(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`插件当前已暂停，任何配置都不会生效。请在设置页重新启用。`):null,n.tableAvailable?null:(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},`路由表当前无法解析，项目规则暂不可用；本会话的临时指定仍然有效。`)),F=n.defaultPolicy===`inherit`?`全局：继承主代理模型`:`全局：按项目规则路由`,I=u===`save`?`保存中…`:a===`follow`?`跟随全局策略`:a===`inherit`?`应用继承`:`应用到此会话`,L=(0,i.createElement)(`div`,{className:`srp-card`},(0,i.createElement)(`div`,{className:`srp-card-head`},(0,i.createElement)(`h3`,{className:`srp-card-title`},`本会话配置`)),(0,i.createElement)(`div`,{className:`srp-modes`,role:`group`,"aria-label":`子代理配置来源`},(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`follow`,disabled:M,onClick:()=>E(`follow`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`跟随全局策略`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:F},F)),(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`inherit`,disabled:M,onClick:()=>E(`inherit`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`继承主代理`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:`强制继承主模型`},`只影响本会话`)),(0,i.createElement)(`button`,{type:`button`,className:`srp-mode`,"aria-pressed":a===`custom`,disabled:M,onClick:()=>E(`custom`)},(0,i.createElement)(`span`,{className:`srp-mode-name`},`指定一套`),(0,i.createElement)(`span`,{className:`srp-mode-desc`,title:`指定专属模型`},`只影响本会话`))),a===`custom`?(0,i.createElement)(_,{provider:s.provider,model:s.model,reasoningEffort:s.reasoningEffort,catalog:n.catalog,disabled:M,allowInherit:!1,allowManual:!1,classes:ee,onChange:e=>{c(e),g(``),m(``)}}):a===`inherit`?(0,i.createElement)(`p`,{className:`srp-hint`,style:{margin:0}},`已选强制继承：子代理将无条件直接复用主代理的模型与思考等级。`):(0,i.createElement)(`p`,{className:`srp-hint`,style:{margin:0}},n.workspace===void 0?n.defaultPolicy===`inherit`?`全局策略为继承主代理，当前没有指定本会话配置。`:`当前目录未命中项目规则，子代理将使用全局兜底配置或主模型。`:n.workspace.path===void 0?`使用全局兜底：${x(n.workspace.spec)}`:`命中项目规则：${x(n.workspace.spec)}`)),R=(0,i.createElement)(`div`,{className:`srp-footer`},(0,i.createElement)(`div`,{className:`srp-actions`},(0,i.createElement)(`button`,{type:`button`,className:`srp-btn is-primary`,disabled:M,onClick:()=>void D()},I),(0,i.createElement)(`button`,{type:`button`,className:`srp-btn`,disabled:M||!P,title:N??(P?`把本会话的指定写进项目路由规则`:`当前未自定义指定一套模型，无法固化`),onClick:()=>void O()},u===`freeze`?`固化中…`:`固化为项目规则`),(0,i.createElement)(`button`,{type:`button`,className:`srp-btn`,disabled:u!==null,onClick:()=>void S()},u===`load`?`读取中…`:`刷新`)),N&&n.session?.mode===`custom`?(0,i.createElement)(`p`,{className:`srp-hint is-warn`,style:{margin:0}},N):null,p?(0,i.createElement)(`p`,{className:`srp-status is-error`,role:`alert`},p):null,h?(0,i.createElement)(`p`,{className:`srp-status`,role:`status`},h):null);return(0,i.createElement)(`div`,{ref:f,className:`sr-panel`,"aria-busy":u!==null},(0,i.createElement)(`style`,null,l),(0,i.createElement)(`div`,{className:`srp-head`},(0,i.createElement)(`div`,{className:`srp-head-text`},(0,i.createElement)(`h2`,{className:`srp-title`},`子代理模型`),(0,i.createElement)(`p`,{className:`srp-sub`},`控制本会话新派出的子代理。已在运行的子代理保持原配置。`))),(0,i.createElement)(`div`,{className:`srp-scroll`},(0,i.createElement)(`div`,{className:`srp-layout`},(0,i.createElement)(`div`,{className:`srp-col-summary`},ne),(0,i.createElement)(`div`,{className:`srp-col-controls`},L))),R)}
/**
* @license React
* react-dom.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var j=r((t=>{var n=e("react");function r(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}var i=Symbol.for(`react.portal`),a=Symbol.for(`react.optimistic_key`);function o(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:i,key:r==null?null:r===a?a:``+r,children:e,containerInfo:t,implementation:n}}n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,t.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(r(299));return o(e,t,null,n)}})),te=r(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=j()}))();function M({sessionId:e,api:t=k,onClose:n}){let[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(`load`),[c,l]=(0,i.useState)(``),[d,f]=(0,i.useState)(``),[p,m]=(0,i.useState)(`home`),[h,g]=(0,i.useState)(``),[_,y]=(0,i.useState)(null),[b,S]=(0,i.useState)(!1),[w,T]=(0,i.useState)(``),[E,D]=(0,i.useState)(``),O=(0,i.useRef)(null),ee=(0,i.useRef)(null),A=(0,i.useCallback)(e=>{a(t=>e.catalog===void 0&&t?.catalog!==void 0&&t.sessionId===e.sessionId?{...e,catalog:t.catalog}:e)},[]);(0,i.useEffect)(()=>{let n=C(t,e,()=>({onSnapshot:A,onError:e=>l(e),onSettled:()=>s(null)}));O.current=n,a(null),l(``),f(``),m(`home`),g(``),S(!1),T(``),D(``),n.load();let r=n.subscribe(()=>{n.load({silent:!0})});return()=>{r(),n.invalidate(),O.current=null,ee.current!==null&&clearTimeout(ee.current)}},[t,A,e]);let j=(0,i.useCallback)(async(n,r,i,a)=>{if(o!==null)return;let c=O.current,u=c?.invalidate(),d=()=>c===null||u===void 0||c.isCurrent(u);s(`save`),l(``),f(``);try{let o=await t.save(e,{mode:n,override:r});if(!d())return;A(o),f(i),a?.(),ee.current!==null&&clearTimeout(ee.current),ee.current=setTimeout(()=>f(``),4e3)}catch(e){d()&&l(e instanceof Error?e.message:String(e))}finally{d()&&(s(null),y(null))}},[A,t,o,e]),te=r?.enabled===!1,M=o!==null||te;if(r===null)return(0,i.createElement)(`div`,{className:`srpop`,"aria-busy":!0},(0,i.createElement)(`style`,null,u),(0,i.createElement)(`div`,{className:`srpop-head`},(0,i.createElement)(`span`,{className:`srpop-title`},`子代理模型`),(0,i.createElement)(`button`,{type:`button`,className:`srpop-close`,"aria-label":`关闭面板`,onClick:n},`×`)),c===``?[(0,i.createElement)(`div`,{key:`a`,className:`srpop-skeleton`,style:{height:44,margin:`12px 14px 4px`}}),(0,i.createElement)(`div`,{key:`b`,className:`srpop-skeleton`,style:{height:140,margin:`8px 14px 14px`}})]:(0,i.createElement)(`div`,{className:`srpop-body`},(0,i.createElement)(`p`,{className:`srpop-error`,role:`alert`},c),(0,i.createElement)(`button`,{type:`button`,className:`srpop-primary`,onClick:()=>{s(`load`),l(``),O.current?.load()}},`重试`)));let N=r.effective,P=r.session,ne=(r.catalog??[]).filter(e=>e.models.length>0),F=P?.mode===`custom`,I=P?.mode===`inherit`,L=P===void 0,R=F?P.provider:void 0,z=F?P.model:void 0,re=F?P.reasoningEffort??``:``,B=F&&z!==void 0?ne.flatMap(e=>e.models.map(t=>({group:e,model:t}))).find(e=>e.model.id===z&&(R===void 0||e.group.id===R)):void 0,ie=B?.model.reasoning?.efforts??[],V=F&&R!==void 0&&z!==void 0&&B===void 0,H=h.trim().toLowerCase(),ae=ne.map(e=>{let t=e.name.toLowerCase().includes(H)||e.id.toLowerCase().includes(H),n=e.models.filter(e=>t||e.name.toLowerCase().includes(H)||e.id.toLowerCase().includes(H));return{...e,models:n}}).filter(e=>e.models.length>0),oe=(e,t,n)=>{M||F&&R===e&&z===t||j(`custom`,{provider:e,model:t,...n?{reasoningEffort:n}:{}},`已保存：${e} / ${t}`)},U=e=>{M||R===void 0||z===void 0||e===re||(y(e),j(`custom`,{provider:R,model:z,...e===``?{}:{reasoningEffort:e}},e===``?`已恢复模型默认思考档位`:`思考档位已切换至「${e}」`))},W=()=>{let e=w.trim(),t=E.trim();M||e===``||t===``||j(`custom`,{provider:e,model:t},`已保存手动输入模型 ${e} / ${t}`,()=>{S(!1),T(``),D(``)})};return(0,i.createElement)(`div`,{className:`srpop`,"aria-busy":o!==null},(0,i.createElement)(`style`,null,u),(0,i.createElement)(`div`,{className:`srpop-head`},(0,i.createElement)(`div`,{className:`srpop-head-start`},p===`select`?(0,i.createElement)(`button`,{type:`button`,className:`srpop-back`,"aria-label":`返回上一页`,disabled:o!==null,onClick:()=>{m(`home`),l(``)}},`‹ 返回`):null,(0,i.createElement)(`h3`,{className:`srpop-title`},p===`select`?`选择子代理模型`:`子代理模型`)),(0,i.createElement)(`button`,{type:`button`,className:`srpop-close`,"aria-label":`关闭面板`,onClick:n},`×`)),(0,i.createElement)(`div`,{className:`srpop-body`},p===`home`?(()=>{let e=x(N?.spec),t=N?.source??`inherit`,n=v[t]?.label??t,a=te?`插件总开关已关闭，任何配置均未生效。`:F?`本会话显式指定了配置，下一次派活优先使用此配置。`:I?`本会话强制继承主代理模型，不跟随项目路由规则。`:N?.source===`workspace`?`命中项目规则目录 ${N.workspacePath}。`:N?.source===`fallback`?`未命中项目规则，当前使用全局兜底配置。`:r.defaultPolicy===`inherit`?`跟随全局策略：当前全局策略为继承主代理，不应用项目规则。`:`跟随全局策略：未命中项目规则，子代理将继承主代理模型。`;return[(0,i.createElement)(`div`,{key:`current`,className:`srpop-current`},(0,i.createElement)(`div`,{key:`top`,className:`srpop-current-top`},(0,i.createElement)(`span`,{className:`srpop-current-label`},`当前实际生效`),(0,i.createElement)(`span`,{className:`srpop-current-badge`},n)),(0,i.createElement)(`div`,{key:`val`,className:`srpop-current-val`,title:e},e),(0,i.createElement)(`div`,{key:`sub`,className:`srpop-current-sub`},a)),(0,i.createElement)(`div`,{key:`modes`,className:`srpop-modes`,role:`group`,"aria-label":`子代理模型配置方式`},(0,i.createElement)(`button`,{key:`follow`,type:`button`,className:`srpop-mode`,"aria-pressed":L,disabled:M,onClick:()=>{M||L||j(`follow`,null,`已切换为跟随全局策略`)}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`跟随全局策略`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},`清除本会话覆盖，使用项目规则或全局默认`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},L?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)),(0,i.createElement)(`button`,{key:`inherit`,type:`button`,className:`srpop-mode`,"aria-pressed":I,disabled:M,onClick:()=>{M||I||j(`inherit`,null,`已设置为强制继承主代理模型`)}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`继承主代理`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},`子代理直接使用主会话模型，忽略路由规则`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},I?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)),(0,i.createElement)(`button`,{key:`custom`,type:`button`,className:`srpop-mode`,"aria-pressed":F,disabled:M,onClick:()=>{M||(m(`select`),l(``))}},(0,i.createElement)(`div`,{className:`srpop-mode-content`},(0,i.createElement)(`span`,{className:`srpop-mode-title`},`指定模型…`),(0,i.createElement)(`span`,{className:`srpop-mode-desc`},F?`已选：${x(P)}`:`从可用供应商中点选或手动输入`)),(0,i.createElement)(`div`,{className:`srpop-mode-tail`},F?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null,(0,i.createElement)(`span`,{className:`srpop-arrow`,"aria-hidden":`true`},`›`))))]})():(()=>{let e=F&&ie.length>1?(0,i.createElement)(`div`,{className:`srpop-efforts`,role:`group`,"aria-label":`思考档位`},(0,i.createElement)(`span`,{className:`srpop-efforts-label`},`思考档位`),[{id:``,name:`默认`},...ie].map(e=>(0,i.createElement)(`button`,{key:e.id===``?`__default__`:e.id,type:`button`,className:`srpop-effort`,"aria-pressed":(_??re)===e.id,disabled:M,onClick:()=>U(e.id)},e.name||e.id))):null,t=b?(0,i.createElement)(`form`,{className:`srpop-manual`,onSubmit:e=>{e.preventDefault(),W()}},(0,i.createElement)(`div`,{className:`srpop-manual-field`},(0,i.createElement)(`label`,{className:`srpop-label`,htmlFor:`srpop-manual-provider-input`},`提供商 (Provider)`),(0,i.createElement)(`input`,{id:`srpop-manual-provider-input`,className:`srpop-input`,placeholder:`例如 openai 或 anthropic`,value:w,disabled:M,onChange:e=>T(e.target.value)})),(0,i.createElement)(`div`,{className:`srpop-manual-field`},(0,i.createElement)(`label`,{className:`srpop-label`,htmlFor:`srpop-manual-model-input`},`模型标识 (Model)`),(0,i.createElement)(`input`,{id:`srpop-manual-model-input`,className:`srpop-input`,placeholder:`例如 gpt-4o 或 claude-3-5-sonnet`,value:E,disabled:M,onChange:e=>D(e.target.value)})),(0,i.createElement)(`div`,{className:`srpop-manual-actions`},(0,i.createElement)(`button`,{type:`submit`,className:`srpop-primary`,disabled:M||w.trim()===``||E.trim()===``},`保存并应用`),(0,i.createElement)(`button`,{type:`button`,className:`srpop-ghost`,onClick:()=>{S(!1)}},`取消`))):(0,i.createElement)(`button`,{type:`button`,className:`srpop-link`,disabled:M,onClick:()=>S(!0)},`+ 手动输入模型`);return[(0,i.createElement)(`div`,{key:`search`,className:`srpop-search-bar`},(0,i.createElement)(`input`,{className:`srpop-input`,type:`search`,placeholder:`搜索提供商或模型名称…`,"aria-label":`搜索模型`,value:h,disabled:M,onChange:e=>g(e.target.value)})),e,V?(0,i.createElement)(`div`,{key:`manual-active`,className:`srpop-manual-current`},(0,i.createElement)(`span`,{className:`srpop-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`srpop-item-name`,title:`${R} / ${z}`},`${R} / ${z} (手动输入)`),(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`)):null,ne.length===0?(0,i.createElement)(`p`,{key:`empty-cat`,className:`srpop-empty`},`未探测到可用的模型目录，请使用下方手动输入模型。`):ae.length===0?(0,i.createElement)(`p`,{key:`no-match`,className:`srpop-empty`},`未找到与「${h}」匹配的模型`):(0,i.createElement)(`div`,{key:`list`,className:`srpop-list`,role:`list`},ae.map(e=>(0,i.createElement)(`div`,{key:e.id,className:`srpop-group-wrap`},(0,i.createElement)(`div`,{className:`srpop-group`},(0,i.createElement)(`span`,{className:`srpop-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`srpop-group-name`,title:e.name||e.id},e.name||e.id)),e.models.map(t=>{let n=F&&z===t.id&&R===e.id,r=t.reasoning?.efforts?.length??0;return(0,i.createElement)(`button`,{key:t.id,type:`button`,className:`srpop-item`,"data-active":n?`true`:`false`,disabled:M,title:t.name||t.id,onClick:()=>oe(e.id,t.id,t.reasoning?.defaultEffort)},(0,i.createElement)(`span`,{className:`srpop-item-name`},t.name||t.id),r>1?(0,i.createElement)(`span`,{className:`srpop-badge`},`${r} 档`):null,n?(0,i.createElement)(`span`,{className:`srpop-check`,"aria-hidden":`true`},`✓`):null)})))),t]})(),c?(0,i.createElement)(`p`,{className:`srpop-error`,role:`alert`},c):null,d?(0,i.createElement)(`p`,{className:`srpop-notice`,role:`status`},d):null))}let N=new class{openedId=null;triggers=new Map;listeners=new Set;getOpenedSessionId(){return this.openedId}isOpen(e){return this.openedId===e}open(e,t){t&&this.triggers.set(e,t),this.openedId!==e&&(this.openedId=e,this.notify())}close(e,t){if(e!==void 0&&this.openedId!==e||this.openedId===null)return;let n=this.openedId,r=this.triggers.get(n);if(r!==void 0&&r.isConnected===!1&&this.triggers.delete(n),this.openedId=null,this.notify(),t?.restoreFocus!==!1&&r!==void 0&&typeof r.focus==`function`){let e=()=>{try{r.focus({preventScroll:!0})}catch{}};typeof requestAnimationFrame==`function`?requestAnimationFrame(e):e()}}toggle(e,t){t&&this.triggers.set(e,t),this.openedId===e?this.close(e):this.open(e,t)}getTrigger(e){return this.triggers.get(e)??null}unregisterTrigger(e,t){let n=this.triggers.get(e);n!==void 0&&(t==null||n===t)&&this.triggers.delete(e)}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}notify(){for(let e of this.listeners)try{e()}catch(e){console.error(`[subagent-routes] popover listener error`,e)}}};function P(e,t,n){let r=Math.max(0,Math.min(360,t.width-24)),i=Math.max(0,e.top-8-12),a=Math.max(0,t.height-e.bottom-8-12),o=n??(i>=240||i>=a?`top`:`bottom`);return{left:Math.max(12,Math.min(e.right-r,t.width-12-r)),width:r,maxHeight:Math.min(480,o===`top`?i:a),side:o,...o===`top`?{bottom:t.height-e.top+8}:{top:e.bottom+8}}}function ne(e){let t=N.getTrigger(e);if(t===null||!t.isConnected)return;let n=t.closest(`[data-composer-card]`);return n instanceof HTMLElement?n:t}function F({sessionId:e,api:t}){let[n,r]=(0,i.useState)(()=>N.isOpen(e)),a=(0,i.useRef)(null),[o,s]=(0,i.useState)(null);if((0,i.useEffect)(()=>{let t=()=>r(N.isOpen(e));return t(),N.subscribe(t)},[e]),(0,i.useLayoutEffect)(()=>{if(!n){s(null);return}let t,r=()=>{let n=ne(e);if(n===void 0){s(null);return}let r=P(n.getBoundingClientRect(),{width:window.innerWidth,height:window.innerHeight},t);t=r.side,s(e=>e!==null&&e.left===r.left&&e.top===r.top&&e.bottom===r.bottom&&e.width===r.width&&e.maxHeight===r.maxHeight?e:r)};r();let i=new ResizeObserver(r),a=ne(e);return a!==void 0&&i.observe(a),window.addEventListener(`resize`,r),window.addEventListener(`scroll`,r,!0),()=>{i.disconnect(),window.removeEventListener(`resize`,r),window.removeEventListener(`scroll`,r,!0)}},[n,e]),(0,i.useEffect)(()=>{if(!n)return;let t=!1,r,i=()=>{if(t)return;let e=a.current,n=e?.querySelector(`.srpop-mode[aria-pressed="true"]:not([disabled])`)??e?.querySelector(`.srpop-mode:not([disabled])`);n&&(n.focus({preventScroll:!0}),t=!0,r?.disconnect())},o=requestAnimationFrame(i);r=new MutationObserver(i),a.current&&r.observe(a.current,{childList:!0,subtree:!0});let s=t=>{t.key===`Escape`&&(t.preventDefault(),t.stopPropagation(),N.close(e,{restoreFocus:!0}))},c=t=>{let n=t.target;!n||a.current?.contains(n)||N.getTrigger(e)?.contains(n)||N.close(e,{restoreFocus:!1})};return window.addEventListener(`keydown`,s),window.addEventListener(`pointerdown`,c,!0),()=>{cancelAnimationFrame(o),r.disconnect(),window.removeEventListener(`keydown`,s),window.removeEventListener(`pointerdown`,c,!0)}},[n,e]),!n)return null;let c=(0,i.createElement)(`div`,{ref:a,className:`sr-popover-portal`,role:`dialog`,"aria-label":`子代理模型配置`,"aria-modal":`false`,"data-side":o?.side,style:{visibility:o===null?`hidden`:`visible`,boxSizing:`border-box`,minWidth:0,left:o?.left,top:o?.top,bottom:o?.bottom,width:o?.width,maxHeight:o?.maxHeight}},(0,i.createElement)(`style`,null,`
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
`),(0,i.createElement)(M,{key:e,sessionId:e,...t===void 0?{}:{api:t},onClose:()=>N.close(e,{restoreFocus:!0})}));return typeof document>`u`?c:(0,te.createPortal)(c,document.body)}function I({sessionId:e,onOpen:t,api:n=k}){let[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(()=>N.isOpen(e)),c=(0,i.useRef)(null);if((0,i.useEffect)(()=>{let t=()=>{s(N.isOpen(e))};return t(),N.subscribe(t)},[e]),(0,i.useEffect)(()=>{o&&c.current!==null&&N.open(e,c.current)},[e,o]),(0,i.useEffect)(()=>()=>{N.unregisterTrigger(e,c.current)},[e]),(0,i.useEffect)(()=>{let t=!0,r=0,i,o=()=>{let o=++r;i?.abort(),i=new AbortController,n.load(e,i.signal).then(e=>{t&&o===r&&a(e)}).catch(()=>{})};a(null);let s=n.subscribe?.(o);return o(),()=>{t=!1,s?.(),i?.abort()}},[n,e]),r===null)return null;let{label:l,sourceLabel:u,isOverride:d}=S(r);return(0,i.createElement)(i.Fragment,null,(0,i.createElement)(`style`,{key:`css`},`
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
`),(0,i.createElement)(`button`,{key:`chip`,ref:c,type:`button`,className:`sr-chip${d?` is-override`:``}${o?` is-open`:``}`,onClick:()=>{t?t():N.toggle(e,c.current)},title:`子代理：${l}（${u}）— 点击切换子代理配置`,"aria-label":`子代理当前使用 ${l}，来源${u}；点击切换子代理配置`,"aria-expanded":o,"aria-haspopup":`dialog`},(0,i.createElement)(`span`,{className:`sr-chip-dot`,"aria-hidden":`true`}),(0,i.createElement)(`span`,{className:`sr-chip-label`},`子 ${l}`),(0,i.createElement)(`span`,{className:`sr-chip-arrow`,"aria-hidden":`true`},o?`▴`:`▾`)))}let L=Symbol.for(`yaml.alias`),R=Symbol.for(`yaml.document`),z=Symbol.for(`yaml.map`),re=Symbol.for(`yaml.pair`),B=Symbol.for(`yaml.scalar`),ie=Symbol.for(`yaml.seq`),V=Symbol.for(`yaml.node.type`),H=e=>!!e&&typeof e==`object`&&e[V]===L,ae=e=>!!e&&typeof e==`object`&&e[V]===R,oe=e=>!!e&&typeof e==`object`&&e[V]===z,U=e=>!!e&&typeof e==`object`&&e[V]===re,W=e=>!!e&&typeof e==`object`&&e[V]===B,G=e=>!!e&&typeof e==`object`&&e[V]===ie;function K(e){if(e&&typeof e==`object`)switch(e[V]){case z:case ie:return!0}return!1}function q(e){if(e&&typeof e==`object`)switch(e[V]){case L:case z:case B:case ie:return!0}return!1}let se=e=>(W(e)||K(e))&&!!e.anchor,ce=Symbol(`break visit`),le=Symbol(`skip children`),ue=Symbol(`remove node`);function de(e,t){let n=pe(t);ae(e)?fe(null,e.contents,n,Object.freeze([e]))===ue&&(e.contents=null):fe(null,e,n,Object.freeze([]))}de.BREAK=ce,de.SKIP=le,de.REMOVE=ue;function fe(e,t,n,r){let i=me(e,t,n,r);if(q(i)||U(i))return he(e,r,i),fe(e,i,n,r);if(typeof i!=`symbol`){if(K(t)){r=Object.freeze(r.concat(t));for(let e=0;e<t.items.length;++e){let i=fe(e,t.items[e],n,r);if(typeof i==`number`)e=i-1;else if(i===ce)return ce;else i===ue&&(t.items.splice(e,1),--e)}}else if(U(t)){r=Object.freeze(r.concat(t));let e=fe(`key`,t.key,n,r);if(e===ce)return ce;e===ue&&(t.key=null);let i=fe(`value`,t.value,n,r);if(i===ce)return ce;i===ue&&(t.value=null)}}return i}function pe(e){return typeof e==`object`&&(e.Collection||e.Node||e.Value)?Object.assign({Alias:e.Node,Map:e.Node,Scalar:e.Node,Seq:e.Node},e.Value&&{Map:e.Value,Scalar:e.Value,Seq:e.Value},e.Collection&&{Map:e.Collection,Seq:e.Collection},e):e}function me(e,t,n,r){if(typeof n==`function`)return n(e,t,r);if(oe(t))return n.Map?.(e,t,r);if(G(t))return n.Seq?.(e,t,r);if(U(t))return n.Pair?.(e,t,r);if(W(t))return n.Scalar?.(e,t,r);if(H(t))return n.Alias?.(e,t,r)}function he(e,t,n){let r=t[t.length-1];if(K(r))r.items[e]=n;else if(U(r))e===`key`?r.key=n:r.value=n;else if(ae(r))r.contents=n;else{let e=H(r)?`alias`:`scalar`;throw Error(`Cannot replace node with ${e} parent`)}}let ge={"!":`%21`,",":`%2C`,"[":`%5B`,"]":`%5D`,"{":`%7B`,"}":`%7D`},_e=e=>e.replace(/[!,[\]{}]/g,e=>ge[e]);var ve=class e{constructor(t,n){this.docStart=null,this.docEnd=!1,this.yaml=Object.assign({},e.defaultYaml,t),this.tags=Object.assign({},e.defaultTags,n)}clone(){let t=new e(this.yaml,this.tags);return t.docStart=this.docStart,t}atDocument(){let t=new e(this.yaml,this.tags);switch(this.yaml.version){case`1.1`:this.atNextDocument=!0;break;case`1.2`:this.atNextDocument=!1,this.yaml={explicit:e.defaultYaml.explicit,version:`1.2`},this.tags=Object.assign({},e.defaultTags)}return t}add(t,n){this.atNextDocument&&=(this.yaml={explicit:e.defaultYaml.explicit,version:`1.1`},this.tags=Object.assign({},e.defaultTags),!1);let r=t.trim().split(/[ \t]+/),i=r.shift();switch(i){case`%TAG`:{if(r.length!==2&&(n(0,`%TAG directive should contain exactly two parts`),r.length<2))return!1;let[e,t]=r;return this.tags[e]=t,!0}case`%YAML`:{if(this.yaml.explicit=!0,r.length!==1)return n(0,`%YAML directive should contain exactly one part`),!1;let[e]=r;if(e===`1.1`||e===`1.2`)return this.yaml.version=e,!0;{let t=/^\d+\.\d+$/.test(e);return n(6,`Unsupported YAML version ${e}`,t),!1}}default:return n(0,`Unknown directive ${i}`,!0),!1}}tagName(e,t){if(e===`!`)return`!`;if(e[0]!==`!`)return t(`Not a valid tag: ${e}`),null;if(e[1]===`<`){let n=e.slice(2,-1);return n===`!`||n===`!!`?(t(`Verbatim tags aren't resolved, so ${e} is invalid.`),null):(e[e.length-1]!==`>`&&t(`Verbatim tags must end with a >`),n)}let[,n,r]=e.match(/^(.*!)([^!]*)$/s);r||t(`The ${e} tag has no suffix`);let i=this.tags[n];if(i)try{return i+decodeURIComponent(r)}catch(e){return t(String(e)),null}return n===`!`?e:(t(`Could not resolve tag: ${e}`),null)}tagString(e){for(let[t,n]of Object.entries(this.tags))if(e.startsWith(n))return t+_e(e.substring(n.length));return e[0]===`!`?e:`!<${e}>`}toString(e){let t=this.yaml.explicit?[`%YAML ${this.yaml.version||`1.2`}`]:[],n=Object.entries(this.tags),r;if(e&&n.length>0&&q(e.contents)){let t={};de(e.contents,(e,n)=>{q(n)&&n.tag&&(t[n.tag]=!0)}),r=Object.keys(t)}else r=[];for(let[i,a]of n)i===`!!`&&a===`tag:yaml.org,2002:`||e&&!r.some(e=>e.startsWith(a))||t.push(`%TAG ${i} ${a}`);return t.join(`
`)}};ve.defaultYaml={explicit:!1,version:`1.2`},ve.defaultTags={"!!":`tag:yaml.org,2002:`};function ye(e){if(/[\x00-\x19\s,[\]{}]/.test(e)){let t=`Anchor must not contain whitespace or control characters: ${JSON.stringify(e)}`;throw Error(t)}return!0}function be(e){let t=new Set;return de(e,{Value(e,n){n.anchor&&t.add(n.anchor)}}),t}function xe(e,t){for(let n=1;;++n){let r=`${e}${n}`;if(!t.has(r))return r}}function Se(e,t){let n=[],r=new Map,i=null;return{onAnchor:r=>{n.push(r),i??=be(e);let a=xe(t,i);return i.add(a),a},setAnchors:()=>{for(let e of n){let t=r.get(e);if(typeof t==`object`&&t.anchor&&(W(t.node)||K(t.node)))t.node.anchor=t.anchor;else{let t=Error(`Failed to resolve repeated object (this should not happen)`);throw t.source=e,t}}},sourceObjects:r}}function Ce(e,t,n,r){if(r&&typeof r==`object`){if(Array.isArray(r))for(let t=0,n=r.length;t<n;++t){let n=r[t],i=Ce(e,r,String(t),n);i===void 0?delete r[t]:i!==n&&(r[t]=i)}else if(r instanceof Map)for(let t of Array.from(r.keys())){let n=r.get(t),i=Ce(e,r,t,n);i===void 0?r.delete(t):i!==n&&r.set(t,i)}else if(r instanceof Set)for(let t of Array.from(r)){let n=Ce(e,r,t,t);n===void 0?r.delete(t):n!==t&&(r.delete(t),r.add(n))}else for(let[t,n]of Object.entries(r)){let i=Ce(e,r,t,n);i===void 0?delete r[t]:i!==n&&(r[t]=i)}}return e.call(t,n,r)}function J(e,t,n){if(Array.isArray(e))return e.map((e,t)=>J(e,String(t),n));if(e&&typeof e.toJSON==`function`){if(!n||!se(e))return e.toJSON(t,n);let r={aliasCount:0,count:1,res:void 0};n.anchors.set(e,r),n.onCreate=e=>{r.res=e,delete n.onCreate};let i=e.toJSON(t,n);return n.onCreate&&n.onCreate(i),i}return typeof e==`bigint`&&!n?.keep?Number(e):e}var we=class{constructor(e){Object.defineProperty(this,V,{value:e})}clone(){let e=Object.create(Object.getPrototypeOf(this),Object.getOwnPropertyDescriptors(this));return this.range&&(e.range=this.range.slice()),e}toJS(e,{mapAsMap:t,maxAliasCount:n,onAnchor:r,reviver:i}={}){if(!ae(e))throw TypeError(`A document argument is required`);let a={anchors:new Map,doc:e,keep:!0,mapAsMap:t===!0,mapKeyWarned:!1,maxAliasCount:typeof n==`number`?n:100},o=J(this,``,a);if(typeof r==`function`)for(let{count:e,res:t}of a.anchors.values())r(t,e);return typeof i==`function`?Ce(i,{"":o},``,o):o}},Te=class extends we{constructor(e){super(L),this.source=e,Object.defineProperty(this,"tag",{set(){throw Error(`Alias nodes cannot have tags`)}})}resolve(e,t){if(t?.maxAliasCount===0)throw ReferenceError(`Alias resolution is disabled`);let n;t?.aliasResolveCache?n=t.aliasResolveCache:(n=[],de(e,{Node:(e,t)=>{(H(t)||se(t))&&n.push(t)}}),t&&(t.aliasResolveCache=n));let r;for(let e of n){if(e===this)break;e.anchor===this.source&&(r=e)}if(r&&t){let{anchors:e,doc:n,maxAliasCount:i}=t,a=e.get(r);if(a||=(J(r,null,t),e.get(r)),a?.res===void 0)throw ReferenceError(`This should not happen: Alias anchor was not resolved?`);if(i>=0&&(a.count+=1,a.aliasCount===0&&(a.aliasCount=Ee(n,r,e)),a.count*a.aliasCount>i))throw ReferenceError(`Excessive alias count indicates a resource exhaustion attack`)}return r}toJSON(e,t){if(!t)return{source:this.source};let n=this.resolve(t.doc,t);if(!n){let e=`Unresolved alias (the anchor must be set before the alias): ${this.source}`;throw ReferenceError(e)}return t.anchors.get(n).res}toString(e,t,n){let r=`*${this.source}`;if(e){if(ye(this.source),e.options.verifyAliasOrder&&!e.anchors.has(this.source)){let e=`Unresolved alias (the anchor must be set before the alias): ${this.source}`;throw Error(e)}if(e.implicitKey)return`${r} `}return r}};function Ee(e,t,n){if(H(t)){let r=t.resolve(e),i=n&&r&&n.get(r);return i?i.count*i.aliasCount:0}if(K(t)){let r=0;for(let i of t.items){let t=Ee(e,i,n);t>r&&(r=t)}return r}if(U(t)){let r=Ee(e,t.key,n),i=Ee(e,t.value,n);return Math.max(r,i)}return 1}let De=e=>!e||typeof e!=`function`&&typeof e!=`object`;var Y=class extends we{constructor(e){super(B),this.value=e}toJSON(e,t){return t?.keep?this.value:J(this.value,e,t)}toString(){return String(this.value)}};Y.BLOCK_FOLDED=`BLOCK_FOLDED`,Y.BLOCK_LITERAL=`BLOCK_LITERAL`,Y.PLAIN=`PLAIN`,Y.QUOTE_DOUBLE=`QUOTE_DOUBLE`,Y.QUOTE_SINGLE=`QUOTE_SINGLE`;function Oe(e,t,n){if(t){let e=n.filter(e=>e.tag===t),r=e.find(e=>!e.format)??e[0];if(!r)throw Error(`Tag ${t} not found`);return r}return n.find(t=>t.identify?.(e)&&!t.format)}function ke(e,t,n){if(ae(e)&&(e=e.contents),q(e))return e;if(U(e)){let t=n.schema[z].createNode?.(n.schema,null,n);return t.items.push(e),t}(e instanceof String||e instanceof Number||e instanceof Boolean||typeof BigInt<`u`&&e instanceof BigInt)&&(e=e.valueOf());let{aliasDuplicateObjects:r,onAnchor:i,onTagObj:a,schema:o,sourceObjects:s}=n,c;if(r&&e&&typeof e==`object`){if(c=s.get(e),c)return c.anchor??(c.anchor=i(e)),new Te(c.anchor);c={anchor:null,node:null},s.set(e,c)}t?.startsWith(`!!`)&&(t=`tag:yaml.org,2002:`+t.slice(2));let l=Oe(e,t,o.tags);if(!l){if(e&&typeof e.toJSON==`function`&&(e=e.toJSON()),!e||typeof e!=`object`){let t=new Y(e);return c&&(c.node=t),t}l=e instanceof Map?o[z]:Symbol.iterator in Object(e)?o[ie]:o[z]}a&&(a(l),delete n.onTagObj);let u=l?.createNode?l.createNode(n.schema,e,n):typeof l?.nodeClass?.from==`function`?l.nodeClass.from(n.schema,e,n):new Y(e);return t?u.tag=t:l.default||(u.tag=l.tag),c&&(c.node=u),u}function Ae(e,t,n){let r=n;for(let e=t.length-1;e>=0;--e){let n=t[e];if(typeof n==`number`&&Number.isInteger(n)&&n>=0){let e=[];e[n]=r,r=e}else r=new Map([[n,r]])}return ke(r,void 0,{aliasDuplicateObjects:!1,keepUndefined:!1,onAnchor:()=>{throw Error(`This should not happen, please report a bug.`)},schema:e,sourceObjects:new Map})}let je=e=>e==null||typeof e==`object`&&!!e[Symbol.iterator]().next().done;var Me=class extends we{constructor(e,t){super(e),Object.defineProperty(this,"schema",{value:t,configurable:!0,enumerable:!1,writable:!0})}clone(e){let t=Object.create(Object.getPrototypeOf(this),Object.getOwnPropertyDescriptors(this));return e&&(t.schema=e),t.items=t.items.map(t=>q(t)||U(t)?t.clone(e):t),this.range&&(t.range=this.range.slice()),t}addIn(e,t){if(je(e))this.add(t);else{let[n,...r]=e,i=this.get(n,!0);if(K(i))i.addIn(r,t);else if(i===void 0&&this.schema)this.set(n,Ae(this.schema,r,t));else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`)}}deleteIn(e){let[t,...n]=e;if(n.length===0)return this.delete(t);let r=this.get(t,!0);if(K(r))return r.deleteIn(n);throw Error(`Expected YAML collection at ${t}. Remaining path: ${n}`)}getIn(e,t){let[n,...r]=e,i=this.get(n,!0);return r.length===0?!t&&W(i)?i.value:i:K(i)?i.getIn(r,t):void 0}hasAllNullValues(e){return this.items.every(t=>{if(!U(t))return!1;let n=t.value;return n==null||e&&W(n)&&n.value==null&&!n.commentBefore&&!n.comment&&!n.tag})}hasIn(e){let[t,...n]=e;if(n.length===0)return this.has(t);let r=this.get(t,!0);return K(r)?r.hasIn(n):!1}setIn(e,t){let[n,...r]=e;if(r.length===0)this.set(n,t);else{let e=this.get(n,!0);if(K(e))e.setIn(r,t);else if(e===void 0&&this.schema)this.set(n,Ae(this.schema,r,t));else throw Error(`Expected YAML collection at ${n}. Remaining path: ${r}`)}}};let Ne=e=>e.replace(/^(?!$)(?: $)?/gm,`#`);function Pe(e,t){return/^\n+$/.test(e)?e.substring(1):t?e.replace(/^(?! *$)/gm,t):e}let Fe=(e,t,n)=>e.endsWith(`
`)?Pe(n,t):n.includes(`
`)?`
`+Pe(n,t):(e.endsWith(` `)?``:` `)+n,Ie=`flow`;function Le(e,t,n=`flow`,{indentAtStart:r,lineWidth:i=80,minContentWidth:a=20,onFold:o,onOverflow:s}={}){if(!i||i<0)return e;i<a&&(a=0);let c=Math.max(1+a,1+i-t.length);if(e.length<=c)return e;let l=[],u={},d=i-t.length;typeof r==`number`&&(r>i-Math.max(2,a)?l.push(0):d=i-r);let f,p,m=!1,h=-1,g=-1,_=-1;n===`block`&&(h=Re(e,h,t.length),h!==-1&&(d=h+c));for(let r;r=e[h+=1];){if(n===`quoted`&&r===`\\`){switch(g=h,e[h+1]){case`x`:h+=3;break;case`u`:h+=5;break;case`U`:h+=9;break;default:h+=1}_=h}if(r===`
`)n===`block`&&(h=Re(e,h,t.length)),d=h+t.length+c,f=void 0;else{if(r===` `&&p&&p!==` `&&p!==`
`&&p!==`	`){let t=e[h+1];t&&t!==` `&&t!==`
`&&t!==`	`&&(f=h)}if(h>=d){if(f)l.push(f),d=f+c,f=void 0;else if(n===`quoted`){for(;p===` `||p===`	`;)p=r,r=e[h+=1],m=!0;let t=h>_+1?h-2:g-1;if(u[t])return e;l.push(t),u[t]=!0,d=t+c,f=void 0}else m=!0}}p=r}if(m&&s&&s(),l.length===0)return e;o&&o();let v=e.slice(0,l[0]);for(let r=0;r<l.length;++r){let i=l[r],a=l[r+1]||e.length;i===0?v=`\n${t}${e.slice(0,a)}`:(n===`quoted`&&u[i]&&(v+=`${e[i]}\\`),v+=`\n${t}${e.slice(i+1,a)}`)}return v}function Re(e,t,n){let r=t,i=t+1,a=e[i];for(;a===` `||a===`	`;)if(t<i+n)a=e[++t];else{do a=e[++t];while(a&&a!==`
`);r=t,i=t+1,a=e[i]}return r}let ze=(e,t)=>({indentAtStart:t?e.indent.length:e.indentAtStart,lineWidth:e.options.lineWidth,minContentWidth:e.options.minContentWidth}),Be=e=>/^(%|---|\.\.\.)/m.test(e);function Ve(e,t,n){if(!t||t<0)return!1;let r=t-n,i=e.length;if(i<=r)return!1;for(let t=0,n=0;t<i;++t)if(e[t]===`
`){if(t-n>r)return!0;if(n=t+1,i-n<=r)return!1}return!0}function He(e,t){let n=JSON.stringify(e);if(t.options.doubleQuotedAsJSON)return n;let{implicitKey:r}=t,i=t.options.doubleQuotedMinMultiLineLength,a=t.indent||(Be(e)?`  `:``),o=``,s=0;for(let e=0,t=n[e];t;t=n[++e])if(t===` `&&n[e+1]===`\\`&&n[e+2]===`n`&&(o+=n.slice(s,e)+`\\ `,e+=1,s=e,t=`\\`),t===`\\`)switch(n[e+1]){case`u`:{o+=n.slice(s,e);let t=n.substr(e+2,4);switch(t){case`0000`:o+=`\\0`;break;case`0007`:o+=`\\a`;break;case`000b`:o+=`\\v`;break;case`001b`:o+=`\\e`;break;case`0085`:o+=`\\N`;break;case`00a0`:o+=`\\_`;break;case`2028`:o+=`\\L`;break;case`2029`:o+=`\\P`;break;default:t.substr(0,2)===`00`?o+=`\\x`+t.substr(2):o+=n.substr(e,6)}e+=5,s=e+1}break;case`n`:if(r||n[e+2]===`"`||n.length<i)e+=1;else{for(o+=n.slice(s,e)+`

`;n[e+2]===`\\`&&n[e+3]===`n`&&n[e+4]!==`"`;)o+=`
`,e+=2;o+=a,n[e+2]===` `&&(o+=`\\`),e+=1,s=e+1}break;default:e+=1}return o=s?o+n.slice(s):n,r?o:Le(o,a,`quoted`,ze(t,!1))}function Ue(e,t){if(t.options.singleQuote===!1||t.implicitKey&&e.includes(`
`)||/[ \t]\n|\n[ \t]/.test(e))return He(e,t);let n=t.indent||(Be(e)?`  `:``),r=`'`+e.replace(/'/g,`''`).replace(/\n+/g,`$&\n${n}`)+`'`;return t.implicitKey?r:Le(r,n,Ie,ze(t,!1))}function We(e,t){let{singleQuote:n}=t.options,r;if(n===!1)r=He;else{let t=e.includes(`"`),i=e.includes(`'`);r=t&&!i?Ue:i&&!t?He:n?Ue:He}return r(e,t)}let Ge;try{Ge=RegExp(`(^|(?<!
))
+(?!
|$)`,`g`)}catch{Ge=/\n+(?!\n|$)/g}function Ke({comment:e,type:t,value:n},r,i,a){let{blockQuote:o,commentString:s,lineWidth:c}=r.options;if(!o||/\n[\t ]+$/.test(n))return We(n,r);let l=r.indent||(r.forceBlockIndent||Be(n)?`  `:``),u=o===`literal`?!0:o===`folded`||t===Y.BLOCK_FOLDED?!1:t===Y.BLOCK_LITERAL||!Ve(n,c,l.length);if(!n)return u?`|
`:`>
`;let d,f;for(f=n.length;f>0;--f){let e=n[f-1];if(e!==`
`&&e!==`	`&&e!==` `)break}let p=n.substring(f),m=p.indexOf(`
`);m===-1?d=`-`:n===p||m!==p.length-1?(d=`+`,a&&a()):d=``,p&&=(n=n.slice(0,-p.length),p[p.length-1]===`
`&&(p=p.slice(0,-1)),p.replace(Ge,`$&${l}`));let h=!1,g,_=-1;for(g=0;g<n.length;++g){let e=n[g];if(e===` `)h=!0;else if(e===`
`)_=g;else break}let v=n.substring(0,_<g?_+1:g);v&&=(n=n.substring(v.length),v.replace(/\n+/g,`$&${l}`));let y=(h?l?`2`:`1`:``)+d;if(e&&(y+=` `+s(e.replace(/ ?[\r\n]+/g,` `)),i&&i()),!u){let e=n.replace(/\n+/g,`
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g,`$1$2`).replace(/\n+/g,`$&${l}`),i=!1,a=ze(r,!0);o!==`folded`&&t!==Y.BLOCK_FOLDED&&(a.onOverflow=()=>{i=!0});let s=Le(`${v}${e}${p}`,l,`block`,a);if(!i)return`>${y}\n${l}${s}`}return n=n.replace(/\n+/g,`$&${l}`),`|${y}\n${l}${v}${n}${p}`}function qe(e,t,n,r){let{type:i,value:a}=e,{actualString:o,implicitKey:s,indent:c,indentStep:l,inFlow:u}=t;if(s&&a.includes(`
`)||u&&/[[\]{},]/.test(a))return We(a,t);if(/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(a))return s||u||!a.includes(`
`)?We(a,t):Ke(e,t,n,r);if(!s&&!u&&i!==Y.PLAIN&&a.includes(`
`))return Ke(e,t,n,r);if(Be(a)){if(c===``)return t.forceBlockIndent=!0,Ke(e,t,n,r);if(s&&c===l)return We(a,t)}let d=a.replace(/\n+/g,`$&\n${c}`);if(o){let e=e=>e.default&&e.tag!==`tag:yaml.org,2002:str`&&e.test?.test(d),{compat:n,tags:r}=t.doc.schema;if(r.some(e)||n?.some(e))return We(a,t)}return s?d:Le(d,c,Ie,ze(t,!1))}function Je(e,t,n,r){let{implicitKey:i,inFlow:a}=t,o=typeof e.value==`string`?e:Object.assign({},e,{value:String(e.value)}),{type:s}=e;s!==Y.QUOTE_DOUBLE&&/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(o.value)&&(s=Y.QUOTE_DOUBLE);let c=e=>{switch(e){case Y.BLOCK_FOLDED:case Y.BLOCK_LITERAL:return i||a?We(o.value,t):Ke(o,t,n,r);case Y.QUOTE_DOUBLE:return He(o.value,t);case Y.QUOTE_SINGLE:return Ue(o.value,t);case Y.PLAIN:return qe(o,t,n,r);default:return null}},l=c(s);if(l===null){let{defaultKeyType:e,defaultStringType:n}=t.options,r=i&&e||n;if(l=c(r),l===null)throw Error(`Unsupported default string type ${r}`)}return l}function Ye(e,t){let n=Object.assign({blockQuote:!0,commentString:Ne,defaultKeyType:null,defaultStringType:`PLAIN`,directives:null,doubleQuotedAsJSON:!1,doubleQuotedMinMultiLineLength:40,falseStr:`false`,flowCollectionPadding:!0,indentSeq:!0,lineWidth:80,minContentWidth:20,nullStr:`null`,simpleKeys:!1,singleQuote:null,trailingComma:!1,trueStr:`true`,verifyAliasOrder:!0},e.schema.toStringOptions,t),r;switch(n.collectionStyle){case`block`:r=!1;break;case`flow`:r=!0;break;default:r=null}return{anchors:new Set,doc:e,flowCollectionPadding:n.flowCollectionPadding?` `:``,indent:``,indentStep:typeof n.indent==`number`?` `.repeat(n.indent):`  `,inFlow:r,options:n}}function Xe(e,t){if(t.tag){let n=e.filter(e=>e.tag===t.tag);if(n.length>0)return n.find(e=>e.format===t.format)??n[0]}let n,r;if(W(t)){r=t.value;let i=e.filter(e=>e.identify?.(r));if(i.length>1){let e=i.filter(e=>e.test);e.length>0&&(i=e)}n=i.find(e=>e.format===t.format)??i.find(e=>!e.format)}else r=t,n=e.find(e=>e.nodeClass&&r instanceof e.nodeClass);if(!n){let e=r?.constructor?.name??(r===null?`null`:typeof r);throw Error(`Tag not resolved for ${e} value`)}return n}function Ze(e,t,{anchors:n,doc:r}){if(!r.directives)return``;let i=[],a=(W(e)||K(e))&&e.anchor;a&&ye(a)&&(n.add(a),i.push(`&${a}`));let o=e.tag??(t.default?null:t.tag);return o&&i.push(r.directives.tagString(o)),i.join(` `)}function Qe(e,t,n,r){if(U(e))return e.toString(t,n,r);if(H(e)){if(t.doc.directives)return e.toString(t);if(t.resolvedAliases?.has(e))throw TypeError(`Cannot stringify circular structure without alias nodes`);t.resolvedAliases?t.resolvedAliases.add(e):t.resolvedAliases=new Set([e]),e=e.resolve(t.doc)}let i,a=q(e)?e:t.doc.createNode(e,{onTagObj:e=>i=e});i??=Xe(t.doc.schema.tags,a);let o=Ze(a,i,t);o.length>0&&(t.indentAtStart=(t.indentAtStart??0)+o.length+1);let s=typeof i.stringify==`function`?i.stringify(a,t,n,r):W(a)?Je(a,t,n,r):a.toString(t,n,r);return o?W(a)||s[0]===`{`||s[0]===`[`?`${o} ${s}`:`${o}\n${t.indent}${s}`:s}function $e({key:e,value:t},n,r,i){let{allNullValues:a,doc:o,indent:s,indentStep:c,options:{commentString:l,indentSeq:u,simpleKeys:d}}=n,f=q(e)&&e.comment||null;if(d){if(f)throw Error(`With simple keys, key nodes cannot have comments`);if(K(e)||!q(e)&&typeof e==`object`)throw Error(`With simple keys, collection cannot be used as a key value`)}let p=!d&&(!e||f&&t==null&&!n.inFlow||K(e)||(W(e)?e.type===Y.BLOCK_FOLDED||e.type===Y.BLOCK_LITERAL:typeof e==`object`));n=Object.assign({},n,{allNullValues:!1,implicitKey:!p&&(d||!a),indent:s+c});let m=!1,h=!1,g=Qe(e,n,()=>m=!0,()=>h=!0);if(!p&&!n.inFlow&&g.length>1024){if(d)throw Error(`With simple keys, single line scalar must not span more than 1024 characters`);p=!0}if(n.inFlow){if(a||t==null)return m&&r&&r(),g===``?`?`:p?`? ${g}`:g}else if(a&&!d||t==null&&p)return g=`? ${g}`,f&&!m?g+=Fe(g,n.indent,l(f)):h&&i&&i(),g;m&&(f=null),p?(f&&(g+=Fe(g,n.indent,l(f))),g=`? ${g}\n${s}:`):(g=`${g}:`,f&&(g+=Fe(g,n.indent,l(f))));let _,v,y;q(t)?(_=!!t.spaceBefore,v=t.commentBefore,y=t.comment):(_=!1,v=null,y=null,t&&typeof t==`object`&&(t=o.createNode(t))),n.implicitKey=!1,!p&&!f&&W(t)&&(n.indentAtStart=g.length+1),h=!1,!u&&c.length>=2&&!n.inFlow&&!p&&G(t)&&!t.flow&&!t.tag&&!t.anchor&&(n.indent=n.indent.substring(2));let b=!1,x=Qe(t,n,()=>b=!0,()=>h=!0),S=` `;if(f||_||v){if(S=_?`
`:``,v){let e=l(v);S+=`\n${Pe(e,n.indent)}`}x===``&&!n.inFlow?S===`
`&&y&&(S=`

`):S+=`\n${n.indent}`}else if(!p&&K(t)){let e=x[0],r=x.indexOf(`
`),i=r!==-1,a=n.inFlow??t.flow??t.items.length===0;if(i||!a){let t=!1;if(i&&(e===`&`||e===`!`)){let n=x.indexOf(` `);e===`&`&&n!==-1&&n<r&&x[n+1]===`!`&&(n=x.indexOf(` `,n+1)),(n===-1||r<n)&&(t=!0)}t||(S=`\n${n.indent}`)}}else(x===``||x[0]===`
`)&&(S=``);return g+=S+x,n.inFlow?b&&r&&r():y&&!b?g+=Fe(g,n.indent,l(y)):h&&i&&i(),g}function et(e,t){(e===`debug`||e===`warn`)&&console.warn(t)}let tt={identify:e=>e===`<<`||typeof e==`symbol`&&e.description===`<<`,default:`key`,tag:`tag:yaml.org,2002:merge`,test:/^<<$/,resolve:()=>Object.assign(new Y(Symbol(`<<`)),{addToJSMap:rt}),stringify:()=>`<<`},nt=(e,t)=>(tt.identify(t)||W(t)&&(!t.type||t.type===Y.PLAIN)&&tt.identify(t.value))&&e?.doc.schema.tags.some(e=>e.tag===tt.tag&&e.default);function rt(e,t,n){let r=at(e,n);if(G(r))for(let n of r.items)it(e,t,n);else if(Array.isArray(r))for(let n of r)it(e,t,n);else it(e,t,r)}function it(e,t,n){let r=at(e,n);if(!oe(r))throw Error(`Merge sources must be maps or map aliases`);let i=r.toJSON(null,e,Map);for(let[e,n]of i)t instanceof Map?t.has(e)||t.set(e,n):t instanceof Set?t.add(e):Object.prototype.hasOwnProperty.call(t,e)||Object.defineProperty(t,e,{value:n,writable:!0,enumerable:!0,configurable:!0});return t}function at(e,t){return e&&H(t)?t.resolve(e.doc,e):t}function ot(e,t,{key:n,value:r}){if(q(n)&&n.addToJSMap)n.addToJSMap(e,t,r);else if(nt(e,n))rt(e,t,r);else{let i=J(n,``,e);if(t instanceof Map)t.set(i,J(r,i,e));else if(t instanceof Set)t.add(i);else{let a=st(n,i,e),o=J(r,a,e);a in t?Object.defineProperty(t,a,{value:o,writable:!0,enumerable:!0,configurable:!0}):t[a]=o}}return t}function st(e,t,n){if(t===null)return``;if(typeof t!=`object`)return String(t);if(q(e)&&n?.doc){let t=Ye(n.doc,{});t.anchors=new Set;for(let e of n.anchors.keys())t.anchors.add(e.anchor);t.inFlow=!0,t.inStringifyKey=!0;let r=e.toString(t);if(!n.mapKeyWarned){let e=JSON.stringify(r);e.length>40&&(e=e.substring(0,36)+`..."`),et(n.doc.options.logLevel,`Keys with collection values will be stringified due to JS Object restrictions: ${e}. Set mapAsMap: true to use object keys.`),n.mapKeyWarned=!0}return r}return JSON.stringify(t)}function ct(e,t,n){return new X(ke(e,void 0,n),ke(t,void 0,n))}var X=class e{constructor(e,t=null){Object.defineProperty(this,V,{value:re}),this.key=e,this.value=t}clone(t){let{key:n,value:r}=this;return q(n)&&(n=n.clone(t)),q(r)&&(r=r.clone(t)),new e(n,r)}toJSON(e,t){return ot(t,t?.mapAsMap?new Map:{},this)}toString(e,t,n){return e?.doc?$e(this,e,t,n):JSON.stringify(this)}};function lt(e,t,n){return(t.inFlow??e.flow?dt:ut)(e,t,n)}function ut({comment:e,items:t},n,{blockItemPrefix:r,flowChars:i,itemIndent:a,onChompKeep:o,onComment:s}){let{indent:c,options:{commentString:l}}=n,u=Object.assign({},n,{indent:a,type:null}),d=!1,f=[];for(let e=0;e<t.length;++e){let i=t[e],o=null;if(q(i))!d&&i.spaceBefore&&f.push(``),ft(n,f,i.commentBefore,d),i.comment&&(o=i.comment);else if(U(i)){let e=q(i.key)?i.key:null;e&&(!d&&e.spaceBefore&&f.push(``),ft(n,f,e.commentBefore,d))}d=!1;let s=Qe(i,u,()=>o=null,()=>d=!0);o&&(s+=Fe(s,a,l(o))),d&&o&&(d=!1),f.push(r+s)}let p;if(f.length===0)p=i.start+i.end;else{p=f[0];for(let e=1;e<f.length;++e){let t=f[e];p+=t?`\n${c}${t}`:`
`}}return e?(p+=`
`+Pe(l(e),c),s&&s()):d&&o&&o(),p}function dt({items:e},t,{flowChars:n,itemIndent:r}){let{indent:i,indentStep:a,flowCollectionPadding:o,options:{commentString:s}}=t;r+=a;let c=Object.assign({},t,{indent:r,inFlow:!0,type:null}),l=!1,u=0,d=[];for(let n=0;n<e.length;++n){let i=e[n],a=null;if(q(i))i.spaceBefore&&d.push(``),ft(t,d,i.commentBefore,!1),i.comment&&(a=i.comment);else if(U(i)){let e=q(i.key)?i.key:null;e&&(e.spaceBefore&&d.push(``),ft(t,d,e.commentBefore,!1),e.comment&&(l=!0));let n=q(i.value)?i.value:null;n?(n.comment&&(a=n.comment),n.commentBefore&&(l=!0)):i.value==null&&e?.comment&&(a=e.comment)}a&&(l=!0);let o=Qe(i,c,()=>a=null);l||=d.length>u||o.includes(`
`),n<e.length-1?o+=`,`:t.options.trailingComma&&(t.options.lineWidth>0&&(l||=d.reduce((e,t)=>e+t.length+2,2)+(o.length+2)>t.options.lineWidth),l&&(o+=`,`)),a&&(o+=Fe(o,r,s(a))),d.push(o),u=d.length}let{start:f,end:p}=n;if(d.length===0)return f+p;if(!l){let e=d.reduce((e,t)=>e+t.length+2,2);l=t.options.lineWidth>0&&e>t.options.lineWidth}if(l){let e=f;for(let t of d)e+=t?`\n${a}${i}${t}`:`
`;return`${e}\n${i}${p}`}return`${f}${o}${d.join(` `)}${o}${p}`}function ft({indent:e,options:{commentString:t}},n,r,i){if(r&&i&&(r=r.replace(/^\n+/,``)),r){let i=Pe(t(r),e);n.push(i.trimStart())}}function pt(e,t){let n=W(t)?t.value:t;for(let r of e)if(U(r)&&(r.key===t||r.key===n||W(r.key)&&r.key.value===n))return r}var Z=class extends Me{static get tagName(){return`tag:yaml.org,2002:map`}constructor(e){super(z,e),this.items=[]}static from(e,t,n){let{keepUndefined:r,replacer:i}=n,a=new this(e),o=(e,o)=>{if(typeof i==`function`)o=i.call(t,e,o);else if(Array.isArray(i)&&!i.includes(e))return;(o!==void 0||r)&&a.items.push(ct(e,o,n))};if(t instanceof Map)for(let[e,n]of t)o(e,n);else if(t&&typeof t==`object`)for(let e of Object.keys(t))o(e,t[e]);return typeof e.sortMapEntries==`function`&&a.items.sort(e.sortMapEntries),a}add(e,t){let n;n=U(e)?e:!e||typeof e!=`object`||!(`key`in e)?new X(e,e?.value):new X(e.key,e.value);let r=pt(this.items,n.key),i=this.schema?.sortMapEntries;if(r){if(!t)throw Error(`Key ${n.key} already set`);W(r.value)&&De(n.value)?r.value.value=n.value:r.value=n.value}else if(i){let e=this.items.findIndex(e=>i(n,e)<0);e===-1?this.items.push(n):this.items.splice(e,0,n)}else this.items.push(n)}delete(e){let t=pt(this.items,e);return t?this.items.splice(this.items.indexOf(t),1).length>0:!1}get(e,t){let n=pt(this.items,e)?.value;return(!t&&W(n)?n.value:n)??void 0}has(e){return!!pt(this.items,e)}set(e,t){this.add(new X(e,t),!0)}toJSON(e,t,n){let r=n?new n:t?.mapAsMap?new Map:{};t?.onCreate&&t.onCreate(r);for(let e of this.items)ot(t,r,e);return r}toString(e,t,n){if(!e)return JSON.stringify(this);for(let e of this.items)if(!U(e))throw Error(`Map items must all be pairs; found ${JSON.stringify(e)} instead`);return!e.allNullValues&&this.hasAllNullValues(!1)&&(e=Object.assign({},e,{allNullValues:!0})),lt(this,e,{blockItemPrefix:``,flowChars:{start:`{`,end:`}`},itemIndent:e.indent||``,onChompKeep:n,onComment:t})}};let mt={collection:`map`,default:!0,nodeClass:Z,tag:`tag:yaml.org,2002:map`,resolve(e,t){return oe(e)||t(`Expected a mapping for this tag`),e},createNode:(e,t,n)=>Z.from(e,t,n)};var ht=class extends Me{static get tagName(){return`tag:yaml.org,2002:seq`}constructor(e){super(ie,e),this.items=[]}add(e){this.items.push(e)}delete(e){let t=gt(e);return typeof t==`number`&&this.items.splice(t,1).length>0}get(e,t){let n=gt(e);if(typeof n!=`number`)return;let r=this.items[n];return!t&&W(r)?r.value:r}has(e){let t=gt(e);return typeof t==`number`&&t<this.items.length}set(e,t){let n=gt(e);if(typeof n!=`number`)throw Error(`Expected a valid index, not ${e}.`);let r=this.items[n];W(r)&&De(t)?r.value=t:this.items[n]=t}toJSON(e,t){let n=[];t?.onCreate&&t.onCreate(n);let r=0;for(let e of this.items)n.push(J(e,String(r++),t));return n}toString(e,t,n){return e?lt(this,e,{blockItemPrefix:`- `,flowChars:{start:`[`,end:`]`},itemIndent:(e.indent||``)+`  `,onChompKeep:n,onComment:t}):JSON.stringify(this)}static from(e,t,n){let{replacer:r}=n,i=new this(e);if(t&&Symbol.iterator in Object(t)){let e=0;for(let a of t){if(typeof r==`function`){let n=t instanceof Set?a:String(e++);a=r.call(t,n,a)}i.items.push(ke(a,void 0,n))}}return i}};function gt(e){let t=W(e)?e.value:e;return t&&typeof t==`string`&&(t=Number(t)),typeof t==`number`&&Number.isInteger(t)&&t>=0?t:null}let _t={collection:`seq`,default:!0,nodeClass:ht,tag:`tag:yaml.org,2002:seq`,resolve(e,t){return G(e)||t(`Expected a sequence for this tag`),e},createNode:(e,t,n)=>ht.from(e,t,n)},vt={identify:e=>typeof e==`string`,default:!0,tag:`tag:yaml.org,2002:str`,resolve:e=>e,stringify(e,t,n,r){return t=Object.assign({actualString:!0},t),Je(e,t,n,r)}},yt={identify:e=>e==null,createNode:()=>new Y(null),default:!0,tag:`tag:yaml.org,2002:null`,test:/^(?:~|[Nn]ull|NULL)?$/,resolve:()=>new Y(null),stringify:({source:e},t)=>typeof e==`string`&&yt.test.test(e)?e:t.options.nullStr},bt={identify:e=>typeof e==`boolean`,default:!0,tag:`tag:yaml.org,2002:bool`,test:/^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,resolve:e=>new Y(e[0]===`t`||e[0]===`T`),stringify({source:e,value:t},n){return e&&bt.test.test(e)&&t===(e[0]===`t`||e[0]===`T`)?e:t?n.options.trueStr:n.options.falseStr}};function Q({format:e,minFractionDigits:t,tag:n,value:r}){if(typeof r==`bigint`)return String(r);let i=typeof r==`number`?r:Number(r);if(!isFinite(i))return isNaN(i)?`.nan`:i<0?`-.inf`:`.inf`;let a=Object.is(r,-0)?`-0`:JSON.stringify(r);if(!e&&t&&(!n||n===`tag:yaml.org,2002:float`)&&/^-?\d/.test(a)&&!a.includes(`e`)){let e=a.indexOf(`.`);e<0&&(e=a.length,a+=`.`);let n=t-(a.length-e-1);for(;n-->0;)a+=`0`}return a}let xt={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,resolve:e=>e.slice(-3).toLowerCase()===`nan`?NaN:e[0]===`-`?-1/0:1/0,stringify:Q},St={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,format:`EXP`,test:/^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,resolve:e=>parseFloat(e),stringify(e){let t=Number(e.value);return isFinite(t)?t.toExponential():Q(e)}},Ct={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,resolve(e){let t=new Y(parseFloat(e)),n=e.indexOf(`.`);return n!==-1&&e[e.length-1]===`0`&&(t.minFractionDigits=e.length-n-1),t},stringify:Q},wt=e=>typeof e==`bigint`||Number.isInteger(e),Tt=(e,t,n,{intAsBigInt:r})=>r?BigInt(e):parseInt(e.substring(t),n);function Et(e,t,n){let{value:r}=e;return wt(r)&&r>=0?n+r.toString(t):Q(e)}let Dt={identify:e=>wt(e)&&e>=0,default:!0,tag:`tag:yaml.org,2002:int`,format:`OCT`,test:/^0o[0-7]+$/,resolve:(e,t,n)=>Tt(e,2,8,n),stringify:e=>Et(e,8,`0o`)},Ot={identify:wt,default:!0,tag:`tag:yaml.org,2002:int`,test:/^[-+]?[0-9]+$/,resolve:(e,t,n)=>Tt(e,0,10,n),stringify:Q},kt={identify:e=>wt(e)&&e>=0,default:!0,tag:`tag:yaml.org,2002:int`,format:`HEX`,test:/^0x[0-9a-fA-F]+$/,resolve:(e,t,n)=>Tt(e,2,16,n),stringify:e=>Et(e,16,`0x`)},At=[mt,_t,vt,yt,bt,Dt,Ot,kt,xt,St,Ct];function jt(e){return typeof e==`bigint`||Number.isInteger(e)}let Mt=({value:e})=>JSON.stringify(e),Nt=[{identify:e=>typeof e==`string`,default:!0,tag:`tag:yaml.org,2002:str`,resolve:e=>e,stringify:Mt},{identify:e=>e==null,createNode:()=>new Y(null),default:!0,tag:`tag:yaml.org,2002:null`,test:/^null$/,resolve:()=>null,stringify:Mt},{identify:e=>typeof e==`boolean`,default:!0,tag:`tag:yaml.org,2002:bool`,test:/^true$|^false$/,resolve:e=>e===`true`,stringify:Mt},{identify:jt,default:!0,tag:`tag:yaml.org,2002:int`,test:/^-?(?:0|[1-9][0-9]*)$/,resolve:(e,t,{intAsBigInt:n})=>n?BigInt(e):parseInt(e,10),stringify:({value:e})=>jt(e)?e.toString():JSON.stringify(e)},{identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,resolve:e=>parseFloat(e),stringify:Mt}],Pt=[mt,_t].concat(Nt,{default:!0,tag:``,test:/^/,resolve(e,t){return t(`Unresolved plain scalar ${JSON.stringify(e)}`),e}}),Ft={identify:e=>e instanceof Uint8Array,default:!1,tag:`tag:yaml.org,2002:binary`,resolve(e,t){if(typeof atob==`function`){let t=atob(e.replace(/[\n\r]/g,``)),n=new Uint8Array(t.length);for(let e=0;e<t.length;++e)n[e]=t.charCodeAt(e);return n}return t(`This environment does not support reading binary tags; either Buffer or atob is required`),e},stringify({comment:e,type:t,value:n},r,i,a){if(!n)return``;let o=n,s;if(typeof btoa==`function`){let e=``;for(let t=0;t<o.length;++t)e+=String.fromCharCode(o[t]);s=btoa(e)}else throw Error(`This environment does not support writing binary tags; either Buffer or btoa is required`);if(t??=Y.BLOCK_LITERAL,t!==Y.QUOTE_DOUBLE){let e=Math.max(r.options.lineWidth-r.indent.length,r.options.minContentWidth),n=Math.ceil(s.length/e),i=Array(n);for(let t=0,r=0;t<n;++t,r+=e)i[t]=s.substr(r,e);s=i.join(t===Y.BLOCK_LITERAL?`
`:` `)}return Je({comment:e,type:t,value:s},r,i,a)}};function It(e,t){if(G(e))for(let n=0;n<e.items.length;++n){let r=e.items[n];if(!U(r)){if(oe(r)){r.items.length>1&&t(`Each pair must have its own sequence indicator`);let e=r.items[0]||new X(new Y(null));if(r.commentBefore&&(e.key.commentBefore=e.key.commentBefore?`${r.commentBefore}\n${e.key.commentBefore}`:r.commentBefore),r.comment){let t=e.value??e.key;t.comment=t.comment?`${r.comment}\n${t.comment}`:r.comment}r=e}e.items[n]=U(r)?r:new X(r)}}else t(`Expected a sequence for this tag`);return e}function Lt(e,t,n){let{replacer:r}=n,i=new ht(e);i.tag=`tag:yaml.org,2002:pairs`;let a=0;if(t&&Symbol.iterator in Object(t))for(let e of t){typeof r==`function`&&(e=r.call(t,String(a++),e));let o,s;if(Array.isArray(e)){if(e.length===2)o=e[0],s=e[1];else throw TypeError(`Expected [key, value] tuple: ${e}`)}else if(e&&e instanceof Object){let t=Object.keys(e);if(t.length===1)o=t[0],s=e[o];else throw TypeError(`Expected tuple with one key, not ${t.length} keys`)}else o=e;i.items.push(ct(o,s,n))}return i}let Rt={collection:`seq`,default:!1,tag:`tag:yaml.org,2002:pairs`,resolve:It,createNode:Lt};var zt=class e extends ht{constructor(){super(),this.add=Z.prototype.add.bind(this),this.delete=Z.prototype.delete.bind(this),this.get=Z.prototype.get.bind(this),this.has=Z.prototype.has.bind(this),this.set=Z.prototype.set.bind(this),this.tag=e.tag}toJSON(e,t){if(!t)return super.toJSON(e);let n=new Map;t?.onCreate&&t.onCreate(n);for(let e of this.items){let r,i;if(U(e)?(r=J(e.key,``,t),i=J(e.value,r,t)):r=J(e,``,t),n.has(r))throw Error(`Ordered maps must not include duplicate keys`);n.set(r,i)}return n}static from(e,t,n){let r=Lt(e,t,n),i=new this;return i.items=r.items,i}};zt.tag=`tag:yaml.org,2002:omap`;let Bt={collection:`seq`,identify:e=>e instanceof Map,nodeClass:zt,default:!1,tag:`tag:yaml.org,2002:omap`,resolve(e,t){let n=It(e,t),r=[];for(let{key:e}of n.items)W(e)&&(r.includes(e.value)?t(`Ordered maps must not include duplicate keys: ${e.value}`):r.push(e.value));return Object.assign(new zt,n)},createNode:(e,t,n)=>zt.from(e,t,n)};function Vt({value:e,source:t},n){return t&&(e?Ht:Ut).test.test(t)?t:e?n.options.trueStr:n.options.falseStr}let Ht={identify:e=>e===!0,default:!0,tag:`tag:yaml.org,2002:bool`,test:/^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,resolve:()=>new Y(!0),stringify:Vt},Ut={identify:e=>e===!1,default:!0,tag:`tag:yaml.org,2002:bool`,test:/^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,resolve:()=>new Y(!1),stringify:Vt},Wt={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,resolve:e=>e.slice(-3).toLowerCase()===`nan`?NaN:e[0]===`-`?-1/0:1/0,stringify:Q},Gt={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,format:`EXP`,test:/^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,resolve:e=>parseFloat(e.replace(/_/g,``)),stringify(e){let t=Number(e.value);return isFinite(t)?t.toExponential():Q(e)}},Kt={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,test:/^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,resolve(e){let t=new Y(parseFloat(e.replace(/_/g,``))),n=e.indexOf(`.`);if(n!==-1){let r=e.substring(n+1).replace(/_/g,``);r[r.length-1]===`0`&&(t.minFractionDigits=r.length)}return t},stringify:Q},qt=e=>typeof e==`bigint`||Number.isInteger(e);function Jt(e,t,n,{intAsBigInt:r}){let i=e[0];if((i===`-`||i===`+`)&&(t+=1),e=e.substring(t).replace(/_/g,``),r){switch(n){case 2:e=`0b${e}`;break;case 8:e=`0o${e}`;break;case 16:e=`0x${e}`}let t=BigInt(e);return i===`-`?BigInt(-1)*t:t}let a=parseInt(e,n);return i===`-`?-1*a:a}function Yt(e,t,n){let{value:r}=e;if(qt(r)){let e=r.toString(t);return r<0?`-`+n+e.substr(1):n+e}return Q(e)}let Xt={identify:qt,default:!0,tag:`tag:yaml.org,2002:int`,format:`BIN`,test:/^[-+]?0b[0-1_]+$/,resolve:(e,t,n)=>Jt(e,2,2,n),stringify:e=>Yt(e,2,`0b`)},Zt={identify:qt,default:!0,tag:`tag:yaml.org,2002:int`,format:`OCT`,test:/^[-+]?0[0-7_]+$/,resolve:(e,t,n)=>Jt(e,1,8,n),stringify:e=>Yt(e,8,`0`)},Qt={identify:qt,default:!0,tag:`tag:yaml.org,2002:int`,test:/^[-+]?[0-9][0-9_]*$/,resolve:(e,t,n)=>Jt(e,0,10,n),stringify:Q},$t={identify:qt,default:!0,tag:`tag:yaml.org,2002:int`,format:`HEX`,test:/^[-+]?0x[0-9a-fA-F_]+$/,resolve:(e,t,n)=>Jt(e,2,16,n),stringify:e=>Yt(e,16,`0x`)};var en=class e extends Z{constructor(t){super(t),this.tag=e.tag}add(e){let t;t=U(e)?e:e&&typeof e==`object`&&`key`in e&&`value`in e&&e.value===null?new X(e.key,null):new X(e,null),pt(this.items,t.key)||this.items.push(t)}get(e,t){let n=pt(this.items,e);return!t&&U(n)?W(n.key)?n.key.value:n.key:n}set(e,t){if(typeof t!=`boolean`)throw Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);let n=pt(this.items,e);n&&!t?this.items.splice(this.items.indexOf(n),1):!n&&t&&this.items.push(new X(e))}toJSON(e,t){return super.toJSON(e,t,Set)}toString(e,t,n){if(!e)return JSON.stringify(this);if(this.hasAllNullValues(!0))return super.toString(Object.assign({},e,{allNullValues:!0}),t,n);throw Error(`Set items must all have null values`)}static from(e,t,n){let{replacer:r}=n,i=new this(e);if(t&&Symbol.iterator in Object(t))for(let e of t)typeof r==`function`&&(e=r.call(t,e,e)),i.items.push(ct(e,null,n));return i}};en.tag=`tag:yaml.org,2002:set`;let tn={collection:`map`,identify:e=>e instanceof Set,nodeClass:en,default:!1,tag:`tag:yaml.org,2002:set`,createNode:(e,t,n)=>en.from(e,t,n),resolve(e,t){if(oe(e)){if(e.hasAllNullValues(!0))return Object.assign(new en,e);t(`Set items must all have null values`)}else t(`Expected a mapping for this tag`);return e}};function nn(e,t){let n=e[0],r=n===`-`||n===`+`?e.substring(1):e,i=e=>t?BigInt(e):Number(e),a=r.replace(/_/g,``).split(`:`).reduce((e,t)=>e*i(60)+i(t),i(0));return n===`-`?i(-1)*a:a}function rn(e){let{value:t}=e,n=e=>e;if(typeof t==`bigint`)n=e=>BigInt(e);else if(isNaN(t)||!isFinite(t))return Q(e);let r=``;t<0&&(r=`-`,t*=n(-1));let i=n(60),a=[t%i];return t<60?a.unshift(0):(t=(t-a[0])/i,a.unshift(t%i),t>=60&&(t=(t-a[0])/i,a.unshift(t))),r+a.map(e=>String(e).padStart(2,`0`)).join(`:`).replace(/000000\d*$/,``)}let an={identify:e=>typeof e==`bigint`||Number.isInteger(e),default:!0,tag:`tag:yaml.org,2002:int`,format:`TIME`,test:/^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,resolve:(e,t,{intAsBigInt:n})=>nn(e,n),stringify:rn},on={identify:e=>typeof e==`number`,default:!0,tag:`tag:yaml.org,2002:float`,format:`TIME`,test:/^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,resolve:e=>nn(e,!1),stringify:rn},sn={identify:e=>e instanceof Date,default:!0,tag:`tag:yaml.org,2002:timestamp`,test:RegExp(`^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$`),resolve(e){let t=e.match(sn.test);if(!t)throw Error(`!!timestamp expects a date, starting with yyyy-mm-dd`);let[,n,r,i,a,o,s]=t.map(Number),c=t[7]?Number((t[7]+`00`).substr(1,3)):0,l=Date.UTC(n,r-1,i,a||0,o||0,s||0,c),u=t[8];if(u&&u!==`Z`){let e=nn(u,!1);Math.abs(e)<30&&(e*=60),l-=6e4*e}return new Date(l)},stringify:({value:e})=>e?.toISOString().replace(/(T00:00:00)?\.000Z$/,``)??``},cn=[mt,_t,vt,yt,Ht,Ut,Xt,Zt,Qt,$t,Wt,Gt,Kt,Ft,tt,Bt,Rt,tn,an,on,sn],ln=new Map([[`core`,At],[`failsafe`,[mt,_t,vt]],[`json`,Pt],[`yaml11`,cn],[`yaml-1.1`,cn]]),un={binary:Ft,bool:bt,float:Ct,floatExp:St,floatNaN:xt,floatTime:on,int:Ot,intHex:kt,intOct:Dt,intTime:an,map:mt,merge:tt,null:yt,omap:Bt,pairs:Rt,seq:_t,set:tn,timestamp:sn},dn={"tag:yaml.org,2002:binary":Ft,"tag:yaml.org,2002:merge":tt,"tag:yaml.org,2002:omap":Bt,"tag:yaml.org,2002:pairs":Rt,"tag:yaml.org,2002:set":tn,"tag:yaml.org,2002:timestamp":sn};function fn(e,t,n){let r=ln.get(t);if(r&&!e)return n&&!r.includes(tt)?r.concat(tt):r.slice();let i=r;if(!i){if(Array.isArray(e))i=[];else{let e=Array.from(ln.keys()).filter(e=>e!==`yaml11`).map(e=>JSON.stringify(e)).join(`, `);throw Error(`Unknown schema "${t}"; use one of ${e} or define customTags array`)}}if(Array.isArray(e))for(let t of e)i=i.concat(t);else typeof e==`function`&&(i=e(i.slice()));return n&&(i=i.concat(tt)),i.reduce((e,t)=>{let n=typeof t==`string`?un[t]:t;if(!n){let e=JSON.stringify(t),n=Object.keys(un).map(e=>JSON.stringify(e)).join(`, `);throw Error(`Unknown custom tag ${e}; use one of ${n}`)}return e.includes(n)||e.push(n),e},[])}let pn=(e,t)=>e.key<t.key?-1:+(e.key>t.key);var mn=class e{constructor({compat:e,customTags:t,merge:n,resolveKnownTags:r,schema:i,sortMapEntries:a,toStringDefaults:o}){this.compat=Array.isArray(e)?fn(e,`compat`):e?fn(null,e):null,this.name=typeof i==`string`&&i||`core`,this.knownTags=r?dn:{},this.tags=fn(t,this.name,n),this.toStringOptions=o??null,Object.defineProperty(this,z,{value:mt}),Object.defineProperty(this,B,{value:vt}),Object.defineProperty(this,ie,{value:_t}),this.sortMapEntries=typeof a==`function`?a:a===!0?pn:null}clone(){let t=Object.create(e.prototype,Object.getOwnPropertyDescriptors(this));return t.tags=this.tags.slice(),t}};function hn(e,t){let n=[],r=t.directives===!0;if(t.directives!==!1&&e.directives){let t=e.directives.toString(e);t?(n.push(t),r=!0):e.directives.docStart&&(r=!0)}r&&n.push(`---`);let i=Ye(e,t),{commentString:a}=i.options;if(e.commentBefore){n.length!==1&&n.unshift(``);let t=a(e.commentBefore);n.unshift(Pe(t,``))}let o=!1,s=null;if(e.contents){if(q(e.contents)){if(e.contents.spaceBefore&&r&&n.push(``),e.contents.commentBefore){let t=a(e.contents.commentBefore);n.push(Pe(t,``))}i.forceBlockIndent=!!e.comment,s=e.contents.comment}let t=s?void 0:()=>o=!0,c=Qe(e.contents,i,()=>s=null,t);s&&(c+=Fe(c,``,a(s))),(c[0]===`|`||c[0]===`>`)&&n[n.length-1]===`---`?n[n.length-1]=`--- ${c}`:n.push(c)}else n.push(Qe(e.contents,i));if(e.directives?.docEnd){if(e.comment){let t=a(e.comment);t.includes(`
`)?(n.push(`...`),n.push(Pe(t,``))):n.push(`... ${t}`)}else n.push(`...`)}else{let t=e.comment;t&&o&&(t=t.replace(/^\n+/,``)),t&&((!o||s)&&n[n.length-1]!==``&&n.push(``),n.push(Pe(a(t),``)))}return n.join(`
`)+`
`}var gn=class e{constructor(e,t,n){this.commentBefore=null,this.comment=null,this.errors=[],this.warnings=[],Object.defineProperty(this,V,{value:R});let r=null;typeof t==`function`||Array.isArray(t)?r=t:n===void 0&&t&&(n=t,t=void 0);let i=Object.assign({intAsBigInt:!1,keepSourceTokens:!1,logLevel:`warn`,prettyErrors:!0,strict:!0,stringKeys:!1,uniqueKeys:!0,version:`1.2`},n);this.options=i;let{version:a}=i;n?._directives?(this.directives=n._directives.atDocument(),this.directives.yaml.explicit&&(a=this.directives.yaml.version)):this.directives=new ve({version:a}),this.setSchema(a,n),this.contents=e===void 0?null:this.createNode(e,r,n)}clone(){let t=Object.create(e.prototype,{[V]:{value:R}});return t.commentBefore=this.commentBefore,t.comment=this.comment,t.errors=this.errors.slice(),t.warnings=this.warnings.slice(),t.options=Object.assign({},this.options),this.directives&&(t.directives=this.directives.clone()),t.schema=this.schema.clone(),t.contents=q(this.contents)?this.contents.clone(t.schema):this.contents,this.range&&(t.range=this.range.slice()),t}add(e){_n(this.contents)&&this.contents.add(e)}addIn(e,t){_n(this.contents)&&this.contents.addIn(e,t)}createAlias(e,t){if(!e.anchor){let n=be(this);e.anchor=!t||n.has(t)?xe(t||`a`,n):t}return new Te(e.anchor)}createNode(e,t,n){let r;if(typeof t==`function`)e=t.call({"":e},``,e),r=t;else if(Array.isArray(t)){let e=t.filter(e=>typeof e==`number`||e instanceof String||e instanceof Number).map(String);e.length>0&&(t=t.concat(e)),r=t}else n===void 0&&t&&(n=t,t=void 0);let{aliasDuplicateObjects:i,anchorPrefix:a,flow:o,keepUndefined:s,onTagObj:c,tag:l}=n??{},{onAnchor:u,setAnchors:d,sourceObjects:f}=Se(this,a||`a`),p={aliasDuplicateObjects:i??!0,keepUndefined:s??!1,onAnchor:u,onTagObj:c,replacer:r,schema:this.schema,sourceObjects:f},m=ke(e,l,p);return o&&K(m)&&(m.flow=!0),d(),m}createPair(e,t,n={}){return new X(this.createNode(e,null,n),this.createNode(t,null,n))}delete(e){return _n(this.contents)?this.contents.delete(e):!1}deleteIn(e){return je(e)?this.contents!=null&&(this.contents=null,!0):_n(this.contents)?this.contents.deleteIn(e):!1}get(e,t){return K(this.contents)?this.contents.get(e,t):void 0}getIn(e,t){return je(e)?!t&&W(this.contents)?this.contents.value:this.contents:K(this.contents)?this.contents.getIn(e,t):void 0}has(e){return K(this.contents)?this.contents.has(e):!1}hasIn(e){return je(e)?this.contents!==void 0:K(this.contents)?this.contents.hasIn(e):!1}set(e,t){this.contents==null?this.contents=Ae(this.schema,[e],t):_n(this.contents)&&this.contents.set(e,t)}setIn(e,t){je(e)?this.contents=t:this.contents==null?this.contents=Ae(this.schema,Array.from(e),t):_n(this.contents)&&this.contents.setIn(e,t)}setSchema(e,t={}){typeof e==`number`&&(e=String(e));let n;switch(e){case`1.1`:this.directives?this.directives.yaml.version=`1.1`:this.directives=new ve({version:`1.1`}),n={resolveKnownTags:!1,schema:`yaml-1.1`};break;case`1.2`:case`next`:this.directives?this.directives.yaml.version=e:this.directives=new ve({version:e}),n={resolveKnownTags:!0,schema:`core`};break;case null:this.directives&&delete this.directives,n=null;break;default:{let t=JSON.stringify(e);throw Error(`Expected '1.1', '1.2' or null as first argument, but found: ${t}`)}}if(t.schema instanceof Object)this.schema=t.schema;else if(n)this.schema=new mn(Object.assign(n,t));else throw Error(`With a null YAML version, the { schema: Schema } option is required`)}toJS({json:e,jsonArg:t,mapAsMap:n,maxAliasCount:r,onAnchor:i,reviver:a}={}){let o={anchors:new Map,doc:this,keep:!e,mapAsMap:n===!0,mapKeyWarned:!1,maxAliasCount:typeof r==`number`?r:100},s=J(this.contents,t??``,o);if(typeof i==`function`)for(let{count:e,res:t}of o.anchors.values())i(t,e);return typeof a==`function`?Ce(a,{"":s},``,s):s}toJSON(e,t){return this.toJS({json:!0,jsonArg:e,mapAsMap:!1,onAnchor:t})}toString(e={}){if(this.errors.length>0)throw Error(`Document with errors cannot be stringified`);if(`indent`in e&&(!Number.isInteger(e.indent)||Number(e.indent)<=0)){let t=JSON.stringify(e.indent);throw Error(`"indent" option must be a positive integer, not ${t}`)}return hn(this,e)}};function _n(e){if(K(e))return!0;throw Error(`Expected a YAML collection as document contents`)}var vn=class extends Error{constructor(e,t,n,r){super(),this.name=e,this.code=n,this.message=r,this.pos=t}},yn=class extends vn{constructor(e,t,n){super(`YAMLParseError`,e,t,n)}},bn=class extends vn{constructor(e,t,n){super(`YAMLWarning`,e,t,n)}};let xn=(e,t)=>n=>{if(n.pos[0]===-1)return;n.linePos=n.pos.map(e=>t.linePos(e));let{line:r,col:i}=n.linePos[0];n.message+=` at line ${r}, column ${i}`;let a=i-1,o=e.substring(t.lineStarts[r-1],t.lineStarts[r]).replace(/[\n\r]+$/,``);if(a>=60&&o.length>80){let e=Math.min(a-39,o.length-79);o=`…`+o.substring(e),a-=e-1}if(o.length>80&&(o=o.substring(0,79)+`…`),r>1&&/^ *$/.test(o.substring(0,a))){let n=e.substring(t.lineStarts[r-2],t.lineStarts[r-1]);n.length>80&&(n=n.substring(0,79)+`…
`),o=n+o}if(/[^ ]/.test(o)){let e=1,t=n.linePos[1];t?.line===r&&t.col>i&&(e=Math.max(1,Math.min(t.col-i,80-a)));let s=` `.repeat(a)+`^`.repeat(e);n.message+=`:\n\n${o}\n${s}\n`}};function Sn(e,{flow:t,indicator:n,next:r,offset:i,onError:a,parentIndent:o,startOnNewline:s}){let c=!1,l=s,u=s,d=``,f=``,p=!1,m=!1,h=null,g=null,_=null,v=null,y=null,b=null,x=null;for(let i of e)switch(m&&=(i.type!==`space`&&i.type!==`newline`&&i.type!==`comma`&&a(i.offset,`MISSING_CHAR`,`Tags and anchors must be separated from the next token by white space`),!1),h&&=(l&&i.type!==`comment`&&i.type!==`newline`&&a(h,`TAB_AS_INDENT`,`Tabs are not allowed as indentation`),null),i.type){case`space`:!t&&(n!==`doc-start`||r?.type!==`flow-collection`)&&i.source.includes(`	`)&&(h=i),u=!0;break;case`comment`:{u||a(i,`MISSING_CHAR`,`Comments must be separated from other tokens by white space characters`);let e=i.source.substring(1)||` `;d?d+=f+e:d=e,f=``,l=!1;break}case`newline`:l?d?d+=i.source:b&&n===`seq-item-ind`||(c=!0):f+=i.source,l=!0,p=!0,(g||_)&&(v=i),u=!0;break;case`anchor`:g&&a(i,`MULTIPLE_ANCHORS`,`A node can have at most one anchor`),i.source.endsWith(`:`)&&a(i.offset+i.source.length-1,`BAD_ALIAS`,`Anchor ending in : is ambiguous`,!0),g=i,x??=i.offset,l=!1,u=!1,m=!0;break;case`tag`:_&&a(i,`MULTIPLE_TAGS`,`A node can have at most one tag`),_=i,x??=i.offset,l=!1,u=!1,m=!0;break;case n:(g||_)&&a(i,`BAD_PROP_ORDER`,`Anchors and tags must be after the ${i.source} indicator`),b&&a(i,`UNEXPECTED_TOKEN`,`Unexpected ${i.source} in ${t??`collection`}`),b=i,l=n===`seq-item-ind`||n===`explicit-key-ind`,u=!1;break;case`comma`:if(t){y&&a(i,`UNEXPECTED_TOKEN`,`Unexpected , in ${t}`),y=i,l=!1,u=!1;break}default:a(i,`UNEXPECTED_TOKEN`,`Unexpected ${i.type} token`),l=!1,u=!1}let S=e[e.length-1],C=S?S.offset+S.source.length:i;return m&&r&&r.type!==`space`&&r.type!==`newline`&&r.type!==`comma`&&(r.type!==`scalar`||r.source!==``)&&a(r.offset,`MISSING_CHAR`,`Tags and anchors must be separated from the next token by white space`),h&&(l&&h.indent<=o||r?.type===`block-map`||r?.type===`block-seq`)&&a(h,`TAB_AS_INDENT`,`Tabs are not allowed as indentation`),{comma:y,found:b,spaceBefore:c,comment:d,hasNewline:p,anchor:g,tag:_,newlineAfterProp:v,end:C,start:x??C}}function Cn(e){if(!e)return null;switch(e.type){case`alias`:case`scalar`:case`double-quoted-scalar`:case`single-quoted-scalar`:if(e.source.includes(`
`))return!0;if(e.end){for(let t of e.end)if(t.type===`newline`)return!0}return!1;case`flow-collection`:for(let t of e.items){for(let e of t.start)if(e.type===`newline`)return!0;if(t.sep){for(let e of t.sep)if(e.type===`newline`)return!0}if(Cn(t.key)||Cn(t.value))return!0}return!1;default:return!0}}function wn(e,t,n){if(t?.type===`flow-collection`){let r=t.end[0];r.indent===e&&(r.source===`]`||r.source===`}`)&&Cn(t)&&n(r,`BAD_INDENT`,`Flow end indicator should be more indented than parent`,!0)}}function Tn(e,t,n){let{uniqueKeys:r}=e.options;if(r===!1)return!1;let i=typeof r==`function`?r:(e,t)=>e===t||W(e)&&W(t)&&e.value===t.value;return t.some(e=>i(e.key,n))}let En=`All mapping items must start at the same column`;function Dn({composeNode:e,composeEmptyNode:t},n,r,i,a){let o=new((a?.nodeClass)??Z)(n.schema);n.atRoot&&=!1;let s=r.offset,c=null;for(let a of r.items){let{start:l,key:u,sep:d,value:f}=a,p=Sn(l,{indicator:`explicit-key-ind`,next:u??d?.[0],offset:s,onError:i,parentIndent:r.indent,startOnNewline:!0}),m=!p.found;if(m){if(u&&(u.type===`block-seq`?i(s,`BLOCK_AS_IMPLICIT_KEY`,`A block sequence may not be used as an implicit map key`):`indent`in u&&u.indent!==r.indent&&i(s,`BAD_INDENT`,En)),!p.anchor&&!p.tag&&!d){c=p.end,p.comment&&(o.comment?o.comment+=`
`+p.comment:o.comment=p.comment);continue}(p.newlineAfterProp||Cn(u))&&i(u??l[l.length-1],`MULTILINE_IMPLICIT_KEY`,`Implicit keys need to be on a single line`)}else p.found?.indent!==r.indent&&i(s,`BAD_INDENT`,En);n.atKey=!0;let h=p.end,g=u?e(n,u,p,i):t(n,h,l,null,p,i);n.schema.compat&&wn(r.indent,u,i),n.atKey=!1,Tn(n,o.items,g)&&i(h,`DUPLICATE_KEY`,`Map keys must be unique`);let _=Sn(d??[],{indicator:`map-value-ind`,next:f,offset:g.range[2],onError:i,parentIndent:r.indent,startOnNewline:!u||u.type===`block-scalar`});if(s=_.end,_.found){m&&(f?.type===`block-map`&&!_.hasNewline&&i(s,`BLOCK_AS_IMPLICIT_KEY`,`Nested mappings are not allowed in compact mappings`),n.options.strict&&p.start<_.found.offset-1024&&i(g.range,`KEY_OVER_1024_CHARS`,`The : indicator must be at most 1024 chars after the start of an implicit block mapping key`));let c=f?e(n,f,_,i):t(n,s,d,null,_,i);n.schema.compat&&wn(r.indent,f,i),s=c.range[2];let l=new X(g,c);n.options.keepSourceTokens&&(l.srcToken=a),o.items.push(l)}else{m&&i(g.range,`MISSING_CHAR`,`Implicit map keys need to be followed by map values`),_.comment&&(g.comment?g.comment+=`
`+_.comment:g.comment=_.comment);let e=new X(g);n.options.keepSourceTokens&&(e.srcToken=a),o.items.push(e)}}return c&&c<s&&i(c,`IMPOSSIBLE`,`Map comment with trailing content`),o.range=[r.offset,s,c??s],o}function On({composeNode:e,composeEmptyNode:t},n,r,i,a){let o=new((a?.nodeClass)??ht)(n.schema);n.atRoot&&=!1,n.atKey&&=!1;let s=r.offset,c=null;for(let{start:a,value:l}of r.items){let u=Sn(a,{indicator:`seq-item-ind`,next:l,offset:s,onError:i,parentIndent:r.indent,startOnNewline:!0});if(!u.found){if(u.anchor||u.tag||l)l?.type===`block-seq`?i(u.end,`BAD_INDENT`,`All sequence items must start at the same column`):i(s,`MISSING_CHAR`,`Sequence item without - indicator`);else{c=u.end,u.comment&&(o.comment=u.comment);continue}}let d=l?e(n,l,u,i):t(n,u.end,a,null,u,i);n.schema.compat&&wn(r.indent,l,i),s=d.range[2],o.items.push(d)}return o.range=[r.offset,s,c??s],o}function kn(e,t,n,r){let i=``;if(e){let a=!1,o=``;for(let s of e){let{source:e,type:c}=s;switch(c){case`space`:a=!0;break;case`comment`:{n&&!a&&r(s,`MISSING_CHAR`,`Comments must be separated from other tokens by white space characters`);let t=e.substring(1)||` `;i?i+=o+t:i=t,o=``;break}case`newline`:i&&(o+=e),a=!0;break;default:r(s,`UNEXPECTED_TOKEN`,`Unexpected ${c} at node end`)}t+=e.length}}return{comment:i,offset:t}}let An=`Block collections are not allowed within flow collections`,jn=e=>e&&(e.type===`block-map`||e.type===`block-seq`);function Mn({composeNode:e,composeEmptyNode:t},n,r,i,a){let o=r.start.source===`{`,s=o?`flow map`:`flow sequence`,c=new((a?.nodeClass)??(o?Z:ht))(n.schema);c.flow=!0;let l=n.atRoot;l&&(n.atRoot=!1),n.atKey&&=!1;let u=r.offset+r.start.source.length;for(let a=0;a<r.items.length;++a){let l=r.items[a],{start:d,key:f,sep:p,value:m}=l,h=Sn(d,{flow:s,indicator:`explicit-key-ind`,next:f??p?.[0],offset:u,onError:i,parentIndent:r.indent,startOnNewline:!1});if(!h.found){if(!h.anchor&&!h.tag&&!p&&!m){a===0&&h.comma?i(h.comma,`UNEXPECTED_TOKEN`,`Unexpected , in ${s}`):a<r.items.length-1&&i(h.start,`UNEXPECTED_TOKEN`,`Unexpected empty item in ${s}`),h.comment&&(c.comment?c.comment+=`
`+h.comment:c.comment=h.comment),u=h.end;continue}!o&&n.options.strict&&Cn(f)&&i(f,`MULTILINE_IMPLICIT_KEY`,`Implicit keys of flow sequence pairs need to be on a single line`)}if(a===0)h.comma&&i(h.comma,`UNEXPECTED_TOKEN`,`Unexpected , in ${s}`);else if(h.comma||i(h.start,`MISSING_CHAR`,`Missing , between ${s} items`),h.comment){let e=``;loop:for(let t of d)switch(t.type){case`comma`:case`space`:break;case`comment`:e=t.source.substring(1);break loop;default:break loop}if(e){let t=c.items[c.items.length-1];U(t)&&(t=t.value??t.key),t.comment?t.comment+=`
`+e:t.comment=e,h.comment=h.comment.substring(e.length+1)}}if(!o&&!p&&!h.found){let r=m?e(n,m,h,i):t(n,h.end,p,null,h,i);c.items.push(r),u=r.range[2],jn(m)&&i(r.range,`BLOCK_IN_FLOW`,An)}else{n.atKey=!0;let a=h.end,g=f?e(n,f,h,i):t(n,a,d,null,h,i);jn(f)&&i(g.range,`BLOCK_IN_FLOW`,An),n.atKey=!1;let _=Sn(p??[],{flow:s,indicator:`map-value-ind`,next:m,offset:g.range[2],onError:i,parentIndent:r.indent,startOnNewline:!1});if(_.found){if(!o&&!h.found&&n.options.strict){if(p)for(let e of p){if(e===_.found)break;if(e.type===`newline`){i(e,`MULTILINE_IMPLICIT_KEY`,`Implicit keys of flow sequence pairs need to be on a single line`);break}}h.start<_.found.offset-1024&&i(_.found,`KEY_OVER_1024_CHARS`,`The : indicator must be at most 1024 chars after the start of an implicit flow sequence key`)}}else m&&(`source`in m&&m.source?.[0]===`:`?i(m,`MISSING_CHAR`,`Missing space after : in ${s}`):i(_.start,`MISSING_CHAR`,`Missing , or : between ${s} items`));let v=m?e(n,m,_,i):_.found?t(n,_.end,p,null,_,i):null;v?jn(m)&&i(v.range,`BLOCK_IN_FLOW`,An):_.comment&&(g.comment?g.comment+=`
`+_.comment:g.comment=_.comment);let y=new X(g,v);if(n.options.keepSourceTokens&&(y.srcToken=l),o){let e=c;Tn(n,e.items,g)&&i(a,`DUPLICATE_KEY`,`Map keys must be unique`),e.items.push(y)}else{let e=new Z(n.schema);e.flow=!0,e.items.push(y);let t=(v??g).range;e.range=[g.range[0],t[1],t[2]],c.items.push(e)}u=v?v.range[2]:_.end}}let d=o?`}`:`]`,[f,...p]=r.end,m=u;if(f?.source===d)m=f.offset+f.source.length;else{let e=s[0].toUpperCase()+s.substring(1),t=l?`${e} must end with a ${d}`:`${e} in block collection must be sufficiently indented and end with a ${d}`;i(u,l?`MISSING_CHAR`:`BAD_INDENT`,t),f&&f.source.length!==1&&p.unshift(f)}if(p.length>0){let e=kn(p,m,n.options.strict,i);e.comment&&(c.comment?c.comment+=`
`+e.comment:c.comment=e.comment),c.range=[r.offset,m,e.offset]}else c.range=[r.offset,m,m];return c}function Nn(e,t,n,r,i,a){let o=n.type===`block-map`?Dn(e,t,n,r,a):n.type===`block-seq`?On(e,t,n,r,a):Mn(e,t,n,r,a),s=o.constructor;return i===`!`||i===s.tagName?(o.tag=s.tagName,o):(i&&(o.tag=i),o)}function Pn(e,t,n,r,i){let a=r.tag,o=a?t.directives.tagName(a.source,e=>i(a,`TAG_RESOLVE_FAILED`,e)):null;if(n.type===`block-seq`){let{anchor:e,newlineAfterProp:t}=r,n=e&&a?e.offset>a.offset?e:a:e??a;n&&(!t||t.offset<n.offset)&&i(n,`MISSING_CHAR`,`Missing newline after block sequence props`)}let s=n.type===`block-map`?`map`:n.type===`block-seq`?`seq`:n.start.source===`{`?`map`:`seq`;if(!a||!o||o===`!`||o===Z.tagName&&s===`map`||o===ht.tagName&&s===`seq`)return Nn(e,t,n,i,o);let c=t.schema.tags.find(e=>e.tag===o&&e.collection===s);if(!c){let r=t.schema.knownTags[o];if(r?.collection===s)t.schema.tags.push(Object.assign({},r,{default:!1})),c=r;else return r?i(a,`BAD_COLLECTION_TYPE`,`${r.tag} used for ${s} collection, but expects ${r.collection??`scalar`}`,!0):i(a,`TAG_RESOLVE_FAILED`,`Unresolved tag: ${o}`,!0),Nn(e,t,n,i,o)}let l=Nn(e,t,n,i,o,c),u=c.resolve?.(l,e=>i(a,`TAG_RESOLVE_FAILED`,e),t.options)??l,d=q(u)?u:new Y(u);return d.range=l.range,d.tag=o,c?.format&&(d.format=c.format),d}function Fn(e,t,n){let r=t.offset,i=In(t,e.options.strict,n);if(!i)return{value:``,type:null,comment:``,range:[r,r,r]};let a=i.mode===`>`?Y.BLOCK_FOLDED:Y.BLOCK_LITERAL,o=t.source?Ln(t.source):[],s=o.length;for(let e=o.length-1;e>=0;--e){let t=o[e][1];if(t===``||t===`\r`)s=e;else break}if(s===0){let e=i.chomp===`+`&&o.length>0?`
`.repeat(Math.max(1,o.length-1)):``,n=r+i.length;return t.source&&(n+=t.source.length),{value:e,type:a,comment:i.comment,range:[r,n,n]}}let c=t.indent+i.indent,l=t.offset+i.length,u=0;for(let t=0;t<s;++t){let[r,a]=o[t];if(a===``||a===`\r`)i.indent===0&&r.length>c&&(c=r.length);else{r.length<c&&n(l+r.length,`MISSING_CHAR`,`Block scalars with more-indented leading empty lines must use an explicit indentation indicator`),i.indent===0&&(c=r.length),u=t,c===0&&!e.atRoot&&n(l,`BAD_INDENT`,`Block scalar values in collections must be indented`);break}l+=r.length+a.length+1}for(let e=o.length-1;e>=s;--e)o[e][0].length>c&&(s=e+1);let d=``,f=``,p=!1;for(let e=0;e<u;++e)d+=o[e][0].slice(c)+`
`;for(let e=u;e<s;++e){let[t,r]=o[e];l+=t.length+r.length+1;let s=r[r.length-1]===`\r`;if(s&&(r=r.slice(0,-1)),r&&t.length<c){let e=`Block scalar lines must not be less indented than their ${i.indent?`explicit indentation indicator`:`first line`}`;n(l-r.length-(s?2:1),`BAD_INDENT`,e),t=``}a===Y.BLOCK_LITERAL?(d+=f+t.slice(c)+r,f=`
`):t.length>c||r[0]===`	`?(f===` `?f=`
`:!p&&f===`
`&&(f=`

`),d+=f+t.slice(c)+r,f=`
`,p=!0):r===``?f===`
`?d+=`
`:f=`
`:(d+=f+r,f=` `,p=!1)}switch(i.chomp){case`-`:break;case`+`:for(let e=s;e<o.length;++e)d+=`
`+o[e][0].slice(c);d[d.length-1]!==`
`&&(d+=`
`);break;default:d+=`
`}let m=r+i.length+t.source.length;return{value:d,type:a,comment:i.comment,range:[r,m,m]}}function In({offset:e,props:t},n,r){if(t[0].type!==`block-scalar-header`)return r(t[0],`IMPOSSIBLE`,`Block scalar header not found`),null;let{source:i}=t[0],a=i[0],o=0,s=``,c=-1;for(let t=1;t<i.length;++t){let n=i[t];if(!s&&(n===`-`||n===`+`))s=n;else{let r=Number(n);!o&&r?o=r:c===-1&&(c=e+t)}}c!==-1&&r(c,`UNEXPECTED_TOKEN`,`Block scalar header includes extra characters: ${i}`);let l=!1,u=``,d=i.length;for(let e=1;e<t.length;++e){let i=t[e];switch(i.type){case`space`:l=!0;case`newline`:d+=i.source.length;break;case`comment`:n&&!l&&r(i,`MISSING_CHAR`,`Comments must be separated from other tokens by white space characters`),d+=i.source.length,u=i.source.substring(1);break;case`error`:r(i,`UNEXPECTED_TOKEN`,i.message),d+=i.source.length;break;default:{r(i,`UNEXPECTED_TOKEN`,`Unexpected token in block scalar header: ${i.type}`);let e=i.source;e&&typeof e==`string`&&(d+=e.length)}}}return{mode:a,indent:o,chomp:s,comment:u,length:d}}function Ln(e){let t=e.split(/\n( *)/),n=t[0],r=n.match(/^( *)/),i=[r?.[1]?[r[1],n.slice(r[1].length)]:[``,n]];for(let e=1;e<t.length;e+=2)i.push([t[e],t[e+1]]);return i}function Rn(e,t,n){let{offset:r,type:i,source:a,end:o}=e,s,c,l=(e,t,i)=>n(r+e,t,i);switch(i){case`scalar`:s=Y.PLAIN,c=zn(a,l);break;case`single-quoted-scalar`:s=Y.QUOTE_SINGLE,c=Bn(a,l);break;case`double-quoted-scalar`:s=Y.QUOTE_DOUBLE,c=Hn(a,l);break;default:return n(e,`UNEXPECTED_TOKEN`,`Expected a flow scalar value, but found: ${i}`),{value:``,type:null,comment:``,range:[r,r+a.length,r+a.length]}}let u=r+a.length,d=kn(o,u,t,n);return{value:c,type:s,comment:d.comment,range:[r,u,d.offset]}}function zn(e,t){let n=``;switch(e[0]){case`	`:n=`a tab character`;break;case`,`:n=`flow indicator character ,`;break;case`%`:n=`directive indicator character %`;break;case`|`:case`>`:n=`block scalar indicator ${e[0]}`;break;case`@`:case"`":n=`reserved character ${e[0]}`}return n&&t(0,`BAD_SCALAR_START`,`Plain value cannot start with ${n}`),Vn(e)}function Bn(e,t){return(e[e.length-1]!==`'`||e.length===1)&&t(e.length,`MISSING_CHAR`,`Missing closing 'quote`),Vn(e.slice(1,-1)).replace(/''/g,`'`)}function Vn(e){let t=/(.*?)\r?\n/sy,n=t.exec(e);if(!n)return e;let r,i;try{r=RegExp(`(?<![ 	])[ 	]+$`),i=RegExp(`^[ 	]+|(?<![ 	])[ 	]+$`,`g`)}catch{r=/[ \t]+$/,i=/^[ \t]+|[ \t]+$/g}let a=n[1].replace(r,``),o=` `,s=t.lastIndex;for(;n=t.exec(e);){let e=n[1].replace(i,``);e===``?o===`
`?a+=o:o=`
`:(a+=o+e,o=` `),s=t.lastIndex}let c=/[ \t]*(.*)/sy;return c.lastIndex=s,n=c.exec(e),a+o+(n?.[1]??``)}function Hn(e,t){let n=``;for(let r=1;r<e.length-1;++r){let i=e[r];if(i!==`\r`||e[r+1]!==`
`){if(i===`
`){let{fold:t,offset:i}=Un(e,r);n+=t,r=i}else if(i===`\\`){let i=e[++r],a=Wn[i];if(a)n+=a;else if(i===`
`)for(i=e[r+1];i===` `||i===`	`;)i=e[++r+1];else if(i===`\r`&&e[r+1]===`
`)for(i=e[++r+1];i===` `||i===`	`;)i=e[++r+1];else if(i===`x`||i===`u`||i===`U`){let a=i===`x`?2:i===`u`?4:8;n+=Gn(e,r+1,a,t),r+=a}else{let i=e.substr(r-1,2);t(r-1,`BAD_DQ_ESCAPE`,`Invalid escape sequence ${i}`),n+=i}}else if(i===` `||i===`	`){let t=r,a=e[r+1];for(;a===` `||a===`	`;)a=e[++r+1];a!==`
`&&(a!==`\r`||e[r+2]!==`
`)&&(n+=r>t?e.slice(t,r+1):i)}else n+=i}}return(e[e.length-1]!==`"`||e.length===1)&&t(e.length,`MISSING_CHAR`,`Missing closing "quote`),n}function Un(e,t){let n=``,r=e[t+1];for(;(r===` `||r===`	`||r===`
`||r===`\r`)&&(r!==`\r`||e[t+2]===`
`);)r===`
`&&(n+=`
`),t+=1,r=e[t+1];return n||=` `,{fold:n,offset:t}}let Wn={0:`\0`,a:`\x07`,b:`\b`,e:`\x1B`,f:`\f`,n:`
`,r:`\r`,t:`	`,v:`\v`,N:``,_:`\xA0`,L:`\u2028`,P:`\u2029`," ":` `,'"':`"`,"/":`/`,"\\":`\\`,"	":`	`};function Gn(e,t,n,r){let i=e.substr(t,n),a=i.length===n&&/^[0-9a-fA-F]+$/.test(i)?parseInt(i,16):NaN;try{return String.fromCodePoint(a)}catch{let i=e.substr(t-2,n+2);return r(t-2,`BAD_DQ_ESCAPE`,`Invalid escape sequence ${i}`),i}}function Kn(e,t,n,r){let{value:i,type:a,comment:o,range:s}=t.type===`block-scalar`?Fn(e,t,r):Rn(t,e.options.strict,r),c=n?e.directives.tagName(n.source,e=>r(n,`TAG_RESOLVE_FAILED`,e)):null,l;l=e.options.stringKeys&&e.atKey?e.schema[B]:c?qn(e.schema,i,c,n,r):t.type===`scalar`?Jn(e,i,t,r):e.schema[B];let u;try{let a=l.resolve(i,e=>r(n??t,`TAG_RESOLVE_FAILED`,e),e.options);u=W(a)?a:new Y(a)}catch(e){let a=e instanceof Error?e.message:String(e);r(n??t,`TAG_RESOLVE_FAILED`,a),u=new Y(i)}return u.range=s,u.source=i,a&&(u.type=a),c&&(u.tag=c),l.format&&(u.format=l.format),o&&(u.comment=o),u}function qn(e,t,n,r,i){if(n===`!`)return e[B];let a=[];for(let t of e.tags)if(!t.collection&&t.tag===n){if(t.default&&t.test)a.push(t);else return t}for(let e of a)if(e.test?.test(t))return e;let o=e.knownTags[n];return o&&!o.collection?(e.tags.push(Object.assign({},o,{default:!1,test:void 0})),o):(i(r,`TAG_RESOLVE_FAILED`,`Unresolved tag: ${n}`,n!==`tag:yaml.org,2002:str`),e[B])}function Jn({atKey:e,directives:t,schema:n},r,i,a){let o=n.tags.find(t=>(t.default===!0||e&&t.default===`key`)&&t.test?.test(r))||n[B];if(n.compat){let e=n.compat.find(e=>e.default&&e.test?.test(r))??n[B];o.tag!==e.tag&&a(i,`TAG_RESOLVE_FAILED`,`Value may be parsed as either ${t.tagString(o.tag)} or ${t.tagString(e.tag)}`,!0)}return o}function Yn(e,t,n){if(t){n??=t.length;for(let r=n-1;r>=0;--r){let n=t[r];switch(n.type){case`space`:case`comment`:case`newline`:e-=n.source.length;continue}for(n=t[++r];n?.type===`space`;)e+=n.source.length,n=t[++r];break}}return e}let Xn={composeNode:Zn,composeEmptyNode:Qn};function Zn(e,t,n,r){let i=e.atKey,{spaceBefore:a,comment:o,anchor:s,tag:c}=n,l,u=!0;switch(t.type){case`alias`:l=$n(e,t,r),(s||c)&&r(t,`ALIAS_PROPS`,`An alias node must not specify any properties`);break;case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:case`block-scalar`:l=Kn(e,t,c,r),s&&(l.anchor=s.source.substring(1));break;case`block-map`:case`block-seq`:case`flow-collection`:try{l=Pn(Xn,e,t,n,r),s&&(l.anchor=s.source.substring(1))}catch(e){r(t,`RESOURCE_EXHAUSTION`,e instanceof Error?e.message:String(e))}break;default:r(t,`UNEXPECTED_TOKEN`,t.type===`error`?t.message:`Unsupported token (type: ${t.type})`),u=!1}return l??=Qn(e,t.offset,void 0,null,n,r),s&&l.anchor===``&&r(s,`BAD_ALIAS`,`Anchor cannot be an empty string`),i&&e.options.stringKeys&&(!W(l)||typeof l.value!=`string`||l.tag&&l.tag!==`tag:yaml.org,2002:str`)&&r(c??t,`NON_STRING_KEY`,`With stringKeys, all keys must be strings`),a&&(l.spaceBefore=!0),o&&(t.type===`scalar`&&t.source===``?l.comment=o:l.commentBefore=o),e.options.keepSourceTokens&&u&&(l.srcToken=t),l}function Qn(e,t,n,r,{spaceBefore:i,comment:a,anchor:o,tag:s,end:c},l){let u=Kn(e,{type:`scalar`,offset:Yn(t,n,r),indent:-1,source:``},s,l);return o&&(u.anchor=o.source.substring(1),u.anchor===``&&l(o,`BAD_ALIAS`,`Anchor cannot be an empty string`)),i&&(u.spaceBefore=!0),a&&(u.comment=a,u.range[2]=c),u}function $n({options:e},{offset:t,source:n,end:r},i){let a=new Te(n.substring(1));a.source===``&&i(t,`BAD_ALIAS`,`Alias cannot be an empty string`),a.source.endsWith(`:`)&&i(t+n.length-1,`BAD_ALIAS`,`Alias ending in : is ambiguous`,!0);let o=t+n.length,s=kn(r,o,e.strict,i);return a.range=[t,o,s.offset],s.comment&&(a.comment=s.comment),a}function er(e,t,{offset:n,start:r,value:i,end:a},o){let s=new gn(void 0,Object.assign({_directives:t},e)),c={atKey:!1,atRoot:!0,directives:s.directives,options:s.options,schema:s.schema},l=Sn(r,{indicator:`doc-start`,next:i??a?.[0],offset:n,onError:o,parentIndent:0,startOnNewline:!0});l.found&&(s.directives.docStart=!0,i&&(i.type===`block-map`||i.type===`block-seq`)&&!l.hasNewline&&o(l.end,`MISSING_CHAR`,`Block collection cannot start on same line with directives-end marker`)),s.contents=i?Zn(c,i,l,o):Qn(c,l.end,r,null,l,o);let u=s.contents.range[2],d=kn(a,u,!1,o);return d.comment&&(s.comment=d.comment),s.range=[n,u,d.offset],s}function tr(e){if(typeof e==`number`)return[e,e+1];if(Array.isArray(e))return e.length===2?e:[e[0],e[1]];let{offset:t,source:n}=e;return[t,t+(typeof n==`string`?n.length:1)]}function nr(e){let t=``,n=!1,r=!1;for(let i=0;i<e.length;++i){let a=e[i];switch(a[0]){case`#`:t+=(t===``?``:r?`

`:`
`)+(a.substring(1)||` `),n=!0,r=!1;break;case`%`:e[i+1]?.[0]!==`#`&&(i+=1),n=!1;break;default:n||(r=!0),n=!1}}return{comment:t,afterEmptyLine:r}}var rr=class{constructor(e={}){this.doc=null,this.atDirectives=!1,this.prelude=[],this.errors=[],this.warnings=[],this.onError=(e,t,n,r)=>{let i=tr(e);r?this.warnings.push(new bn(i,t,n)):this.errors.push(new yn(i,t,n))},this.directives=new ve({version:e.version||`1.2`}),this.options=e}decorate(e,t){let{comment:n,afterEmptyLine:r}=nr(this.prelude);if(n){let i=e.contents;if(t)e.comment=e.comment?`${e.comment}\n${n}`:n;else if(r||e.directives.docStart||!i)e.commentBefore=n;else if(K(i)&&!i.flow&&i.items.length>0){let e=i.items[0];U(e)&&(e=e.key);let t=e.commentBefore;e.commentBefore=t?`${n}\n${t}`:n}else{let e=i.commentBefore;i.commentBefore=e?`${n}\n${e}`:n}}if(t){for(let t=0;t<this.errors.length;++t)e.errors.push(this.errors[t]);for(let t=0;t<this.warnings.length;++t)e.warnings.push(this.warnings[t])}else e.errors=this.errors,e.warnings=this.warnings;this.prelude=[],this.errors=[],this.warnings=[]}streamInfo(){return{comment:nr(this.prelude).comment,directives:this.directives,errors:this.errors,warnings:this.warnings}}*compose(e,t=!1,n=-1){for(let t of e)yield*this.next(t);yield*this.end(t,n)}*next(e){switch(e.type){case`directive`:this.directives.add(e.source,(t,n,r)=>{let i=tr(e);i[0]+=t,this.onError(i,`BAD_DIRECTIVE`,n,r)}),this.prelude.push(e.source),this.atDirectives=!0;break;case`document`:{let t=er(this.options,this.directives,e,this.onError);this.atDirectives&&!t.directives.docStart&&this.onError(e,`MISSING_CHAR`,`Missing directives-end/doc-start indicator line`),this.decorate(t,!1),this.doc&&(yield this.doc),this.doc=t,this.atDirectives=!1;break}case`byte-order-mark`:case`space`:break;case`comment`:case`newline`:this.prelude.push(e.source);break;case`error`:{let t=e.source?`${e.message}: ${JSON.stringify(e.source)}`:e.message,n=new yn(tr(e),`UNEXPECTED_TOKEN`,t);this.atDirectives||!this.doc?this.errors.push(n):this.doc.errors.push(n);break}case`doc-end`:{if(!this.doc){this.errors.push(new yn(tr(e),`UNEXPECTED_TOKEN`,`Unexpected doc-end without preceding document`));break}this.doc.directives.docEnd=!0;let t=kn(e.end,e.offset+e.source.length,this.doc.options.strict,this.onError);if(this.decorate(this.doc,!0),t.comment){let e=this.doc.comment;this.doc.comment=e?`${e}\n${t.comment}`:t.comment}this.doc.range[2]=t.offset;break}default:this.errors.push(new yn(tr(e),`UNEXPECTED_TOKEN`,`Unsupported token ${e.type}`))}}*end(e=!1,t=-1){if(this.doc)this.decorate(this.doc,!0),yield this.doc,this.doc=null;else if(e){let e=new gn(void 0,Object.assign({_directives:this.directives},this.options));this.atDirectives&&this.onError(t,`MISSING_CHAR`,`Missing directives-end indicator line`),e.range=[0,t,t],this.decorate(e,!1),yield e}}};let ir=Symbol(`break visit`),ar=Symbol(`skip children`),or=Symbol(`remove item`);function sr(e,t){`type`in e&&e.type===`document`&&(e={start:e.start,value:e.value}),cr(Object.freeze([]),e,t)}sr.BREAK=ir,sr.SKIP=ar,sr.REMOVE=or,sr.itemAtPath=(e,t)=>{let n=e;for(let[e,r]of t){let t=n?.[e];if(t&&`items`in t)n=t.items[r];else return}return n},sr.parentCollection=(e,t)=>{let n=sr.itemAtPath(e,t.slice(0,-1)),r=t[t.length-1][0],i=n?.[r];if(i&&`items`in i)return i;throw Error(`Parent collection not found`)};function cr(e,t,n){let r=n(t,e);if(typeof r==`symbol`)return r;for(let i of[`key`,`value`]){let a=t[i];if(a&&`items`in a){for(let t=0;t<a.items.length;++t){let r=cr(Object.freeze(e.concat([[i,t]])),a.items[t],n);if(typeof r==`number`)t=r-1;else if(r===ir)return ir;else r===or&&(a.items.splice(t,1),--t)}typeof r==`function`&&i===`key`&&(r=r(t,e))}}return typeof r==`function`?r(t,e):r}function lr(e){switch(e){case`﻿`:return`byte-order-mark`;case``:return`doc-mode`;case``:return`flow-error-end`;case``:return`scalar`;case`---`:return`doc-start`;case`...`:return`doc-end`;case``:case`
`:case`\r
`:return`newline`;case`-`:return`seq-item-ind`;case`?`:return`explicit-key-ind`;case`:`:return`map-value-ind`;case`{`:return`flow-map-start`;case`}`:return`flow-map-end`;case`[`:return`flow-seq-start`;case`]`:return`flow-seq-end`;case`,`:return`comma`}switch(e[0]){case` `:case`	`:return`space`;case`#`:return`comment`;case`%`:return`directive-line`;case`*`:return`alias`;case`&`:return`anchor`;case`!`:return`tag`;case`'`:return`single-quoted-scalar`;case`"`:return`double-quoted-scalar`;case`|`:case`>`:return`block-scalar-header`}return null}function ur(e){switch(e){case void 0:case` `:case`
`:case`\r`:case`	`:return!0;default:return!1}}let dr=new Set(`0123456789ABCDEFabcdef`),fr=new Set(`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()`),pr=new Set(`,[]{}`),mr=new Set(` ,[]{}
\r	`),hr=e=>!e||mr.has(e);var gr=class{constructor(){this.atEnd=!1,this.blockScalarIndent=-1,this.blockScalarKeep=!1,this.buffer=``,this.flowKey=!1,this.flowLevel=0,this.indentNext=0,this.indentValue=0,this.lineEndPos=null,this.next=null,this.pos=0}*lex(e,t=!1){if(e){if(typeof e!=`string`)throw TypeError(`source is not a string`);this.buffer=this.buffer?this.buffer+e:e,this.lineEndPos=null}this.atEnd=!t;let n=this.next??`stream`;for(;n&&(t||this.hasChars(1));)n=yield*this.parseNext(n)}atLineEnd(){let e=this.pos,t=this.buffer[e];for(;t===` `||t===`	`;)t=this.buffer[++e];return!t||t===`#`||t===`
`||t===`\r`&&this.buffer[e+1]===`
`}charAt(e){return this.buffer[this.pos+e]}continueScalar(e){let t=this.buffer[e];if(this.indentNext>0){let n=0;for(;t===` `;)t=this.buffer[++n+e];if(t===`\r`){let t=this.buffer[n+e+1];if(t===`
`||!t&&!this.atEnd)return e+n+1}return t===`
`||n>=this.indentNext||!t&&!this.atEnd?e+n:-1}if(t===`-`||t===`.`){let t=this.buffer.substr(e,3);if((t===`---`||t===`...`)&&ur(this.buffer[e+3]))return-1}return e}getLine(){let e=this.lineEndPos;return(typeof e!=`number`||e!==-1&&e<this.pos)&&(e=this.buffer.indexOf(`
`,this.pos),this.lineEndPos=e),e===-1?this.atEnd?this.buffer.substring(this.pos):null:(this.buffer[e-1]===`\r`&&--e,this.buffer.substring(this.pos,e))}hasChars(e){return this.pos+e<=this.buffer.length}setNext(e){return this.buffer=this.buffer.substring(this.pos),this.pos=0,this.lineEndPos=null,this.next=e,null}peek(e){return this.buffer.substr(this.pos,e)}*parseNext(e){switch(e){case`stream`:return yield*this.parseStream();case`line-start`:return yield*this.parseLineStart();case`block-start`:return yield*this.parseBlockStart();case`doc`:return yield*this.parseDocument();case`flow`:return yield*this.parseFlowCollection();case`quoted-scalar`:return yield*this.parseQuotedScalar();case`block-scalar`:return yield*this.parseBlockScalar();case`plain-scalar`:return yield*this.parsePlainScalar()}}*parseStream(){let e=this.getLine();if(e===null)return this.setNext(`stream`);if(e[0]===`﻿`&&(yield*this.pushCount(1),e=e.substring(1)),e[0]===`%`){let t=e.length,n=e.indexOf(`#`);for(;n!==-1;){let r=e[n-1];if(r===` `||r===`	`){t=n-1;break}n=e.indexOf(`#`,n+1)}for(;;){let n=e[t-1];if(n===` `||n===`	`)--t;else break}let r=(yield*this.pushCount(t))+(yield*this.pushSpaces(!0));return yield*this.pushCount(e.length-r),this.pushNewline(),`stream`}if(this.atLineEnd()){let t=yield*this.pushSpaces(!0);return yield*this.pushCount(e.length-t),yield*this.pushNewline(),`stream`}return yield``,yield*this.parseLineStart()}*parseLineStart(){let e=this.charAt(0);if(!e&&!this.atEnd)return this.setNext(`line-start`);if(e===`-`||e===`.`){if(!this.atEnd&&!this.hasChars(4))return this.setNext(`line-start`);let e=this.peek(3);if((e===`---`||e===`...`)&&ur(this.charAt(3)))return yield*this.pushCount(3),this.indentValue=0,this.indentNext=0,e===`---`?`doc`:`stream`}return this.indentValue=yield*this.pushSpaces(!1),this.indentNext>this.indentValue&&!ur(this.charAt(1))&&(this.indentNext=this.indentValue),yield*this.parseBlockStart()}*parseBlockStart(){let[e,t]=this.peek(2);if(!t&&!this.atEnd)return this.setNext(`block-start`);if((e===`-`||e===`?`||e===`:`)&&ur(t)){let e=(yield*this.pushCount(1))+(yield*this.pushSpaces(!0));return this.indentNext=this.indentValue+1,this.indentValue+=e,`block-start`}return`doc`}*parseDocument(){yield*this.pushSpaces(!0);let e=this.getLine();if(e===null)return this.setNext(`doc`);let t=yield*this.pushIndicators();switch(e[t]){case`#`:yield*this.pushCount(e.length-t);case void 0:return yield*this.pushNewline(),yield*this.parseLineStart();case`{`:case`[`:return yield*this.pushCount(1),this.flowKey=!1,this.flowLevel=1,`flow`;case`}`:case`]`:return yield*this.pushCount(1),`doc`;case`*`:return yield*this.pushUntil(hr),`doc`;case`"`:case`'`:return yield*this.parseQuotedScalar();case`|`:case`>`:return t+=yield*this.parseBlockScalarHeader(),t+=yield*this.pushSpaces(!0),yield*this.pushCount(e.length-t),yield*this.pushNewline(),yield*this.parseBlockScalar();default:return yield*this.parsePlainScalar()}}*parseFlowCollection(){let e,t,n=-1;do e=yield*this.pushNewline(),e>0?(t=yield*this.pushSpaces(!1),this.indentValue=n=t):t=0,t+=yield*this.pushSpaces(!0);while(e+t>0);let r=this.getLine();if(r===null)return this.setNext(`flow`);if((n!==-1&&n<this.indentNext&&r[0]!==`#`||n===0&&(r.startsWith(`---`)||r.startsWith(`...`))&&ur(r[3]))&&(n!==this.indentNext-1||this.flowLevel!==1||r[0]!==`]`&&r[0]!==`}`))return this.flowLevel=0,yield``,yield*this.parseLineStart();let i=0;for(;r[i]===`,`;)i+=yield*this.pushCount(1),i+=yield*this.pushSpaces(!0),this.flowKey=!1;switch(i+=yield*this.pushIndicators(),r[i]){case void 0:return`flow`;case`#`:return yield*this.pushCount(r.length-i),`flow`;case`{`:case`[`:return yield*this.pushCount(1),this.flowKey=!1,this.flowLevel+=1,`flow`;case`}`:case`]`:return yield*this.pushCount(1),this.flowKey=!0,--this.flowLevel,this.flowLevel?`flow`:`doc`;case`*`:return yield*this.pushUntil(hr),`flow`;case`"`:case`'`:return this.flowKey=!0,yield*this.parseQuotedScalar();case`:`:{let e=this.charAt(1);if(this.flowKey||ur(e)||e===`,`)return this.flowKey=!1,yield*this.pushCount(1),yield*this.pushSpaces(!0),`flow`}default:return this.flowKey=!1,yield*this.parsePlainScalar()}}*parseQuotedScalar(){let e=this.charAt(0),t=this.buffer.indexOf(e,this.pos+1);if(e===`'`)for(;t!==-1&&this.buffer[t+1]===`'`;)t=this.buffer.indexOf(`'`,t+2);else for(;t!==-1;){let e=0;for(;this.buffer[t-1-e]===`\\`;)e+=1;if(e%2==0)break;t=this.buffer.indexOf(`"`,t+1)}let n=this.buffer.substring(0,t),r=n.indexOf(`
`,this.pos);if(r!==-1){for(;r!==-1;){let e=this.continueScalar(r+1);if(e===-1)break;r=n.indexOf(`
`,e)}r!==-1&&(t=r-(n[r-1]===`\r`?2:1))}if(t===-1){if(!this.atEnd)return this.setNext(`quoted-scalar`);t=this.buffer.length}return yield*this.pushToIndex(t+1,!1),this.flowLevel?`flow`:`doc`}*parseBlockScalarHeader(){this.blockScalarIndent=-1,this.blockScalarKeep=!1;let e=this.pos;for(;;){let t=this.buffer[++e];if(t===`+`)this.blockScalarKeep=!0;else if(t>`0`&&t<=`9`)this.blockScalarIndent=Number(t)-1;else if(t!==`-`)break}return yield*this.pushUntil(e=>ur(e)||e===`#`)}*parseBlockScalar(){let e=this.pos-1,t=0,n;loop:for(let r=this.pos;n=this.buffer[r];++r)switch(n){case` `:t+=1;break;case`
`:e=r,t=0;break;case`\r`:{let e=this.buffer[r+1];if(!e&&!this.atEnd)return this.setNext(`block-scalar`);if(e===`
`)break}default:break loop}if(!n&&!this.atEnd)return this.setNext(`block-scalar`);if(t>=this.indentNext){this.indentNext=this.blockScalarIndent===-1?t:this.blockScalarIndent+(this.indentNext===0?1:this.indentNext);do{let t=this.continueScalar(e+1);if(t===-1)break;e=this.buffer.indexOf(`
`,t)}while(e!==-1);if(e===-1){if(!this.atEnd)return this.setNext(`block-scalar`);e=this.buffer.length}}let r=e+1;for(n=this.buffer[r];n===` `;)n=this.buffer[++r];if(n===`	`){for(;n===`	`||n===` `||n===`\r`||n===`
`;)n=this.buffer[++r];e=r-1}else if(!this.blockScalarKeep)do{let n=e-1,r=this.buffer[n];r===`\r`&&(r=this.buffer[--n]);let i=n;for(;r===` `;)r=this.buffer[--n];if(r===`
`&&n>=this.pos&&n+1+t>i)e=n;else break}while(1);return yield``,yield*this.pushToIndex(e+1,!0),yield*this.parseLineStart()}*parsePlainScalar(){let e=this.flowLevel>0,t=this.pos-1,n=this.pos-1,r;for(;r=this.buffer[++n];)if(r===`:`){let r=this.buffer[n+1];if(ur(r)||e&&pr.has(r))break;t=n}else if(ur(r)){let i=this.buffer[n+1];if(r===`\r`&&(i===`
`?(n+=1,r=`
`,i=this.buffer[n+1]):t=n),i===`#`||e&&pr.has(i))break;if(r===`
`){let e=this.continueScalar(n+1);if(e===-1)break;n=Math.max(n,e-2)}}else{if(e&&pr.has(r))break;t=n}return!r&&!this.atEnd?this.setNext(`plain-scalar`):(yield``,yield*this.pushToIndex(t+1,!0),e?`flow`:`doc`)}*pushCount(e){return e>0?(yield this.buffer.substr(this.pos,e),this.pos+=e,e):0}*pushToIndex(e,t){let n=this.buffer.slice(this.pos,e);return n?(yield n,this.pos+=n.length,n.length):(t&&(yield``),0)}*pushIndicators(){let e=0;loop:for(;;){switch(this.charAt(0)){case`!`:e+=yield*this.pushTag(),e+=yield*this.pushSpaces(!0);continue loop;case`&`:e+=yield*this.pushUntil(hr),e+=yield*this.pushSpaces(!0);continue loop;case`-`:case`?`:case`:`:{let t=this.flowLevel>0,n=this.charAt(1);if(ur(n)||t&&pr.has(n)){t?this.flowKey&&=!1:this.indentNext=this.indentValue+1,e+=yield*this.pushCount(1),e+=yield*this.pushSpaces(!0);continue loop}}}break loop}return e}*pushTag(){if(this.charAt(1)===`<`){let e=this.pos+2,t=this.buffer[e];for(;!ur(t)&&t!==`>`;)t=this.buffer[++e];return yield*this.pushToIndex(t===`>`?e+1:e,!1)}{let e=this.pos+1,t=this.buffer[e];for(;t;)if(fr.has(t))t=this.buffer[++e];else if(t===`%`&&dr.has(this.buffer[e+1])&&dr.has(this.buffer[e+2]))t=this.buffer[e+=3];else break;return yield*this.pushToIndex(e,!1)}}*pushNewline(){let e=this.buffer[this.pos];return e===`
`?yield*this.pushCount(1):e===`\r`&&this.charAt(1)===`
`?yield*this.pushCount(2):0}*pushSpaces(e){let t=this.pos-1,n;do n=this.buffer[++t];while(n===` `||e&&n===`	`);let r=t-this.pos;return r>0&&(yield this.buffer.substr(this.pos,r),this.pos=t),r}*pushUntil(e){let t=this.pos,n=this.buffer[t];for(;!e(n);)n=this.buffer[++t];return yield*this.pushToIndex(t,!1)}},_r=class{constructor(){this.lineStarts=[],this.addNewLine=e=>this.lineStarts.push(e),this.linePos=e=>{let t=0,n=this.lineStarts.length;for(;t<n;){let r=t+n>>1;this.lineStarts[r]<e?t=r+1:n=r}if(this.lineStarts[t]===e)return{line:t+1,col:1};if(t===0)return{line:0,col:e};let r=this.lineStarts[t-1];return{line:t,col:e-r+1}}}};function vr(e,t){for(let n=0;n<e.length;++n)if(e[n].type===t)return!0;return!1}function yr(e){for(let t=0;t<e.length;++t)switch(e[t].type){case`space`:case`comment`:case`newline`:break;default:return t}return-1}function br(e){switch(e?.type){case`alias`:case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:case`flow-collection`:return!0;default:return!1}}function xr(e){switch(e.type){case`document`:return e.start;case`block-map`:{let t=e.items[e.items.length-1];return t.sep??t.start}case`block-seq`:return e.items[e.items.length-1].start;default:return[]}}function Sr(e){if(e.length===0)return[];let t=e.length;loop:for(;--t>=0;)switch(e[t].type){case`doc-start`:case`explicit-key-ind`:case`map-value-ind`:case`seq-item-ind`:case`newline`:break loop}for(;e[++t]?.type===`space`;);return e.splice(t,e.length)}function Cr(e,t){if(t.length<1e5)Array.prototype.push.apply(e,t);else for(let n=0;n<t.length;++n)e.push(t[n])}function wr(e){if(e.start.type===`flow-seq-start`)for(let t of e.items)t.sep&&!t.value&&!vr(t.start,`explicit-key-ind`)&&!vr(t.sep,`map-value-ind`)&&(t.key&&(t.value=t.key),delete t.key,br(t.value)?t.value.end?Cr(t.value.end,t.sep):t.value.end=t.sep:Cr(t.start,t.sep),delete t.sep)}var Tr=class{constructor(e){this.atNewLine=!0,this.atScalar=!1,this.indent=0,this.offset=0,this.onKeyLine=!1,this.stack=[],this.source=``,this.type=``,this.lexer=new gr,this.onNewLine=e}*parse(e,t=!1){this.onNewLine&&this.offset===0&&this.onNewLine(0);for(let n of this.lexer.lex(e,t))yield*this.next(n);t||(yield*this.end())}*next(e){if(this.source=e,this.atScalar){this.atScalar=!1,yield*this.step(),this.offset+=e.length;return}let t=lr(e);if(!t){let t=`Not a YAML token: ${e}`;yield*this.pop({type:`error`,offset:this.offset,message:t,source:e}),this.offset+=e.length}else if(t===`scalar`)this.atNewLine=!1,this.atScalar=!0,this.type=`scalar`;else{switch(this.type=t,yield*this.step(),t){case`newline`:this.atNewLine=!0,this.indent=0,this.onNewLine&&this.onNewLine(this.offset+e.length);break;case`space`:this.atNewLine&&e[0]===` `&&(this.indent+=e.length);break;case`explicit-key-ind`:case`map-value-ind`:case`seq-item-ind`:this.atNewLine&&(this.indent+=e.length);break;case`doc-mode`:case`flow-error-end`:return;default:this.atNewLine=!1}this.offset+=e.length}}*end(){for(;this.stack.length>0;)yield*this.pop()}get sourceToken(){return{type:this.type,offset:this.offset,indent:this.indent,source:this.source}}*step(){let e=this.peek(1);if(this.type===`doc-end`&&e?.type!==`doc-end`){for(;this.stack.length>0;)yield*this.pop();this.stack.push({type:`doc-end`,offset:this.offset,source:this.source})}else{if(!e)return yield*this.stream();switch(e.type){case`document`:return yield*this.document(e);case`alias`:case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:return yield*this.scalar(e);case`block-scalar`:return yield*this.blockScalar(e);case`block-map`:return yield*this.blockMap(e);case`block-seq`:return yield*this.blockSequence(e);case`flow-collection`:return yield*this.flowCollection(e);case`doc-end`:return yield*this.documentEnd(e)}yield*this.pop()}}peek(e){return this.stack[this.stack.length-e]}*pop(e){let t=e??this.stack.pop();if(!t)yield{type:`error`,offset:this.offset,source:``,message:`Tried to pop an empty stack`};else if(this.stack.length===0)yield t;else{let e=this.peek(1);switch(t.type===`block-scalar`?t.indent=`indent`in e?e.indent:0:t.type===`flow-collection`&&e.type===`document`&&(t.indent=0),t.type===`flow-collection`&&wr(t),e.type){case`document`:e.value=t;break;case`block-scalar`:e.props.push(t);break;case`block-map`:{let n=e.items[e.items.length-1];if(n.value){e.items.push({start:[],key:t,sep:[]}),this.onKeyLine=!0;return}if(n.sep)n.value=t;else{Object.assign(n,{key:t,sep:[]}),this.onKeyLine=!n.explicitKey;return}break}case`block-seq`:{let n=e.items[e.items.length-1];n.value?e.items.push({start:[],value:t}):n.value=t;break}case`flow-collection`:{let n=e.items[e.items.length-1];!n||n.value?e.items.push({start:[],key:t,sep:[]}):n.sep?n.value=t:Object.assign(n,{key:t,sep:[]});return}default:yield*this.pop(),yield*this.pop(t)}if((e.type===`document`||e.type===`block-map`||e.type===`block-seq`)&&(t.type===`block-map`||t.type===`block-seq`)){let n=t.items[t.items.length-1];n&&!n.sep&&!n.value&&n.start.length>0&&yr(n.start)===-1&&(t.indent===0||n.start.every(e=>e.type!==`comment`||e.indent<t.indent))&&(e.type===`document`?e.end=n.start:e.items.push({start:n.start}),t.items.splice(-1,1))}}}*stream(){switch(this.type){case`directive-line`:yield{type:`directive`,offset:this.offset,source:this.source};return;case`byte-order-mark`:case`space`:case`comment`:case`newline`:yield this.sourceToken;return;case`doc-mode`:case`doc-start`:{let e={type:`document`,offset:this.offset,start:[]};this.type===`doc-start`&&e.start.push(this.sourceToken),this.stack.push(e);return}}yield{type:`error`,offset:this.offset,message:`Unexpected ${this.type} token in YAML stream`,source:this.source}}*document(e){if(e.value)return yield*this.lineEnd(e);switch(this.type){case`doc-start`:yr(e.start)===-1?e.start.push(this.sourceToken):(yield*this.pop(),yield*this.step());return;case`anchor`:case`tag`:case`space`:case`comment`:case`newline`:e.start.push(this.sourceToken);return}let t=this.startBlockValue(e);t?this.stack.push(t):yield{type:`error`,offset:this.offset,message:`Unexpected ${this.type} token in YAML document`,source:this.source}}*scalar(e){if(this.type===`map-value-ind`){let t=Sr(xr(this.peek(2))),n;e.end?(n=e.end,n.push(this.sourceToken),delete e.end):n=[this.sourceToken];let r={type:`block-map`,offset:e.offset,indent:e.indent,items:[{start:t,key:e,sep:n}]};this.onKeyLine=!0,this.stack[this.stack.length-1]=r}else yield*this.lineEnd(e)}*blockScalar(e){switch(this.type){case`space`:case`comment`:case`newline`:e.props.push(this.sourceToken);return;case`scalar`:if(e.source=this.source,this.atNewLine=!0,this.indent=0,this.onNewLine){let e=this.source.indexOf(`
`)+1;for(;e!==0;)this.onNewLine(this.offset+e),e=this.source.indexOf(`
`,e)+1}yield*this.pop();break;default:yield*this.pop(),yield*this.step()}}*blockMap(e){let t=e.items[e.items.length-1];switch(this.type){case`newline`:if(this.onKeyLine=!1,t.value){let n=`end`in t.value?t.value.end:void 0;(Array.isArray(n)?n[n.length-1]:void 0)?.type===`comment`?n?.push(this.sourceToken):e.items.push({start:[this.sourceToken]})}else t.sep?t.sep.push(this.sourceToken):t.start.push(this.sourceToken);return;case`space`:case`comment`:if(t.value)e.items.push({start:[this.sourceToken]});else if(t.sep)t.sep.push(this.sourceToken);else{if(this.atIndentedComment(t.start,e.indent)){let n=e.items[e.items.length-2]?.value?.end;if(Array.isArray(n)){Cr(n,t.start),n.push(this.sourceToken),e.items.pop();return}}t.start.push(this.sourceToken)}return}if(this.indent>=e.indent){let n=!this.onKeyLine&&this.indent===e.indent,r=n&&(t.sep||t.explicitKey)&&this.type!==`seq-item-ind`,i=[];if(r&&t.sep&&!t.value){let n=[];for(let r=0;r<t.sep.length;++r){let i=t.sep[r];switch(i.type){case`newline`:n.push(r);break;case`space`:break;case`comment`:i.indent>e.indent&&(n.length=0);break;default:n.length=0}}n.length>=2&&(i=t.sep.splice(n[1]))}switch(this.type){case`anchor`:case`tag`:r||t.value?(i.push(this.sourceToken),e.items.push({start:i}),this.onKeyLine=!0):t.sep?t.sep.push(this.sourceToken):t.start.push(this.sourceToken);return;case`explicit-key-ind`:!t.sep&&!t.explicitKey?(t.start.push(this.sourceToken),t.explicitKey=!0):r||t.value?(i.push(this.sourceToken),e.items.push({start:i,explicitKey:!0})):this.stack.push({type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:[this.sourceToken],explicitKey:!0}]}),this.onKeyLine=!0;return;case`map-value-ind`:if(t.explicitKey){if(!t.sep){if(vr(t.start,`newline`))Object.assign(t,{key:null,sep:[this.sourceToken]});else{let e=Sr(t.start);this.stack.push({type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:e,key:null,sep:[this.sourceToken]}]})}}else if(t.value)e.items.push({start:[],key:null,sep:[this.sourceToken]});else if(vr(t.sep,`map-value-ind`))this.stack.push({type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:i,key:null,sep:[this.sourceToken]}]});else if(br(t.key)&&!vr(t.sep,`newline`)){let e=Sr(t.start),n=t.key,r=t.sep;r.push(this.sourceToken),delete t.key,delete t.sep,this.stack.push({type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:e,key:n,sep:r}]})}else i.length>0?t.sep=t.sep.concat(i,this.sourceToken):t.sep.push(this.sourceToken)}else t.sep?t.value||r?e.items.push({start:i,key:null,sep:[this.sourceToken]}):vr(t.sep,`map-value-ind`)?this.stack.push({type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:[],key:null,sep:[this.sourceToken]}]}):t.sep.push(this.sourceToken):Object.assign(t,{key:null,sep:[this.sourceToken]});this.onKeyLine=!0;return;case`alias`:case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:{let n=this.flowScalar(this.type);r||t.value?(e.items.push({start:i,key:n,sep:[]}),this.onKeyLine=!0):t.sep?this.stack.push(n):(Object.assign(t,{key:n,sep:[]}),this.onKeyLine=!0);return}default:{let r=this.startBlockValue(e);if(r){if(r.type===`block-seq`){if(!t.explicitKey&&t.sep&&!vr(t.sep,`newline`)){yield*this.pop({type:`error`,offset:this.offset,message:`Unexpected block-seq-ind on same line with key`,source:this.source});return}}else n&&e.items.push({start:i});this.stack.push(r);return}}}}yield*this.pop(),yield*this.step()}*blockSequence(e){let t=e.items[e.items.length-1];switch(this.type){case`newline`:if(t.value){let n=`end`in t.value?t.value.end:void 0;(Array.isArray(n)?n[n.length-1]:void 0)?.type===`comment`?n?.push(this.sourceToken):e.items.push({start:[this.sourceToken]})}else t.start.push(this.sourceToken);return;case`space`:case`comment`:if(t.value)e.items.push({start:[this.sourceToken]});else{if(this.atIndentedComment(t.start,e.indent)){let n=e.items[e.items.length-2]?.value?.end;if(Array.isArray(n)){Cr(n,t.start),n.push(this.sourceToken),e.items.pop();return}}t.start.push(this.sourceToken)}return;case`anchor`:case`tag`:if(t.value||this.indent<=e.indent)break;t.start.push(this.sourceToken);return;case`seq-item-ind`:if(this.indent!==e.indent)break;t.value||vr(t.start,`seq-item-ind`)?e.items.push({start:[this.sourceToken]}):t.start.push(this.sourceToken);return}if(this.indent>e.indent){let t=this.startBlockValue(e);if(t){this.stack.push(t);return}}yield*this.pop(),yield*this.step()}*flowCollection(e){let t=e.items[e.items.length-1];if(this.type===`flow-error-end`){let e;do yield*this.pop(),e=this.peek(1);while(e?.type===`flow-collection`)}else if(e.end.length===0){switch(this.type){case`comma`:case`explicit-key-ind`:!t||t.sep?e.items.push({start:[this.sourceToken]}):t.start.push(this.sourceToken);return;case`map-value-ind`:!t||t.value?e.items.push({start:[],key:null,sep:[this.sourceToken]}):t.sep?t.sep.push(this.sourceToken):Object.assign(t,{key:null,sep:[this.sourceToken]});return;case`space`:case`comment`:case`newline`:case`anchor`:case`tag`:!t||t.value?e.items.push({start:[this.sourceToken]}):t.sep?t.sep.push(this.sourceToken):t.start.push(this.sourceToken);return;case`alias`:case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:{let n=this.flowScalar(this.type);!t||t.value?e.items.push({start:[],key:n,sep:[]}):t.sep?this.stack.push(n):Object.assign(t,{key:n,sep:[]});return}case`flow-map-end`:case`flow-seq-end`:e.end.push(this.sourceToken);return}let n=this.startBlockValue(e);n?this.stack.push(n):(yield*this.pop(),yield*this.step())}else{let t=this.peek(2);if(t.type===`block-map`&&(this.type===`map-value-ind`&&t.indent===e.indent||this.type===`newline`&&!t.items[t.items.length-1].sep))yield*this.pop(),yield*this.step();else if(this.type===`map-value-ind`&&t.type!==`flow-collection`){let n=Sr(xr(t));wr(e);let r=e.end.splice(1,e.end.length);r.push(this.sourceToken);let i={type:`block-map`,offset:e.offset,indent:e.indent,items:[{start:n,key:e,sep:r}]};this.onKeyLine=!0,this.stack[this.stack.length-1]=i}else yield*this.lineEnd(e)}}flowScalar(e){if(this.onNewLine){let e=this.source.indexOf(`
`)+1;for(;e!==0;)this.onNewLine(this.offset+e),e=this.source.indexOf(`
`,e)+1}return{type:e,offset:this.offset,indent:this.indent,source:this.source}}startBlockValue(e){switch(this.type){case`alias`:case`scalar`:case`single-quoted-scalar`:case`double-quoted-scalar`:return this.flowScalar(this.type);case`block-scalar-header`:return{type:`block-scalar`,offset:this.offset,indent:this.indent,props:[this.sourceToken],source:``};case`flow-map-start`:case`flow-seq-start`:return{type:`flow-collection`,offset:this.offset,indent:this.indent,start:this.sourceToken,items:[],end:[]};case`seq-item-ind`:return{type:`block-seq`,offset:this.offset,indent:this.indent,items:[{start:[this.sourceToken]}]};case`explicit-key-ind`:{this.onKeyLine=!0;let t=Sr(xr(e));return t.push(this.sourceToken),{type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:t,explicitKey:!0}]}}case`map-value-ind`:{this.onKeyLine=!0;let t=Sr(xr(e));return{type:`block-map`,offset:this.offset,indent:this.indent,items:[{start:t,key:null,sep:[this.sourceToken]}]}}}return null}atIndentedComment(e,t){return this.type!==`comment`||this.indent<=t?!1:e.every(e=>e.type===`newline`||e.type===`space`)}*documentEnd(e){this.type!==`doc-mode`&&(e.end?e.end.push(this.sourceToken):e.end=[this.sourceToken],this.type===`newline`&&(yield*this.pop()))}*lineEnd(e){switch(this.type){case`comma`:case`doc-start`:case`doc-end`:case`flow-seq-end`:case`flow-map-end`:case`map-value-ind`:yield*this.pop(),yield*this.step();break;case`newline`:this.onKeyLine=!1;default:e.end?e.end.push(this.sourceToken):e.end=[this.sourceToken],this.type===`newline`&&(yield*this.pop())}}};function Er(e){let t=e.prettyErrors!==!1;return{lineCounter:e.lineCounter||t&&new _r||null,prettyErrors:t}}function Dr(e,t={}){let{lineCounter:n,prettyErrors:r}=Er(t),i=new Tr(n?.addNewLine),a=new rr(t),o=null;for(let t of a.compose(i.parse(e),!0,e.length))if(!o)o=t;else if(o.options.logLevel!==`silent`){o.errors.push(new yn(t.range.slice(0,2),`MULTIPLE_DOCS`,`Source contains multiple documents; please use YAML.parseAllDocuments()`));break}return r&&n&&(o.errors.forEach(xn(e,n)),o.warnings.forEach(xn(e,n))),o}var $=class extends Error{constructor(e){super(e),this.name=`RouteYamlError`}};let Or=[`provider`,`model`,`reasoningEffort`],kr=[`path`,...Or];function Ar(e){let t=Dr(e),n=t.errors[0];if(n!==void 0)throw new $(`路由表不是合法 YAML：${n.message}`);return t}function jr(e,t,n){if(!(e instanceof Map))throw new $(`${n} 必须是对象`);for(let r of e.keys())if(typeof r!=`string`||!t.includes(r))throw new $(`${n} 含未知字段 "${String(r)}"，只接受 ${t.join(`/`)}`);return e}function Mr(e,t,n){if(!e.has(t))return;let r=e.get(t);if(typeof r!=`string`||r.trim()===``)throw new $(`${n} 的 ${t} 必须是非空字符串`);return r.trim()}function Nr(e,t){let n=Mr(e,`provider`,t),r=Mr(e,`model`,t),i=Mr(e,`reasoningEffort`,t);if(n===void 0!=(r===void 0))throw new $(`${t} 的 provider 与 model 必须同时出现或同时省略`);if(n===void 0&&i===void 0)throw new $(`${t} 至少要指定 provider/model 或 reasoningEffort`);return{...n===void 0?{}:{provider:n},...r===void 0?{}:{model:r},...i===void 0?{}:{reasoningEffort:i}}}function Pr(e,t){let n=`routes[${t}]`,r=jr(e,kr,n),i=r.get(`path`);if(typeof i!=`string`)throw new $(`${n} 缺少字符串字段 path`);if(i.trim()===``)throw new $(`路由条目的 path 不能为空`);return{path:i,...Nr(r,n)}}function Fr(e){let t;try{t=e.toJS({mapAsMap:!0})}catch(e){throw new $(`路由表不是合法 YAML：${e instanceof Error?e.message:String(e)}`)}if(t==null)return{fallback:void 0,routes:[]};let n=jr(t,[`default`,`routes`],`路由表根节点`),r=n.get(`default`),i=r==null?void 0:Nr(jr(r,Or,`default`),`default`),a=n.get(`routes`);if(a==null)return{fallback:i,routes:[]};if(!Array.isArray(a))throw new $(`routes 必须是数组`);return{fallback:i,routes:a.map(Pr)}}function Ir(e){return Fr(Ar(e))}function Lr(e){return new Map(Object.entries(e).filter(([,e])=>e!==void 0))}function Rr(e,t){return q(t)&&(e.comment=t.comment,e.commentBefore=t.commentBefore,e.spaceBefore=t.spaceBefore),e}function zr(e,t,n){for(let r of kr)t[r]!==n[r]&&(n[r]===void 0?e.delete(r):e.set(r,n[r]))}function Br(e,t){let n=Ar(e),r=Fr(n),i=n.warnings[0];if(i!==void 0)throw new $(`无法安全编辑该 YAML，请在原始模式修改：${i.message}`);if(oe(n.contents)||(n.contents=Rr(new Z(n.schema),n.contents)),t.kind===`fallback`){if(t.spec===void 0){if(r.fallback===void 0)return e;let t=n.contents.items[0];U(t)&&W(t.key)&&t.key.value==="default"&&t.key.commentBefore&&(n.commentBefore=[n.commentBefore,t.key.commentBefore].filter(Boolean).join(`
`)),n.delete(`default`),r.fallback=void 0}else{let e=Nr(jr(Lr(t.spec),Or,`default`),`default`),i=n.get(`default`,!0);oe(i)&&r.fallback!==void 0?zr(i,r.fallback,e):n.set(`default`,Rr(n.createNode(Lr(e)),i)),r.fallback=e}}else{let{index:e}=t;if(!Number.isInteger(e)||e<0||e>r.routes.length||t.kind===`delete-route`&&e===r.routes.length)throw new $(`项目规则位置无效，请重新读取路由表`);let i=n.get(`routes`,!0),a=G(i)?i:Rr(new ht(n.schema),i);if(!G(i)){if(r.routes.length!==0||i!==void 0&&!(W(i)&&i.value===null))throw new $(`无法安全编辑由别名或合并键引用的 routes，请在原始模式修改`);n.set(`routes`,a)}if(t.kind===`delete-route`)a.delete(e),r.routes.splice(e,1);else{let i=Pr(Lr(t.route),e),o=a.get(e,!0),s=r.routes[e];s!==void 0&&oe(o)?zr(o,s,i):a.set(e,Rr(n.createNode(Lr(i)),o)),r.routes[e]=i}}let a;try{if(a=n.toString({lineWidth:0}),JSON.stringify(Ir(a))!==JSON.stringify(r))throw Error(`编辑会改变非目标字段的值`)}catch(e){throw new $(`无法安全编辑该 YAML，请在原始模式修改：${e instanceof Error?e.message:String(e)}`)}return a}function Vr(e,t,n){let r=t.routesFile!==e.config.routesFile;return{pathDirty:r,configDirty:r||t.enabled!==e.config.enabled||t.preflight!==e.config.preflight||t.fallbackPolicy!==e.config.fallbackPolicy,tableDirty:e.table!==null&&n!==e.table.text}}function Hr(e){return e instanceof Error?e.message:String(e)}async function Ur(e,t,n,r){let{pathDirty:i,configDirty:a,tableDirty:o}=Vr(t,n,r);if(i&&o)return{snapshot:t,error:`请先保存或放弃当前文件的规则修改，再切换路由表路径。`};if(a&&!t.canEditConfig)return{snapshot:t,error:`当前宿主不支持保存基础设置。`};let s=t;if(o&&t.table!==null)try{let n=await e.saveTable({text:r,revision:t.table.revision});s={...t,table:n}}catch(e){return{snapshot:t,error:`路由表未保存：${Hr(e)}`}}if(!a)return{snapshot:s,...o?{notice:`路由表已保存。`}:{}};let c=o?`路由表已保存；`:``;try{await e.saveConfig(n,t.configRevision)}catch(e){return{snapshot:s,error:`${c}基础设置未保存：${Hr(e)}`}}try{return{snapshot:await e.load(),notice:`${c}基础设置已保存。`}}catch(e){return{snapshot:{...s,config:n,...i?{table:null,tableError:void 0}:{}},error:`${c}基础设置已保存，但重新读取失败：${Hr(e)}。请重新读取后再编辑。`,refreshRequired:!0}}}let Wr=`
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
  --sr-warning-text: #b45309;
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
  --sr-warning-text: #fbbf24;
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
.sr-hint.is-warn { color: var(--sr-warning-text); font-weight: 500; }

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
`,Gr={grid:`sr-form-grid`,field:`sr-field`,fieldHead:`sr-field-head`,label:``,link:`sr-field-link`,input:``,select:``,hint:`sr-hint`};function Kr(e){return e instanceof Error?e.message:String(e)}function qr(e){let t=e.trim();return t===`/`||/^[a-zA-Z]:[/\\]$/.test(t)?t:t.replace(/[/\\]+$/,``)}function Jr({view:e,api:t=O}){return e===`summary`?(0,i.createElement)(`span`,null,`为不同工作区目录为子代理指定 AI 模型与思考等级`):(0,i.createElement)(Zr,{api:t})}let Yr={path:``,provider:``,model:``,reasoningEffort:``};function Xr({value:e,workspaces:t,disabled:n=!1,onChange:r}){let a=t??[],o=a.length>0,s=o?a.some(t=>t.path===e):!1,c=(0,i.useId)(),[l,u]=(0,i.useState)(!o||e!==``&&!s);return(0,i.createElement)(`div`,{className:`sr-field`},(0,i.createElement)(`div`,{className:`sr-field-head`},(0,i.createElement)(`label`,{htmlFor:c},`项目根目录绝对路径 *`),o?(0,i.createElement)(`button`,{type:`button`,className:`sr-field-link`,disabled:n,onClick:()=>u(e=>!e)},l?`从工作区选择`:`手动输入`):null),l||!o?(0,i.createElement)(`input`,{type:`text`,id:c,placeholder:`支持以 ~ 开头，例如 ~/Code/frontend-app 或 /Users/me/repo`,value:e,disabled:n,onChange:e=>r(e.target.value)}):(0,i.createElement)(`select`,{id:c,value:s?e:``,disabled:n,onChange:e=>{e.target.value===`__custom__`?u(!0):r(e.target.value)}},(0,i.createElement)(`option`,{value:``},`（请选择工作区项目）`),a.map(e=>(0,i.createElement)(`option`,{key:e.path,value:e.path},e.title&&e.title!==e.path?`${e.title} — ${e.path}`:e.path)),(0,i.createElement)(`option`,{value:`__custom__`},`+ 手动输入其他目录…`)))}function Zr({api:e}){let[t,n]=(0,i.useState)(null),[r,a]=(0,i.useState)(null),[o,s]=(0,i.useState)(`visual`),[c,l]=(0,i.useState)({}),[u,d]=(0,i.useState)([]),[f,p]=(0,i.useState)(``),[m,h]=(0,i.useState)(null),[g,v]=(0,i.useState)(Yr),[y,b]=(0,i.useState)(``),[x,S]=(0,i.useState)(`load`),[C,w]=(0,i.useState)(``),[T,E]=(0,i.useState)(``),[D,O]=(0,i.useState)(``),[k,ee]=(0,i.useState)(!1),[A,j]=(0,i.useState)(0),te=(0,i.useId)(),M=e=>{let t=e?.text??``;p(t),h(null),v(Yr),b(``),j(e=>e+1);try{if(e?.validationError!==void 0)throw Error(e.validationError);let n=Ir(t);l(n.fallback??{}),d(n.routes),O(``)}catch(e){l({}),d([]),O(`现有文件校验失败：${Kr(e)}`),s(`yaml`)}},N=e=>{n(e),a(e.config),ee(!1),M(e.table)};(0,i.useEffect)(()=>{let t=new AbortController;return e.load(t.signal).then(e=>{t.signal.aborted||N(e)}).catch(e=>{t.signal.aborted||w(Kr(e))}).finally(()=>{t.signal.aborted||S(null)}),()=>t.abort()},[e]);let{configDirty:P,tableDirty:ne,pathDirty:F}=t&&r?Vr(t,r,f):{configDirty:!1,tableDirty:!1,pathDirty:!1},I=c.provider===void 0!=(c.model===void 0),L=ne||I||m!==null,R=P||L;(0,i.useEffect)(()=>{if(!R)return;let e=e=>{e.preventDefault(),e.returnValue=``};return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[R]);let z=async()=>{if(!R||window.confirm(`重新读取会放弃未保存的修改，是否继续？`)){S(`load`),w(``),E(``);try{N(await e.load())}catch(e){w(Kr(e))}finally{S(null)}}},re=e=>{if(e!==o){if(m!==null||I)w(`请先完成或取消正在编辑的规则，再切换编辑模式。`);else{if(e===`visual`)try{let e=t?.table;if(e?.text===f&&e.validationError!==void 0)throw Error(e.validationError);let n=Ir(f);l(n.fallback??{}),d(n.routes),j(e=>e+1),O(``)}catch(e){O(`无法切换到规则设置，请先修正 YAML：${Kr(e)}`);return}s(e),w(``)}}},B=async()=>{if(!(t===null||r===null||x!==null||k||!P&&!ne||m!==null||I)){S(`saving`),w(``),E(``);try{let i=await Ur(e,t,r,f);n(i.snapshot),i.snapshot.config!==t.config&&a(i.snapshot.config),i.snapshot.table!==t.table&&M(i.snapshot.table),ee(i.refreshRequired===!0),w(i.error??``),E(i.notice??``)}finally{S(null)}}},ie=()=>{t===null||k||(N(t),w(``),E(``))},V=()=>{h(`new`),v(Yr),b(``)},H=e=>{let t=u[e];h(e),v({path:t.path,provider:t.provider??``,model:t.model??``,reasoningEffort:t.reasoningEffort??``}),b(``)},ae=()=>{let e=g.path.trim();if(!e){b(`工作区目录路径不能为空`);return}let t=e===`~`||e.startsWith(`~/`)||e.startsWith(`~\\`),n=/^[a-zA-Z]:[/\\]/.test(e);if(!e.startsWith(`/`)&&!t&&!n){b(`路径必须是绝对路径（例如 /Users/... 或 C:\\...）或以 ~/ 开头`);return}let r=g.provider.trim()||void 0,i=g.model.trim()||void 0,a=g.reasoningEffort.trim()||void 0;if(r===void 0!=(i===void 0)){b(`Provider 与 Model 必须同时提供或同时留空`);return}if(r===void 0&&a===void 0){b(`至少需要指定 模型(Provider+Model) 或 思考等级`);return}let o=qr(e);if(u.some((e,t)=>t!==m&&qr(e.path)===o)){b(`已存在针对目录 "${e}" 的规则`);return}let s={path:e,...r?{provider:r,model:i}:{},...a?{reasoningEffort:a}:{}};if(m===null)return;let c=m===`new`?u.length:m;try{p(Br(f,{kind:`route`,index:c,route:s}));let e=[...u];e[c]=s,d(e),h(null),v(Yr),b(``),w(``),E(``)}catch(e){b(Kr(e))}},oe=e=>{let t=u[e];if(window.confirm(`确定要移除工作区 "${t.path}" 的专属路由规则吗？`))try{p(Br(f,{kind:`delete-route`,index:e})),d(u.filter((t,n)=>n!==e)),w(``),E(``)}catch(e){w(Kr(e))}},U=e=>{let t={...e.provider?{provider:e.provider}:{},...e.model?{model:e.model}:{},...e.reasoningEffort?{reasoningEffort:e.reasoningEffort}:{}};if(w(``),E(``),!!e.provider!=!!e.model)l(t);else try{let n=e.provider||e.reasoningEffort?t:void 0;p(Br(f,{kind:`fallback`,spec:n})),l(t)}catch(e){w(Kr(e))}};if(t===null||r===null)return(0,i.createElement)(`div`,{className:`sr-settings`,"aria-busy":x!==null},(0,i.createElement)(`style`,null,Wr),(0,i.createElement)(`div`,{className:`sr-header`},(0,i.createElement)(`div`,{className:`sr-header-info`},(0,i.createElement)(`h3`,{className:`sr-title`},`子代理工作区路由`),(0,i.createElement)(`p`,{className:`sr-subtitle`},`按项目目录为子代理自动分配不同的 AI 模型与思考等级。`))),(0,i.createElement)(`div`,{style:{padding:`24px 0`}},x?(0,i.createElement)(`p`,{className:`sr-hint`,role:`status`,style:{marginBottom:16}},`正在读取设置…`):null,x?(0,i.createElement)(`div`,{className:`sr-skeleton`,style:{height:100,marginBottom:16}}):null,x?(0,i.createElement)(`div`,{className:`sr-skeleton`,style:{height:140}}):null,C?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`},C):null,x?null:(0,i.createElement)(`div`,{style:{marginTop:16}},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,onClick:()=>void z()},`重新读取设置`))));let W=x!==null||k,G=W||F||t.table===null,K=(0,i.createElement)(`header`,{className:`sr-header`},(0,i.createElement)(`div`,{className:`sr-header-info`},(0,i.createElement)(`h3`,{className:`sr-title`},`子代理工作区路由`),(0,i.createElement)(`p`,{className:`sr-subtitle`},`根据当前会话所在的项目目录，自动让子代理切换到最适用的模型，最长路径匹配优先。`)),(0,i.createElement)(`label`,{className:`sr-switch-control`,title:r.enabled?`点击禁用路由`:`点击启用路由`},(0,i.createElement)(`span`,{className:`sr-switch-label`},r.enabled?`已启用`:`已暂停`),(0,i.createElement)(`input`,{type:`checkbox`,className:`sr-switch-input`,checked:r.enabled,disabled:W||!t.canEditConfig,onChange:e=>{a({...r,enabled:e.target.checked}),E(``),w(``)}}),(0,i.createElement)(`div`,{className:`sr-switch-track ${r.enabled?`sr-switch-checked`:``}`},(0,i.createElement)(`div`,{className:`sr-switch-thumb`})))),q=(0,i.createElement)(`div`,{className:`sr-nav-row`},(0,i.createElement)(`div`,{className:`sr-tabs`},(0,i.createElement)(`button`,{type:`button`,className:`sr-tab-btn ${o===`visual`?`sr-tab-active`:``}`,disabled:x!==null,onClick:()=>re(`visual`)},`规则设置`),(0,i.createElement)(`button`,{type:`button`,className:`sr-tab-btn ${o===`yaml`?`sr-tab-active`:``}`,disabled:x!==null,onClick:()=>re(`yaml`)},`原始 YAML 模式`))),se=r.fallbackPolicy??`rules`,ce=se===`inherit`,le=e=>(0,i.createElement)(`p`,{key:e,className:`sr-hint is-warn`,style:{margin:`0 0 12px`}},`当前全局策略是「继承主代理模型」，下列配置已保存但暂不生效；切回「使用路由规则」即恢复。`),ue=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`全局默认策略`)),(0,i.createElement)(`p`,{className:`sr-card-desc`},`当会话未单独指定时，决定是否应用项目规则和全局兜底。`),(0,i.createElement)(`div`,{className:`sr-policy-options`,role:`radiogroup`,"aria-label":`全局默认策略`},(0,i.createElement)(`button`,{type:`button`,className:`sr-policy-option`,role:`radio`,"aria-checked":se===`inherit`,disabled:W||!t.canEditConfig,onClick:()=>{a({...r,fallbackPolicy:`inherit`}),E(``),w(``)}},(0,i.createElement)(`span`,{className:`sr-policy-name`},`继承主代理模型`),(0,i.createElement)(`span`,{className:`sr-policy-desc`},`子代理直接复用主代理的模型与思考等级，不应用项目规则或全局兜底。`)),(0,i.createElement)(`button`,{type:`button`,className:`sr-policy-option`,role:`radio`,"aria-checked":se===`rules`,disabled:W||!t.canEditConfig,onClick:()=>{a({...r,fallbackPolicy:`rules`}),E(``),w(``)}},(0,i.createElement)(`span`,{className:`sr-policy-name`},`使用路由规则`),(0,i.createElement)(`span`,{className:`sr-policy-desc`},`查阅项目专属路由规则；未命中时使用下方配置的全局默认模型。`)))),de=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`全局默认模型（未匹配项目时使用）`)),(0,i.createElement)(`p`,{className:`sr-card-desc`},`当子代理所在的工作区没有匹配到下方专属规则时使用。留空则直接继承父会话的模型。`),ce?le(`policy-fallback`):null,(0,i.createElement)(_,{key:`fallback-${A}`,provider:c.provider??``,model:c.model??``,reasoningEffort:c.reasoningEffort??``,catalog:t.catalog,disabled:G,allowInherit:!0,classes:Gr,onChange:U}),I?(0,i.createElement)(`p`,{className:`sr-hint is-warn`,role:`status`},`提供商与模型须同时填写或同时清空，完成后才会更新 YAML 草稿。`):null),fe=m===null?null:(0,i.createElement)(`div`,{className:`sr-editor-box`},(0,i.createElement)(`h5`,null,m===`new`?`新建项目专属规则`:`修改规则 (${g.path})`),(0,i.createElement)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:12}},(0,i.createElement)(Xr,{key:`path-${m}`,value:g.path,workspaces:t.workspaces,disabled:G,onChange:e=>v(t=>({...t,path:e}))}),(0,i.createElement)(`span`,{className:`sr-hint`},`子代理在该目录或其子目录中派活时将生效（更长路径优先）。`),(0,i.createElement)(_,{key:`fields-${m}`,provider:g.provider,model:g.model,reasoningEffort:g.reasoningEffort,catalog:t.catalog,disabled:G,allowInherit:!0,classes:Gr,onChange:e=>v({...g,provider:e.provider,model:e.model,reasoningEffort:e.reasoningEffort})}),y?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`,style:{margin:0}},y):null,(0,i.createElement)(`div`,{style:{display:`flex`,gap:8,marginTop:4}},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-btn-sm`,disabled:G,onClick:ae},`确认保存规则`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,disabled:W,onClick:()=>{h(null),b(``),w(``)}},`取消`)))),pe=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`项目专属路由规则 (${u.length})`),m===null&&u.length>0?(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,disabled:G,onClick:V},`+ 新增规则`):null),(0,i.createElement)(`p`,{className:`sr-card-desc`},`根据工作区目录前缀进行匹配；当同一个项目有多个匹配规则时，路径层级更深的规则生效。`),ce?le(`policy-routes`):null,fe,u.length===0&&m===null?(0,i.createElement)(`div`,{className:`sr-empty`},(0,i.createElement)(`p`,{className:`sr-empty-text`},`暂无任何项目规则。子代理将使用全局兜底模型或继承主会话设置。`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-btn-sm`,disabled:G,onClick:V},`+ 添加第一个项目规则`)):(0,i.createElement)(`div`,{className:`sr-route-list`},u.map((e,t)=>(0,i.createElement)(`div`,{key:`${e.path}-${t}`,className:`sr-route-item ${m===t?`sr-route-editing`:``}`},(0,i.createElement)(`div`,{className:`sr-route-main`},(0,i.createElement)(`span`,{className:`sr-route-path`,title:e.path},e.path),(0,i.createElement)(`div`,{className:`sr-route-meta`},e.provider&&e.model?(0,i.createElement)(`span`,{className:`sr-badge-model`},`${e.provider} / ${e.model}`):(0,i.createElement)(`span`,{className:`sr-hint`},`继承父会话模型`),e.reasoningEffort?(0,i.createElement)(`span`,{className:`sr-badge-effort`},`思考: ${e.reasoningEffort}`):null)),(0,i.createElement)(`div`,{className:`sr-route-actions`},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-sm`,disabled:G||m!==null,onClick:()=>H(t)},`编辑`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-danger sr-btn-sm`,disabled:G||m!==null,onClick:()=>oe(t)},`删除`)))))),me=(0,i.createElement)(`div`,{className:`sr-card`},(0,i.createElement)(`div`,{className:`sr-card-head`},(0,i.createElement)(`h4`,{className:`sr-card-title`},`原始 YAML 编辑`),t.table?(0,i.createElement)(`span`,{className:`sr-hint`,style:{fontFamily:`ui-monospace`}},t.table.file):null),(0,i.createElement)(`p`,{className:`sr-card-desc`},`直接编辑当前文件的 YAML 草稿。通过解析和结构校验后才能切回可视化模式。`),D?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`},D):null,(0,i.createElement)(`textarea`,{className:`sr-textarea`,"aria-label":`路由表内容（YAML）`,value:f,disabled:G,spellCheck:!1,onChange:e=>{p(e.target.value),O(``),w(``),E(``)}})),he=(0,i.createElement)(`details`,{className:`sr-details`},(0,i.createElement)(`summary`,null,`高级选项（预检校验与存储路径）`),(0,i.createElement)(`div`,{className:`sr-details-content`},(0,i.createElement)(`div`,{className:`sr-field`,style:{marginBottom:12}},(0,i.createElement)(`label`,{style:{display:`flex`,alignItems:`center`,gap:8,cursor:`pointer`}},(0,i.createElement)(`input`,{type:`checkbox`,checked:r.preflight,disabled:W||!t.canEditConfig,onChange:e=>{a({...r,preflight:e.target.checked}),E(``),w(``)}}),(0,i.createElement)(`span`,{style:{fontWeight:600}},`派活前进行模型可用性预检`)),(0,i.createElement)(`span`,{className:`sr-hint`},`创建子代理前调用底层模型接口预先核验 provider、model 和思考等级是否合法可用。`)),(0,i.createElement)(`div`,{className:`sr-field`},(0,i.createElement)(`label`,{htmlFor:te},`自定义路由表存储路径`),(0,i.createElement)(`input`,{id:te,"aria-describedby":`${te}-hint`,type:`text`,placeholder:`留空使用默认路径 $DSH_HOME/subagent-routes.yaml`,value:r.routesFile,disabled:W||!t.canEditConfig||L,onChange:e=>{a({...r,routesFile:e.target.value}),w(``),E(``)}}),(0,i.createElement)(`span`,{className:`sr-hint`,id:`${te}-hint`},L?`请先保存或放弃当前文件的规则修改，再切换路径。`:`支持以 ~ 开头。保存路径后会读取新文件，不会复制当前规则。`)),t.canEditConfig?null:(0,i.createElement)(`p`,{className:`sr-hint`,style:{marginTop:8}},`当前宿主环境不支持修改插件基础配置，高级配置项已锁定。`))),ge=(0,i.createElement)(`div`,{className:`sr-footer-bar`},(0,i.createElement)(`div`,{className:`sr-footer-left`},(0,i.createElement)(`button`,{type:`button`,className:`sr-btn sr-btn-primary sr-save-btn`,disabled:W||!R||m!==null||I,onClick:()=>void B()},x===`saving`?`正在保存…`:k?`请先重新读取`:R?`保存所有更改`:`已是最新配置`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,disabled:W||!R,onClick:ie},`放弃修改`),(0,i.createElement)(`button`,{type:`button`,className:`sr-btn`,disabled:x!==null,onClick:()=>void z()},x===`load`?`读取中…`:`重新读取`)),(0,i.createElement)(`div`,{className:`sr-footer-right`},m===null?R?(0,i.createElement)(`span`,{className:`sr-dirty-badge`},`● 有未保存的修改`):null:(0,i.createElement)(`span`,{className:`sr-dirty-badge`},`正在编辑单条规则，请先确认保存`)));return(0,i.createElement)(`div`,{className:`sr-settings`,"aria-busy":x!==null},(0,i.createElement)(`style`,null,Wr),K,q,C?(0,i.createElement)(`div`,{className:`sr-error`,role:`alert`},C):null,T?(0,i.createElement)(`div`,{className:`sr-notice`,role:`status`},T):null,t.tableError?(0,i.createElement)(`p`,{className:`sr-error`,role:`alert`},t.tableError):null,F?(0,i.createElement)(`p`,{className:`sr-hint is-warn`,role:`status`},`已修改路由表路径。保存或放弃路径修改后，才能继续编辑规则。`):null,t.table?.exists===!1?(0,i.createElement)(`p`,{className:`sr-hint`},`尚未创建路由表。保存规则时将创建该文件。`):null,o===`visual`?(0,i.createElement)(`div`,null,ue,t.table&&de,t.table&&pe):me,he,ge)}let Qr=`${a}/route`,$r=[`slots`,`sidebarRightTabs`,`sidebarRight`,`locale`],ei={"tab.title":`子代理`,"guide.title":`子代理模型`,"guide.description":`切换本会话的子代理配置，并看清当前生效的来源。`},ti={"tab.title":`Subagent`,"guide.title":`Subagent model`,"guide.description":`Switch this session’s subagent route and see which layer is in effect.`};function ni(e,t){try{t()}catch(t){let n=t instanceof Error?t.message:String(t),r=Error(`[${o}] ${e} 注册失败：${n}`,{cause:t});throw console.error(r.message,t),r}}function ri(e){let t=e.effect??(e=>{e()}),n=e.locale.bind(a),r=(e,t)=>n(e)??t;ni(`locale`,()=>{e.locale.register(a,{zh:ei,en:ti})});for(let[t,n]of[[`plugins.bundle.config`,a],[`plugins.row.config`,`${a}#${o}`]])ni(`settings:${t}`,()=>{e.slots.inject(t,()=>e.slots.register({name:t,key:n},Jr))});ni(`sidebar-tab-type`,()=>{t(()=>e.sidebarRightTabs.register({id:Qr,kind:`subagentroute`,priority:`extension`,title:()=>r(`tab.title`,`子代理`),guide:[{id:`route`,order:30,title:()=>r(`guide.title`,`子代理模型`),description:()=>r(`guide.description`,`切换本会话的子代理配置。`)}]}),`subagent-routes: sidebar tab type`)}),ni(`sidebar-tab-body`,()=>{e.slots.inject(`sidebar.right.pane.tab`,()=>e.slots.register({name:`sidebar.right.pane.tab`,key:Qr,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(A,{key:t,sessionId:t})})))}),ni(`sidebar-tab-title`,()=>{e.slots.inject(`sidebar.right.pane.tab.title`,()=>e.slots.register({name:`sidebar.right.pane.tab.title`,key:Qr},(()=>r(`tab.title`,`子代理`))))}),ni(`composer-chip`,()=>{e.slots.inject(`conversation.input.right`,()=>e.slots.register({name:`conversation.input.right`,id:`${a}-chip`,kind:`list`,scope:`session`,order:0,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(I,{key:t,sessionId:t})})))}),ni(`composer-overlay`,()=>{e.slots.inject(`conversation.input.overlay`,()=>e.slots.register({name:`conversation.input.overlay`,id:`${a}-overlay`,kind:`list`,scope:`session`,order:0,inject:e=>({sessionId:e})},(e=>{let t=e.sessionId;return t===void 0?null:(0,i.createElement)(F,{key:t,sessionId:t})})))})}return n.apply=ri,n.inject=$r,n.name=`@zdt3476/dsh-subagent-routes`,t.exports}});
//# sourceMappingURL=client.js.map