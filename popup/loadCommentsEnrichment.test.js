import { loadComments, resetPagination } from './comments.js';
import { initElements } from './ui.js';
import { state, resetState, setNormalizedUrl, setCurrentUser } from './state.js';

function thenable(result) {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

function mountListShell() {
  document.body.innerHTML = `
    <div id="state-needs-refresh" class="hidden"></div>
    <div id="state-loading" class="hidden"><span id="loading-text"></span></div>
    <div id="state-unsupported" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-list" class="hidden"></div>
    <ul id="comment-list"></ul>
    <nav id="pagination-controls" class="hidden">
      <button id="btn-prev-page"></button>
      <span id="page-indicator"></span>
      <button id="btn-next-page"></button>
    </nav>
    <div id="app-footer" class="hidden"></div>
    <div id="error-banner" class="hidden"><span id="error-message"></span></div>
  `;
  initElements();
}

const commentRow = {
  id: '10',
  parent_id: null,
  author_id: 'author-1',
  author_name: 'Alice',
  content: 'visible take',
  like_count: 3,
  dislike_count: 1,
  created_at: '2026-09-06T10:00:00Z',
  is_deleted: false,
};

describe('loadComments vote and report enrichment', () => {
  beforeEach(() => {
    resetState();
    resetPagination();
    mountListShell();
  });

  it('loads user votes and marks the like button active', async () => {
    setCurrentUser({ id: 'u1' });
    setNormalizedUrl('https://example.com/');
    const from = jest.fn((table) => {
      if (table === 'comments') return thenable({ data: [commentRow], error: null });
      if (table === 'profiles') {
        return thenable({
          data: [{ id: 'author-1', display_name: 'Alice', public_id: 'PUB-1' }],
          error: null,
        });
      }
      if (table === 'comment_votes') {
        return thenable({ data: [{ comment_id: '10', vote_type: 'like' }], error: null });
      }
      if (table === 'reported_comments') return thenable({ data: [], error: null });
      return thenable({ data: [], error: null });
    });
    window.supabaseClient = { from };

    await loadComments('https://example.com/');

    expect(from).toHaveBeenCalledWith('comment_votes');
    expect(from).toHaveBeenCalledWith('reported_comments');
    expect(document.querySelector('.btn-like.active')).not.toBeNull();
    expect(document.querySelector('.like-count').textContent).toBe('3');
  });

  it('hides report actions for comments the current user already reported', async () => {
    setCurrentUser({ id: 'u1' });
    setNormalizedUrl('https://example.com/');
    window.supabaseClient = {
      from: jest.fn((table) => {
        if (table === 'comments') return thenable({ data: [commentRow], error: null });
        if (table === 'profiles') return thenable({ data: [], error: null });
        if (table === 'comment_votes') return thenable({ data: [], error: null });
        if (table === 'reported_comments') {
          return thenable({ data: [{ comment_id: '10' }], error: null });
        }
        return thenable({ data: [], error: null });
      }),
    };

    await loadComments('https://example.com/');

    expect(document.querySelector('[data-action="report"][data-id="10"]')).toBeNull();
    expect(document.getElementById('comment-body-10').textContent).toContain('labelReported');
    expect(document.getElementById('comment-body-10').textContent).not.toContain('visible take');
  });

  it('skips vote and report queries when logged out', async () => {
    setNormalizedUrl('https://example.com/');
    const from = jest.fn((table) => {
      if (table === 'comments') return thenable({ data: [commentRow], error: null });
      if (table === 'profiles') return thenable({ data: [], error: null });
      return thenable({ data: [], error: null });
    });
    window.supabaseClient = { from };

    await loadComments('https://example.com/');

    expect(from).toHaveBeenCalledWith('comments');
    expect(from).not.toHaveBeenCalledWith('comment_votes');
    expect(from).not.toHaveBeenCalledWith('reported_comments');
    expect(document.querySelector('[data-action="report"]')).toBeNull();
  });
});
