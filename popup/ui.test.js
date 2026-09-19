import {
  initElements,
  showState,
  updatePaginationUI,
  enableForm,
  disableForm,
  setupI18n
} from './ui.js';

function mountUiShell() {
  document.body.innerHTML = `
    <div id="state-needs-refresh" class="hidden"></div>
    <div id="state-loading" class="hidden"><span id="loading-text"></span></div>
    <div id="state-unsupported" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-list" class="hidden"></div>
    <nav id="pagination-controls">
      <button id="btn-prev-page"></button>
      <span id="page-indicator"></span>
      <button id="btn-next-page"></button>
    </nav>
    <div id="app-footer"></div>
    <textarea id="comment-input"></textarea>
    <button id="btn-submit"></button>
    <span id="form-auth-notice" class="hidden"></span>
    <div id="error-banner" class="hidden"><span id="error-message"></span></div>
    <span data-i18n="btnSubmit">fallback</span>
    <input data-i18n-placeholder="commentPlaceholder" />
    <button data-i18n-title="btnRefresh"></button>
    <button data-i18n-aria-label="btnLike"></button>
  `;
  initElements();
}

describe('popup/ui.js', () => {
  beforeEach(() => {
    mountUiShell();
  });

  it('showState(list) reveals list and footer without hiding pagination eligibility', () => {
    showState('list');
    expect(document.getElementById('state-list').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('state-loading').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('app-footer').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('pagination-controls').classList.contains('hidden')).toBe(false);
  });

  it('showState(loading) hides footer and pagination', () => {
    showState('loading');
    expect(document.getElementById('state-loading').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('state-list').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('app-footer').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('pagination-controls').classList.contains('hidden')).toBe(true);
  });

  it('showState(empty) keeps the footer visible', () => {
    showState('empty');
    expect(document.getElementById('state-empty').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('app-footer').classList.contains('hidden')).toBe(false);
  });

  it('updatePaginationUI hides controls on a single page and enables next on later pages', () => {
    updatePaginationUI(1, 1);
    expect(document.getElementById('pagination-controls').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('page-indicator').textContent).toBe('1 / 1');

    updatePaginationUI(2, 3);
    expect(document.getElementById('pagination-controls').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('page-indicator').textContent).toBe('2 / 3');
    expect(document.getElementById('btn-prev-page').disabled).toBe(false);
    expect(document.getElementById('btn-next-page').disabled).toBe(false);

    updatePaginationUI(3, 3);
    expect(document.getElementById('btn-next-page').disabled).toBe(true);
    expect(document.getElementById('btn-prev-page').disabled).toBe(false);
  });

  it('disableForm locks the composer and shows the auth notice', () => {
    disableForm('authNoticeDefault');
    expect(document.getElementById('comment-input').disabled).toBe(true);
    expect(document.getElementById('btn-submit').disabled).toBe(true);
    expect(document.getElementById('form-auth-notice').textContent).toBe('authNoticeDefault');
    expect(document.getElementById('form-auth-notice').classList.contains('hidden')).toBe(false);

    enableForm();
    expect(document.getElementById('comment-input').disabled).toBe(false);
    expect(document.getElementById('btn-submit').disabled).toBe(false);
    expect(document.getElementById('form-auth-notice').classList.contains('hidden')).toBe(true);
  });

  it('setupI18n fills text, placeholder, title, and aria-label attributes', () => {
    setupI18n();
    expect(document.querySelector('[data-i18n]').textContent).toBe('btnSubmit');
    expect(document.querySelector('[data-i18n-placeholder]').placeholder).toBe('commentPlaceholder');
    expect(document.querySelector('[data-i18n-title]').title).toBe('btnRefresh');
    expect(document.querySelector('[data-i18n-aria-label]').getAttribute('aria-label')).toBe('btnLike');
  });
});
