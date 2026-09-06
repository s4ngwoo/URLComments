export const elements = {};

export function initElements() {
  Object.assign(elements, {
    // Auth Header
    authStatus: document.getElementById('auth-status'),
    btnLogin: document.getElementById('btn-login'),
    userProfile: document.getElementById('user-profile'),
    userEmail: document.getElementById('user-email'),
    btnLogout: document.getElementById('btn-logout'),

    // Top Bar (Refresh, Sort)
    btnRefresh: document.getElementById('btn-refresh'),
    sortSelect: document.getElementById('sort-select'),

    // Error Banner
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    btnCloseError: document.getElementById('btn-close-error'),

    // URL Bar
    urlBar: document.getElementById('url-bar'),
    currentUrlText: document.getElementById('current-url'),

    // State Views
    stateNeedsRefresh: document.getElementById('state-needs-refresh'),
    stateLoading: document.getElementById('state-loading'),
    loadingText: document.getElementById('loading-text'),
    stateUnsupported: document.getElementById('state-unsupported'),
    stateUnsupportedSpa: document.getElementById('state-unsupported-spa'),
    stateEmpty: document.getElementById('state-empty'),
    stateList: document.getElementById('state-list'),
    commentList: document.getElementById('comment-list'),

    // Form
    commentForm: document.getElementById('comment-form'),
    commentInput: document.getElementById('comment-input'),
    charCount: document.getElementById('char-count'),
    btnSubmit: document.getElementById('btn-submit'),
    formAuthNotice: document.getElementById('form-auth-notice')
  });
}

export function showState(targetState) {
  const states = ['needs-refresh', 'loading', 'unsupported', 'unsupported-spa', 'empty', 'list'];
  states.forEach(s => {
    // needs-refresh -> stateNeedsRefresh
    const elName = 'state' + s.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
    const el = elements[elName];
    if (el) el.classList.add('hidden');
  });

  const targetElName = 'state' + targetState.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
  const targetEl = elements[targetElName];
  if (targetEl) targetEl.classList.remove('hidden');
}

export function showLoading(msg) {
  if (msg) elements.loadingText.textContent = msg;
  showState('loading');
}

export function showError(msg) {
  elements.errorMessage.textContent = msg;
  elements.errorBanner.classList.remove('hidden');
  setTimeout(() => hideError(), 3000);
}

export function hideError() {
  elements.errorBanner.classList.add('hidden');
  elements.errorMessage.textContent = '';
}

export function enableForm() {
  elements.commentInput.disabled = false;
  elements.btnSubmit.disabled = false;
  elements.formAuthNotice.textContent = '';
}

export function disableForm(noticeText) {
  elements.commentInput.disabled = true;
  elements.btnSubmit.disabled = true;
  if (noticeText) {
    elements.formAuthNotice.textContent = noticeText;
  }
}

export function setSubmitButtonLoading(isLoading) {
  elements.btnSubmit.disabled = isLoading;
  elements.btnSubmit.textContent = isLoading ? (chrome.i18n.getMessage("btnSubmitting") || '등록 중...') : (chrome.i18n.getMessage("btnSubmit") || '등록');
}

export function setupI18n() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const msg = chrome.i18n.getMessage(elem.getAttribute('data-i18n'));
    if (msg) elem.textContent = msg;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const msg = chrome.i18n.getMessage(elem.getAttribute('data-i18n-placeholder'));
    if (msg) elem.placeholder = msg;
  });
}
