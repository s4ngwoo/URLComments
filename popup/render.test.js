import { renderReplyItem } from './render.js';
import { state } from './state.js';

describe('popup/render.js', () => {
  beforeEach(() => {
    state.currentUser = { id: 'user-a' };
  });

  it('omits soft-deleted replies from the thread HTML', () => {
    const html = renderReplyItem(
      {
        id: 'r1',
        parent_id: 'p1',
        author_id: 'user-b',
        content: 'gone',
        created_at: '2026-09-06T10:00:00Z',
        is_deleted: true
      },
      {},
      {},
      {}
    );
    expect(html).toBe('');
  });

  it('shows an edited badge when updated_at differs from created_at', () => {
    const html = renderReplyItem(
      {
        id: 'r2',
        parent_id: 'p1',
        author_id: 'user-b',
        author_name: 'Bob',
        content: 'hello',
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T11:00:00Z',
        is_deleted: false
      },
      {},
      {},
      {}
    );
    expect(html).toContain('comment-edited');
    expect(html).toContain('labelEdited');
  });

  it('does not mark a reply as edited when timestamps match', () => {
    const html = renderReplyItem(
      {
        id: 'r3',
        parent_id: 'p1',
        author_id: 'user-b',
        author_name: 'Bob',
        content: 'hello',
        created_at: '2026-09-06T10:00:00Z',
        updated_at: '2026-09-06T10:00:00Z',
        is_deleted: false
      },
      {},
      {},
      {}
    );
    expect(html).not.toContain('comment-edited');
  });
});
