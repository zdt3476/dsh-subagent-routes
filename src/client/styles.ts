export const SETTINGS_CSS = `
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
`
