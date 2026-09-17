import { setSpaDetected, setNormalizedUrl } from './state.js';
import { elements, showState, disableForm } from './ui.js';
import { getMessage } from './i18n.js';

/** Clear stale page context when the active tab or URL changes. */
export function handleTabChanged() {
  showState('needs-refresh');
  disableForm(getMessage("msgNeedsRefresh") || "페이지가 변경되었습니다. 새로고침을 눌러주세요.");
  setNormalizedUrl(null);
  setSpaDetected(false);
  elements.pageToolbar?.classList.add('hidden');
  elements.spaNotice?.classList.add('hidden');
}

export function handleRuntimeMessage(message) {
  if (!message || !message.type) return;
  if (message.type === 'TAB_CHANGED') {
    handleTabChanged();
  } else if (message.type === 'SPA_DETECTED') {
    setSpaDetected(true);
  }
}
