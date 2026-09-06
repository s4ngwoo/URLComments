import { getMessage } from './i18n.js';

export const elements = {};

export function initElements() {
  Object.assign(elements, {
    // Auth Header
    authStatus: document.getElementById('auth-status'),
    btnLogin: document.getElementById('btn-login'),
    userProfile: document.getElementById('user-profile'),
    btnUserMenu: document.getElementById('btn-user-menu'),
    userMenuPopover: document.getElementById('user-menu-popover'),
    profileDisplayName: document.getElementById('profile-display-name'),
    profilePublicId: document.getElementById('profile-public-id'),
    btnEditProfile: document.getElementById('btn-edit-profile'),
    btnLogout: document.getElementById('btn-logout'),

    // Profile Edit Modal
    modalEditProfile: document.getElementById('modal-edit-profile'),
    formEditProfile: document.getElementById('form-edit-profile'),
    inputDisplayName: document.getElementById('input-display-name'),
    displayNameCount: document.getElementById('display-name-count'),
    btnCancelProfile: document.getElementById('btn-cancel-profile'),
    btnSaveProfile: document.getElementById('btn-save-profile'),
    modalError: document.getElementById('modal-error'),

    // Top Bar (Refresh, Toolbar)
    btnRefresh: document.getElementById('btn-refresh'),
    pageToolbar: document.getElementById('page-toolbar'),
    currentUrlText: document.getElementById('current-url'),

    // SPA Notice
    spaNotice: document.getElementById('spa-notice'),

    // Error Banner
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    btnCloseError: document.getElementById('btn-close-error'),

    // State Views
    stateNeedsRefresh: document.getElementById('state-needs-refresh'),
    stateLoading: document.getElementById('state-loading'),
    loadingText: document.getElementById('loading-text'),
    stateUnsupported: document.getElementById('state-unsupported'),
    stateEmpty: document.getElementById('state-empty'),
    stateList: document.getElementById('state-list'),
    commentList: document.getElementById('comment-list'),

    // Pagination Controls
    paginationControls: document.getElementById('pagination-controls'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page'),
    pageIndicator: document.getElementById('page-indicator'),

    // Form
    appFooter: document.getElementById('app-footer'),
    commentForm: document.getElementById('comment-form'),
    commentInput: document.getElementById('comment-input'),
    charCount: document.getElementById('char-count'),
    btnSubmit: document.getElementById('btn-submit'),
    formAuthNotice: document.getElementById('form-auth-notice')
  });
}

export function showState(targetState) {
  const states = ['needs-refresh', 'loading', 'unsupported', 'empty', 'list'];
  states.forEach(s => {
    // needs-refresh -> stateNeedsRefresh
    const elName = 'state' + s.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
    const el = elements[elName];
    if (el) el.classList.add('hidden');
  });

  const targetElName = 'state' + targetState.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
  const targetEl = elements[targetElName];
  if (targetEl) targetEl.classList.remove('hidden');

  // Hide pagination controls if not on list view
  if (elements.paginationControls && targetState !== 'list') {
    elements.paginationControls.classList.add('hidden');
  }

  // Show/Hide footer based on state
  if (elements.appFooter) {
    if (targetState === 'list' || targetState === 'empty') {
      elements.appFooter.classList.remove('hidden');
    } else {
      elements.appFooter.classList.add('hidden');
    }
  }
}

export function updatePaginationUI(currentPage, totalPages) {
  if (!elements.paginationControls) return;
  if (elements.pageIndicator) {
    elements.pageIndicator.textContent = `${currentPage} / ${totalPages}`;
  }
  if (totalPages <= 1) {
    elements.paginationControls.classList.add('hidden');
    return;
  }
  elements.paginationControls.classList.remove('hidden');
  if (elements.btnPrevPage) {
    elements.btnPrevPage.disabled = currentPage <= 1;
  }
  if (elements.btnNextPage) {
    elements.btnNextPage.disabled = currentPage >= totalPages;
  }
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
  elements.formAuthNotice.classList.add('hidden');
}

export function disableForm(noticeText) {
  elements.commentInput.disabled = true;
  elements.btnSubmit.disabled = true;
  if (noticeText) {
    elements.formAuthNotice.textContent = noticeText;
    elements.formAuthNotice.classList.remove('hidden');
  } else {
    elements.formAuthNotice.classList.add('hidden');
  }
}

export function setSubmitButtonLoading(isLoading) {
  elements.btnSubmit.disabled = isLoading;
  elements.btnSubmit.textContent = isLoading ? (getMessage("btnSubmitting") || '등록 중...') : (getMessage("btnSubmit") || '등록');
}

export function showProfileModal() {
  elements.modalError.classList.add('hidden');
  elements.modalError.textContent = '';
  elements.modalEditProfile.classList.remove('hidden');
  elements.inputDisplayName.focus();
}

export function hideProfileModal() {
  elements.modalEditProfile.classList.add('hidden');
}

export function showProfileError(msg) {
  elements.modalError.textContent = msg;
  elements.modalError.classList.remove('hidden');
}

export function setupI18n() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const msg = getMessage(elem.getAttribute('data-i18n'));
    if (msg) elem.textContent = msg;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const msg = getMessage(elem.getAttribute('data-i18n-placeholder'));
    if (msg) elem.placeholder = msg;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(elem => {
    const msg = getMessage(elem.getAttribute('data-i18n-title'));
    if (msg) elem.title = msg;
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(elem => {
    const msg = getMessage(elem.getAttribute('data-i18n-aria-label'));
    if (msg) elem.setAttribute('aria-label', msg);
  });
}
