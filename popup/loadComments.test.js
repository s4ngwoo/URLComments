import { loadComments, resetPagination } from './comments.js';
import { state, resetState } from './state.js';
import { initElements } from './ui.js';

function installPopupFixture() {
  document.body.innerHTML = `
    <div id="loading-text"></div>
    <div id="state-loading" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-list" class="hidden"></div>
    <div id="error-banner" class="hidden"><span id="error-message"></span></div>
    <ul id="comment-list"></ul>
    <nav id="pagination-controls" class="hidden">
      <button id="btn-prev-page"></button>
      <span id="page-indicator">1 / 1</span>
      <button id="btn-next-page"></button>
    </nav>
    <div id="app-footer" class="hidden"></div>
  `;
  initElements();
}

function commentsClient({ data, error = null, delay = 0 }) {
  return {
    from: jest.fn((table) => {
      if (table === 'comments') {
        return {
          select: () => ({
            eq: () =>
              delay
                ? new Promise((resolve) => setTimeout(() => resolve({ data, error }), delay))
                : Promise.resolve({ data, error }),
          }),
        };
      }
      return {
        select: () => ({
          in: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    }),
  };
}

describe('loadComments stale-fetch discard', () => {
  beforeEach(() => {
    resetState();
    resetPagination();
    installPopupFixture();
    window.supabaseClient = null;
  });

  it('shows empty state when the client is missing', async () => {
    state.normalizedCurrentUrl = 'https://example.com/page';
    await loadComments('https://example.com/page');
    expect(document.getElementById('state-empty').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('comment-list').children.length).toBe(0);
  });

  it('shows empty state when the query returns no rows', async () => {
    state.normalizedCurrentUrl = 'https://example.com/page';
    window.supabaseClient = commentsClient({ data: [] });
    await loadComments('https://example.com/page');
    expect(document.getElementById('state-empty').classList.contains('hidden')).toBe(false);
  });

  it('shows an error and empty state when the query fails', async () => {
    state.normalizedCurrentUrl = 'https://example.com/page';
    window.supabaseClient = commentsClient({ data: null, error: { message: 'boom' } });
    await loadComments('https://example.com/page');
    expect(document.getElementById('error-message').textContent).toContain('boom');
    expect(document.getElementById('state-empty').classList.contains('hidden')).toBe(false);
  });

  it('discards a stale in-flight response when a newer URL fetch wins', async () => {
    const older = {
      id: 'old-1',
      parent_id: null,
      author_id: 'u1',
      author_name: 'Old',
      content: 'comments for A',
      created_at: '2026-09-06T10:00:00Z',
      is_deleted: false,
    };
    const newer = {
      id: 'new-1',
      parent_id: null,
      author_id: 'u2',
      author_name: 'New',
      content: 'comments for B',
      created_at: '2026-09-06T11:00:00Z',
      is_deleted: false,
    };

    const delayedClient = commentsClient({ data: [older], delay: 30 });
    const freshClient = commentsClient({ data: [newer] });

    state.normalizedCurrentUrl = 'https://b.example/x';
    window.supabaseClient = delayedClient;
    const stale = loadComments('https://a.example/x');

    window.supabaseClient = freshClient;
    await loadComments('https://b.example/x');
    await stale;

    expect(document.getElementById('comment-list').textContent).toContain('comments for B');
    expect(document.getElementById('comment-list').textContent).not.toContain('comments for A');
  });

  it('discards a response when the active URL no longer matches', async () => {
    state.normalizedCurrentUrl = 'https://other.example/x';
    window.supabaseClient = commentsClient({
      data: [{
        id: '1',
        parent_id: null,
        author_id: 'u1',
        author_name: 'Nope',
        content: 'should not render',
        created_at: '2026-09-06T10:00:00Z',
        is_deleted: false,
      }],
    });

    await loadComments('https://this.example/x');
    expect(document.getElementById('comment-list').textContent).not.toContain('should not render');
  });
});
