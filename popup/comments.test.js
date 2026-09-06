import { 
  canEditComment, 
  canDeleteComment, 
  canReportComment, 
  canVoteComment,
  trimCommentContent,
  isValidCommentContent 
} from './comments.js';
import { initElements } from './ui.js';

describe('comments.js Pure Functions', () => {
  const userA = { id: 'user-a' };
  const userB = { id: 'user-b' };
  
  const normalCommentUserA = { author_id: 'user-a', is_deleted: false };
  const deletedCommentUserA = { author_id: 'user-a', is_deleted: true };

  describe('canEditComment', () => {
    it('returns false if no user', () => {
      expect(canEditComment(normalCommentUserA, null)).toBe(false);
    });
    it('returns false if comment is deleted', () => {
      expect(canEditComment(deletedCommentUserA, userA)).toBe(false);
    });
    it('returns true if user is author', () => {
      expect(canEditComment(normalCommentUserA, userA)).toBe(true);
    });
    it('returns false if user is not author', () => {
      expect(canEditComment(normalCommentUserA, userB)).toBe(false);
    });
  });

  describe('canDeleteComment', () => {
    it('behaves same as canEditComment', () => {
      expect(canDeleteComment(normalCommentUserA, userA)).toBe(true);
      expect(canDeleteComment(normalCommentUserA, userB)).toBe(false);
      expect(canDeleteComment(deletedCommentUserA, userA)).toBe(false);
    });
  });

  describe('canReportComment', () => {
    it('returns false if no user', () => {
      expect(canReportComment(normalCommentUserA, null)).toBe(false);
    });
    it('returns false if comment is deleted', () => {
      expect(canReportComment(deletedCommentUserA, userB)).toBe(false);
    });
    it('returns false if user is author (cannot report own comment)', () => {
      expect(canReportComment(normalCommentUserA, userA)).toBe(false);
    });
    it('returns true if user is not author', () => {
      expect(canReportComment(normalCommentUserA, userB)).toBe(true);
    });
  });

  describe('canVoteComment', () => {
    it('returns true for normal comment', () => {
      expect(canVoteComment(normalCommentUserA)).toBe(true);
    });
    it('returns false for deleted comment', () => {
      expect(canVoteComment(deletedCommentUserA)).toBe(false);
    });
  });

  describe('trimCommentContent', () => {
    it('trims whitespace', () => {
      expect(trimCommentContent('  hello  ')).toBe('hello');
    });
    it('handles null/undefined gracefully', () => {
      expect(trimCommentContent(null)).toBe('');
      expect(trimCommentContent(undefined)).toBe('');
    });
  });

  describe('isValidCommentContent', () => {
    it('returns true for valid content', () => {
      expect(isValidCommentContent('Hello')).toBe(true);
      expect(isValidCommentContent('a'.repeat(1000))).toBe(true);
    });
    it('returns false for empty or whitespace only', () => {
      expect(isValidCommentContent('')).toBe(false);
      expect(isValidCommentContent('   ')).toBe(false);
    });
    it('returns false if over 1000 chars after trim', () => {
      expect(isValidCommentContent('a'.repeat(1001))).toBe(false);
    });
  });

  describe('autoResizeTextarea & resetTextareaSize', () => {
    it('resizes textarea bounded between minHeight and maxHeight', async () => {
      const { autoResizeTextarea, resetTextareaSize } = await import('./comments.js');
      const textarea = document.createElement('textarea');
      Object.defineProperty(textarea, 'scrollHeight', { value: 80, configurable: true });

      autoResizeTextarea(textarea, 48, 140);
      expect(textarea.style.height).toBe('80px');
      expect(textarea.style.overflowY).toBe('hidden');

      // Beyond max height
      Object.defineProperty(textarea, 'scrollHeight', { value: 200, configurable: true });
      autoResizeTextarea(textarea, 48, 140);
      expect(textarea.style.height).toBe('140px');
      expect(textarea.style.overflowY).toBe('auto');

      // Reset
      resetTextareaSize(textarea, 48);
      expect(textarea.style.height).toBe('48px');
      expect(textarea.style.overflowY).toBe('hidden');
    });
  });

  describe('renderCommentList with 1-depth replies', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <select id="sort-select"><option value="latest">Latest</option></select>
        <ul id="comment-list"></ul>
        <div id="state-list" class="hidden"></div>
        <div id="state-empty" class="hidden"></div>
        <div id="app-footer" class="hidden"></div>
      `;
      initElements();
      global.chrome = {
        i18n: {
          getMessage: jest.fn((key) => key)
        }
      };
    });

    it('renders parent comments and nests replies beneath their parent', async () => {
      const { renderCommentList } = await import('./comments.js');
      const comments = [
        { id: 'p1', parent_id: null, content: 'Parent comment 1', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: 'r1', parent_id: 'p1', content: 'Reply to p1', created_at: '2026-09-06T11:00:00Z', is_deleted: false }
      ];

      renderCommentList(comments);

      const items = document.querySelectorAll('.comment-item');
      expect(items.length).toBe(1); // 1 parent item
      expect(items[0].querySelector('#comment-body-p1').textContent).toBe('Parent comment 1');

      // Replies container inside parent
      const replyContainer = items[0].querySelector('#replies-p1');
      expect(replyContainer).not.toBeNull();
      const replyItems = replyContainer.querySelectorAll('.reply-item');
      expect(replyItems.length).toBe(1);
      expect(replyItems[0].querySelector('#comment-body-r1').textContent).toBe('Reply to p1');

      // Parent has reply button
      expect(items[0].querySelector('.btn-action[data-action="reply"]')).not.toBeNull();
      // Reply does NOT have reply button
      expect(replyItems[0].querySelector('.btn-action[data-action="reply"]')).toBeNull();
    });

    it('shows deleted parent as placeholder when active replies exist', async () => {
      const { renderCommentList } = await import('./comments.js');
      const comments = [
        { id: 'p1', parent_id: null, content: 'Original parent', created_at: '2026-09-06T10:00:00Z', is_deleted: true },
        { id: 'r1', parent_id: 'p1', content: 'Active reply', created_at: '2026-09-06T11:00:00Z', is_deleted: false }
      ];

      renderCommentList(comments);

      const items = document.querySelectorAll('.comment-item');
      expect(items.length).toBe(1);
      expect(items[0].querySelector('#comment-body-p1').textContent).toContain('deletedComment');
      // Deleted parent should not have reply action button
      expect(items[0].querySelector('.btn-action[data-action="reply"]')).toBeNull();

      // Active reply is still rendered
      const replyContainer = items[0].querySelector('#replies-p1');
      expect(replyContainer.querySelectorAll('.reply-item').length).toBe(1);
    });

    it('hides deleted parent completely if it has no active replies', async () => {
      const { renderCommentList } = await import('./comments.js');
      const comments = [
        { id: 'p1', parent_id: null, content: 'Original parent', created_at: '2026-09-06T10:00:00Z', is_deleted: true }
      ];

      renderCommentList(comments);

      const items = document.querySelectorAll('.comment-item');
      expect(items.length).toBe(0);
    });
  });
});
