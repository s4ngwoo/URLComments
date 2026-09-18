import {
  loadComments,
  getCurrentCommentPage,
  setCurrentCommentPage,
  resetPagination,
  THREADS_PER_PAGE,
} from './comments.js';
import { initElements } from './ui.js';
import { setNormalizedUrl, resetState } from './state.js';

function thenable(result) {
  const chain = {};
  const self = () => chain;
  chain.select = jest.fn(self);
  chain.eq = jest.fn(self);
  chain.in = jest.fn(self);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function installSupabase(comments) {
  window.supabaseClient = {
    from: jest.fn((table) => {
      if (table === 'comments') {
        return thenable({ data: comments, error: null });
      }
      return thenable({ data: [], error: null });
    }),
  };
}

function parentComments(count, url) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    parent_id: null,
    url,
    author_id: 'user-a',
    content: `Parent ${i + 1}`,
    created_at: `2026-09-18T10:${String(i).padStart(2, '0')}:00Z`,
    is_deleted: false,
  }));
}

function mountPopupShell() {
  document.body.innerHTML = `
    <div id="app">
      <div id="error-banner" class="error-banner hidden">
        <span id="error-message" class="error-message"></span>
      </div>
      <div id="state-needs-refresh" class="state-view hidden"></div>
      <div id="state-loading" class="state-view hidden">
        <span id="loading-text"></span>
      </div>
      <div id="state-unsupported" class="state-view hidden"></div>
      <div id="state-list" class="state-view">
        <ul id="comment-list" class="comment-list"></ul>
      </div>
      <nav id="pagination-controls" class="hidden">
        <button id="btn-prev-page">&lt;</button>
        <span id="page-indicator">1 / 1</span>
        <button id="btn-next-page">&gt;</button>
      </nav>
      <div id="state-empty" class="state-view hidden"></div>
    </div>
  `;
  initElements();
}

describe('loadComments pagination reset on URL change', () => {
  beforeEach(() => {
    mountPopupShell();
    resetState();
    resetPagination();
  });

  afterEach(() => {
    window.supabaseClient = undefined;
  });

  it('resets to page 1 when the loaded URL changes', async () => {
    const urlA = 'https://example.com/a';
    const urlB = 'https://example.com/b';
    installSupabase(parentComments(THREADS_PER_PAGE * 2 + 5, urlA));
    setNormalizedUrl(urlA);

    await loadComments(urlA);
    setCurrentCommentPage(3);
    expect(getCurrentCommentPage()).toBe(3);

    installSupabase(parentComments(THREADS_PER_PAGE * 2 + 5, urlB));
    setNormalizedUrl(urlB);
    await loadComments(urlB);

    expect(getCurrentCommentPage()).toBe(1);
    expect(document.getElementById('page-indicator').textContent).toBe('1 / 3');
  });

  it('keeps the current page when reloading the same URL', async () => {
    const url = 'https://example.com/same';
    installSupabase(parentComments(THREADS_PER_PAGE * 2 + 5, url));
    setNormalizedUrl(url);

    await loadComments(url);
    setCurrentCommentPage(3);
    expect(getCurrentCommentPage()).toBe(3);

    await loadComments(url);

    expect(getCurrentCommentPage()).toBe(3);
    expect(document.getElementById('page-indicator').textContent).toBe('3 / 3');
  });
});
