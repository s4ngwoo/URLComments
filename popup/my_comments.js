import { getMessage } from './i18n.js';

/**
  * popup/my_comments.js
  * Phase 2 Step 2: 내가 작성한 댓글 목록 조회 및 관리 모듈
  */

import { state } from './state.js';
import { handleGoogleLogin } from './auth.js';

let myCommentsCache = null;
let isCacheDirty = true;
let isLoading = false;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
  * URL을 도메인과 단축된 경로 형태로 가공하여 반환
  * @param {string} urlString 
  * @returns {string}
  */
export function formatDisplayUrl(urlString) {
  if (!urlString) return '';
  try {
    const parsed = new URL(urlString);
    const domain = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname;
    let display = `${domain}${pathname}`;
    if (display.length > 42) {
      display = display.slice(0, 39) + '...';
    }
    return display;
  } catch {
    return urlString.length > 42 ? urlString.slice(0, 39) + '...' : urlString;
  }
}

/**
  * 저장된 원본 URL을 새 탭에서 열기
  * @param {string} url 
  */
export function openOriginalUrl(url) {
  if (!url) return;
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function invalidateMyCommentsCache() {
  isCacheDirty = true;
}

export function getMyCommentsCache() {
  return myCommentsCache;
}

export function setMyCommentsCache(data) {
  myCommentsCache = data;
  isCacheDirty = false;
}

export function resetMyCommentsCache() {
  myCommentsCache = null;
  isCacheDirty = true;
}

export function showMyCommentsView(viewName) {
  const views = ['loading', 'unauth', 'empty', 'error', 'list-container'];
  views.forEach(v => {
    const el = document.getElementById(`my-comments-${v}`);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(`my-comments-${viewName}`);
  if (target) target.classList.remove('hidden');
}

export function renderMyComments(comments) {
  const listEl = document.getElementById('my-comment-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!comments || comments.length === 0) {
    showMyCommentsView('empty');
    return;
  }

  comments.forEach(item => {
    const li = document.createElement('li');
    li.className = 'my-comment-item';

    const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const displayUrl = formatDisplayUrl(item.url);
    const openLabel = (typeof chrome !== 'undefined' && chrome.i18n && getMessage('openOriginalPage')) || '원문 보기';
    const replyBadge = item.parent_id
      ? `<span class="badge-reply">${escapeHtml((typeof chrome !== 'undefined' && chrome.i18n && getMessage('labelReply')) || '↳ 답글')}</span>`
      : '';

    li.innerHTML = `
      <div class="my-comment-header">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
          ${replyBadge}
          <span class="my-comment-url" title="${escapeHtml(item.url)}">${escapeHtml(displayUrl)}</span>
        </div>
        <span class="my-comment-date">${createdDate}</span>
      </div>
      <div class="my-comment-body">${escapeHtml(item.content)}</div>
      <div class="my-comment-footer">
        <button type="button" class="btn btn-outline btn-open-url" data-url="${escapeHtml(item.url)}">
          ${escapeHtml(openLabel)} ↗
        </button>
      </div>
    `;

    listEl.appendChild(li);
  });

  showMyCommentsView('list-container');
}

/**
  * Supabase에서 현재 사용자의 댓글을 조회
  * @param {boolean} force - 캐시 무시하고 강제 조회 여부
  */
export async function loadMyComments(force = false) {
  if (!state.currentUser) {
    showMyCommentsView('unauth');
    return;
  }

  if (!isCacheDirty && myCommentsCache !== null && !force) {
    renderMyComments(myCommentsCache);
    return;
  }

  if (isLoading) return;

  const supabase = window.supabaseClient;
  if (!supabase) {
    showMyCommentsView('error');
    return;
  }

  try {
    isLoading = true;
    showMyCommentsView('loading');

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('author_id', state.currentUser.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    myCommentsCache = data || [];
    isCacheDirty = false;
    renderMyComments(myCommentsCache);
  } catch (err) {
    console.error('Failed to load my comments:', err);
    showMyCommentsView('error');
  } finally {
    isLoading = false;
  }
}

/**
  * 탭 전환 시 필요할 때만 호출되는 지연 로딩 진입점
  */
export async function loadMyCommentsIfNeeded() {
  if (!state.currentUser) {
    showMyCommentsView('unauth');
    return;
  }

  if (isCacheDirty || myCommentsCache === null) {
    await loadMyComments();
  } else {
    renderMyComments(myCommentsCache);
  }
}

/**
  * 이벤트 리스너 초기화 (원문 보기 클릭, 재시도, 로그인)
  */
export function initMyComments() {
  const container = document.getElementById('tab-my-comments');
  if (!container) return;

  container.addEventListener('click', (e) => {
    // 1. 원문 보기 버튼 클릭
    const openBtn = e.target.closest('.btn-open-url');
    if (openBtn) {
      e.stopPropagation();
      const url = openBtn.getAttribute('data-url');
      if (url) {
        openOriginalUrl(url);
      }
      return;
    }

    // 2. 재시도 버튼 클릭
    const retryBtn = e.target.closest('#btn-my-comments-retry');
    if (retryBtn) {
      loadMyComments(true);
      return;
    }

    // 3. 미인증 상태에서 로그인 버튼 클릭
    const loginBtn = e.target.closest('#btn-my-comments-login');
    if (loginBtn) {
      handleGoogleLogin();
      return;
    }
  });
}
