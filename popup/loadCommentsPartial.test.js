import { loadComments } from './comments.js';
import { initElements } from './ui.js';
import { state, resetState } from './state.js';

function thenable(result) {
  const obj = {
    select: jest.fn(() => obj),
    eq: jest.fn(() => obj),
    in: jest.fn(() => obj),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return obj;
}

function mountListShell() {
  document.body.innerHTML = `
    <div id="error-banner" class="hidden">
      <span id="error-message"></span>
    </div>
    <ul id="comment-list"></ul>
    <nav id="pagination-controls" class="hidden">
      <button id="btn-prev-page">&lt;</button>
      <span id="page-indicator">1 / 1</span>
      <button id="btn-next-page">&gt;</button>
    </nav>
    <div id="state-list" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-loading" class="hidden">
      <span id="loading-text"></span>
    </div>
    <div id="app-footer" class="hidden"></div>
  `;
  initElements();
}

describe('loadComments secondary query failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    mountListShell();
  });

  test('still renders comments when profile, vote, and report queries fail', async () => {
    const comments = thenable({
      data: [{
        id: 'c1',
        parent_id: null,
        author_id: 'author-1',
        author_name: 'Alice',
        content: 'visible after enrichment errors',
        created_at: '2026-09-21T10:00:00Z',
        is_deleted: false,
      }],
      error: null,
    });
    const profiles = thenable({ data: null, error: new Error('profiles down') });
    const votes = thenable({ data: null, error: new Error('votes down') });
    const reports = thenable({ data: null, error: new Error('reports down') });

    window.supabaseClient = {
      from: jest.fn((table) => {
        if (table === 'comments') return comments;
        if (table === 'profiles') return profiles;
        if (table === 'comment_votes') return votes;
        if (table === 'reported_comments') return reports;
        throw new Error(`unexpected table ${table}`);
      }),
    };

    state.currentUser = { id: 'viewer-1' };
    state.normalizedCurrentUrl = 'https://example.com/page';

    await loadComments('https://example.com/page');

    expect(document.getElementById('comment-body-c1').textContent)
      .toBe('visible after enrichment errors');
    expect(document.getElementById('state-list').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('state-empty').classList.contains('hidden')).toBe(true);
  });
});
