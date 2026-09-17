import { handleRuntimeMessage } from './tabChange.js';
import { initElements } from './ui.js';
import { state, resetState, setNormalizedUrl, setSpaDetected } from './state.js';

function mountPopupShell() {
  document.body.innerHTML = `
    <div id="state-needs-refresh" class="hidden"></div>
    <div id="state-loading" class="hidden"><span id="loading-text"></span></div>
    <div id="state-unsupported" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-list" class="hidden"></div>
    <div id="page-toolbar"></div>
    <div id="spa-notice"></div>
    <textarea id="comment-input"></textarea>
    <button id="btn-submit"></button>
    <div id="form-auth-notice" class="hidden"></div>
    <nav id="pagination-controls"></nav>
    <div id="app-footer"></div>
    <ul id="comment-list"></ul>
  `;
  initElements();
}

describe('popup/tabChange.js', () => {
  beforeEach(() => {
    resetState();
    mountPopupShell();
  });

  it('TAB_CHANGED clears URL, disables the form, and shows needs-refresh', () => {
    setNormalizedUrl('https://example.com/old');
    setSpaDetected(true);
    document.getElementById('comment-input').disabled = false;
    document.getElementById('btn-submit').disabled = false;

    handleRuntimeMessage({ type: 'TAB_CHANGED' });

    expect(state.normalizedCurrentUrl).toBeNull();
    expect(state.isSpaDetected).toBe(false);
    expect(document.getElementById('page-toolbar').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('spa-notice').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('comment-input').disabled).toBe(true);
    expect(document.getElementById('btn-submit').disabled).toBe(true);
    expect(document.getElementById('state-needs-refresh').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('form-auth-notice').classList.contains('hidden')).toBe(false);
  });

  it('SPA_DETECTED marks SPA without clearing the current URL', () => {
    setNormalizedUrl('https://example.com/spa');
    handleRuntimeMessage({ type: 'SPA_DETECTED' });
    expect(state.isSpaDetected).toBe(true);
    expect(state.normalizedCurrentUrl).toBe('https://example.com/spa');
  });
});
