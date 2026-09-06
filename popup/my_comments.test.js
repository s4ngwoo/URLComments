import {
  formatDisplayUrl,
  openOriginalUrl,
  invalidateMyCommentsCache,
  getMyCommentsCache,
  setMyCommentsCache,
  resetMyCommentsCache,
  renderMyComments,
  loadMyComments
} from './my_comments.js';
import { state } from './state.js';

describe('my_comments.js', () => {
  beforeEach(() => {
    resetMyCommentsCache();
    state.currentUser = null;
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
    global.chrome = {
      tabs: {
        create: jest.fn()
      },
      i18n: {
        getMessage: jest.fn((key) => key)
      }
    };
  });

  describe('formatDisplayUrl', () => {
    it('formats a regular URL to domain and pathname', () => {
      expect(formatDisplayUrl('https://example.com/posts/123')).toBe('example.com/posts/123');
    });

    it('strips www prefix from domain', () => {
      expect(formatDisplayUrl('https://www.google.com/search')).toBe('google.com/search');
    });

    it('returns empty pathname cleanly for root URLs', () => {
      expect(formatDisplayUrl('https://example.com/')).toBe('example.com');
    });

    it('truncates excessively long URLs with ellipsis', () => {
      const longUrl = 'https://example.com/very/long/path/that/exceeds/the/maximum/allowed/display/length/and/keeps/going';
      const formatted = formatDisplayUrl(longUrl);
      expect(formatted.length).toBeLessThanOrEqual(42);
      expect(formatted.endsWith('...')).toBe(true);
    });

    it('handles invalid URL string gracefully', () => {
      expect(formatDisplayUrl('not-a-valid-url')).toBe('not-a-valid-url');
    });
  });

  describe('openOriginalUrl', () => {
    it('calls chrome.tabs.create with the URL', () => {
      openOriginalUrl('https://example.com');
      expect(global.chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://example.com' });
    });

    it('does nothing if url is empty', () => {
      openOriginalUrl('');
      expect(global.chrome.tabs.create).not.toHaveBeenCalled();
    });
  });

  describe('Cache management', () => {
    it('invalidates cache correctly', () => {
      setMyCommentsCache([{ id: 'c1' }]);
      expect(getMyCommentsCache()).toEqual([{ id: 'c1' }]);
      invalidateMyCommentsCache();
      // Cache data still holds previous until refetched or reset
      expect(getMyCommentsCache()).toEqual([{ id: 'c1' }]);
    });

    it('resets cache correctly', () => {
      setMyCommentsCache([{ id: 'c1' }]);
      resetMyCommentsCache();
      expect(getMyCommentsCache()).toBeNull();
    });
  });

  describe('renderMyComments', () => {
    it('shows empty view when comments array is empty', () => {
      renderMyComments([]);
      expect(document.getElementById('my-comments-empty').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('my-comments-list-container').classList.contains('hidden')).toBe(true);
    });

    it('renders list items and shows list view when comments exist', () => {
      const comments = [
        {
          id: '1',
          url: 'https://example.com/article',
          content: 'Great read!',
          created_at: '2026-09-06T12:00:00Z'
        }
      ];

      renderMyComments(comments);
      expect(document.getElementById('my-comments-list-container').classList.contains('hidden')).toBe(false);
      const listItems = document.querySelectorAll('.my-comment-item');
      expect(listItems.length).toBe(1);
      expect(listItems[0].querySelector('.my-comment-body').textContent).toBe('Great read!');
      expect(listItems[0].querySelector('.btn-open-url').getAttribute('data-url')).toBe('https://example.com/article');
    });
  });

  describe('loadMyComments', () => {
    it('shows unauth view when currentUser is null', async () => {
      state.currentUser = null;
      await loadMyComments();
      expect(document.getElementById('my-comments-unauth').classList.contains('hidden')).toBe(false);
    });

    it('queries Supabase comments for current user and renders them', async () => {
      state.currentUser = { id: 'test-user-123' };

      const mockComments = [
        { id: 'c1', author_id: 'test-user-123', url: 'https://example.com/page1', content: 'Comment 1', created_at: '2026-09-06T12:00:00Z' },
        { id: 'c2', author_id: 'test-user-123', url: 'https://example.com/page2', content: 'Comment 2', created_at: '2026-09-06T11:00:00Z' }
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockComments, error: null });
      const mockEqDeleted = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEqAuthor = jest.fn().mockReturnValue({ eq: mockEqDeleted });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqAuthor });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      window.supabaseClient = {
        from: mockFrom
      };

      await loadMyComments();

      expect(mockFrom).toHaveBeenCalledWith('comments');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEqAuthor).toHaveBeenCalledWith('author_id', 'test-user-123');
      expect(mockEqDeleted).toHaveBeenCalledWith('is_deleted', false);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(document.getElementById('my-comments-list-container').classList.contains('hidden')).toBe(false);
      expect(document.querySelectorAll('.my-comment-item').length).toBe(2);
      expect(getMyCommentsCache()).toEqual(mockComments);
    });

    it('shows error view when Supabase query fails', async () => {
      state.currentUser = { id: 'test-user-123' };

      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Network error') });
      const mockEqDeleted = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEqAuthor = jest.fn().mockReturnValue({ eq: mockEqDeleted });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqAuthor });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      window.supabaseClient = {
        from: mockFrom
      };

      await loadMyComments();

      expect(document.getElementById('my-comments-error').classList.contains('hidden')).toBe(false);
    });
  });
});
