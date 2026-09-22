import { loadMyComments, resetMyCommentsCache } from './my_comments.js';
import { state } from './state.js';

describe('loadMyComments missing supabase client', () => {
  beforeEach(() => {
    resetMyCommentsCache();
    state.currentUser = { id: 'user-1' };
    document.body.innerHTML = `
      <section id="tab-my-comments">
        <div id="my-comments-loading" class="hidden"></div>
        <div id="my-comments-unauth" class="hidden"></div>
        <div id="my-comments-empty" class="hidden"></div>
        <div id="my-comments-error" class="hidden"></div>
        <div id="my-comments-list-container" class="hidden">
          <ul id="my-comment-list"></ul>
        </div>
      </section>
    `;
    window.supabaseClient = null;
  });

  it('shows the error view instead of querying when supabase is missing', async () => {
    await loadMyComments();

    expect(document.getElementById('my-comments-error').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('my-comments-loading').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('my-comments-list-container').classList.contains('hidden')).toBe(true);
  });
});
