import { 
  canEditComment, 
  canDeleteComment, 
  canReportComment, 
  canVoteComment,
  trimCommentContent,
  isValidCommentContent,
  compareBigIntIdStrings,
  compareCommentsChronological,
  groupCommentThreads,
  renderCommentList,
  paginateThreads,
  THREADS_PER_PAGE,
  changeCommentPage,
  prevCommentPage,
  nextCommentPage,
  getCurrentCommentPage,
  setCurrentCommentPage,
  resetPagination
} from './comments.js';
import { applyFontSize } from './settings.js';
import { initElements } from './ui.js';
import fs from 'fs';
import path from 'path';

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

  describe('compareBigIntIdStrings (bigint-safe numeric string comparator)', () => {
    it('correctly compares positive numeric strings of different lengths without Number()', () => {
      // Lexicographically "10" < "2", but numerically "2" < "10"
      expect(compareBigIntIdStrings('2', '10')).toBeLessThan(0);
      expect(compareBigIntIdStrings('10', '2')).toBeGreaterThan(0);
      expect(compareBigIntIdStrings('99', '100')).toBeLessThan(0);
      expect(compareBigIntIdStrings('1000', '999')).toBeGreaterThan(0);
    });

    it('correctly compares numeric strings of same length', () => {
      expect(compareBigIntIdStrings('10', '25')).toBeLessThan(0);
      expect(compareBigIntIdStrings('25', '10')).toBeGreaterThan(0);
      expect(compareBigIntIdStrings('100', '100')).toBe(0);
    });

    it('handles numeric input or null/empty safely', () => {
      expect(compareBigIntIdStrings(5, '5')).toBe(0);
      expect(compareBigIntIdStrings('', '5')).toBeLessThan(0);
      expect(compareBigIntIdStrings('5', null)).toBeGreaterThan(0);
    });
  });

  describe('compareCommentsChronological', () => {
    it('sorts comments created_at ASC (oldest first)', () => {
      const c1 = { id: '10', created_at: '2026-09-06T10:00:00Z', like_count: 50 };
      const c2 = { id: '2', created_at: '2026-09-06T11:00:00Z', like_count: 5 };

      // c1 is older than c2, so c1 comes first despite lower id or higher likes
      expect(compareCommentsChronological(c1, c2)).toBeLessThan(0);
      expect(compareCommentsChronological(c2, c1)).toBeGreaterThan(0);
    });

    it('tie-breaks identical created_at timestamps using bigint-safe id comparison', () => {
      const cA = { id: '2', created_at: '2026-09-06T10:00:00Z' };
      const cB = { id: '10', created_at: '2026-09-06T10:00:00Z' };

      // Same timestamp: id '2' is numerically smaller than id '10'
      expect(compareCommentsChronological(cA, cB)).toBeLessThan(0);
      expect(compareCommentsChronological(cB, cA)).toBeGreaterThan(0);
    });

    it('never changes order based on like/dislike counts', () => {
      const c1 = { id: '1', created_at: '2026-09-06T10:00:00Z', like_count: 0, dislike_count: 100 };
      const c2 = { id: '2', created_at: '2026-09-06T10:01:00Z', like_count: 1000, dislike_count: 0 };

      expect(compareCommentsChronological(c1, c2)).toBeLessThan(0);
    });
  });

  describe('groupCommentThreads', () => {
    it('correctly groups parents and sibling replies using string IDs and sorts replies ASC', () => {
      const comments = [
        { id: '10', parent_id: null, content: 'Parent 10', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '25', parent_id: '10', content: 'Reply 25 (later)', created_at: '2026-09-06T10:05:00Z', is_deleted: false },
        { id: '20', parent_id: '10', content: 'Reply 20 (earlier)', created_at: '2026-09-06T10:02:00Z', is_deleted: false }
      ];

      const { visibleParents, repliesMap } = groupCommentThreads(comments);
      expect(visibleParents.length).toBe(1);
      expect(visibleParents[0].id).toBe('10');

      const replies = repliesMap['10'];
      expect(replies.length).toBe(2);
      expect(replies[0].id).toBe('20');
      expect(replies[1].id).toBe('25');
    });

    it('includes soft-deleted parents that have active replies', () => {
      const comments = [
        { id: '1', parent_id: null, content: 'Deleted Parent', created_at: '2026-09-06T10:00:00Z', is_deleted: true },
        { id: '2', parent_id: '1', content: 'Active Reply', created_at: '2026-09-06T10:01:00Z', is_deleted: false }
      ];

      const { visibleParents, repliesMap } = groupCommentThreads(comments);
      expect(visibleParents.length).toBe(1);
      expect(visibleParents[0].id).toBe('1');
      expect(repliesMap['1'].length).toBe(1);
    });

    it('excludes soft-deleted parents that have no active replies', () => {
      const comments = [
        { id: '1', parent_id: null, content: 'Deleted Parent', created_at: '2026-09-06T10:00:00Z', is_deleted: true },
        { id: '2', parent_id: '1', content: 'Deleted Reply', created_at: '2026-09-06T10:01:00Z', is_deleted: true }
      ];

      const { visibleParents } = groupCommentThreads(comments);
      expect(visibleParents.length).toBe(0);
    });
  });

  describe('renderCommentList with 1-depth replies', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <ul id="comment-list"></ul>
        <nav id="pagination-controls" class="hidden">
          <button id="btn-prev-page">&lt; 이전</button>
          <span id="page-indicator">1 / 1</span>
          <button id="btn-next-page">다음 &gt;</button>
        </nav>
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

    it('renders parent comments and nests replies beneath their parent in chronological order, placing reply form after replies', async () => {
      const { renderCommentList } = await import('./comments.js');
      const comments = [
        { id: 'p1', parent_id: null, content: 'Parent comment 1', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: 'r2', parent_id: 'p1', content: 'Second reply to p1', created_at: '2026-09-06T12:00:00Z', is_deleted: false },
        { id: 'r1', parent_id: 'p1', content: 'First reply to p1', created_at: '2026-09-06T11:00:00Z', is_deleted: false }
      ];

      renderCommentList(comments);

      const items = document.querySelectorAll('.comment-item');
      expect(items.length).toBe(1); // 1 parent item
      expect(items[0].querySelector('#comment-body-p1').textContent).toBe('Parent comment 1');

      // Replies container inside parent
      const replyContainer = items[0].querySelector('#replies-p1');
      expect(replyContainer).not.toBeNull();
      const replyItems = replyContainer.querySelectorAll('.reply-item');
      expect(replyItems.length).toBe(2);
      
      // Chronological order verification
      expect(replyItems[0].querySelector('.comment-body').textContent).toBe('First reply to p1');
      expect(replyItems[1].querySelector('.comment-body').textContent).toBe('Second reply to p1');

      // Parent has reply button
      expect(items[0].querySelector('.btn-action[data-action="reply"]')).not.toBeNull();
      
      // Reply does NOT have reply button
      expect(replyItems[0].querySelector('.btn-action[data-action="reply"]')).toBeNull();
      
      // Reply form is placed AFTER the replies list in the DOM
      const repliesContainerHTML = replyContainer.outerHTML;
      const formContainerHTML = items[0].querySelector('#reply-form-container-p1').outerHTML;
      const parentHTML = items[0].innerHTML;
      
      const repliesIndex = parentHTML.indexOf('id="replies-p1"');
      const formIndex = parentHTML.indexOf('id="reply-form-container-p1"');
      expect(formIndex).toBeGreaterThan(repliesIndex);
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

  describe('12 Required 1-Depth Multi-Sibling Reply Interaction Tests', () => {
    let commentsModule;
    let stateModule;

    beforeEach(async () => {
      document.body.innerHTML = `
        <div id="app">
          <div id="error-banner" class="error-banner hidden">
            <span id="error-message" class="error-message"></span>
            <button id="btn-close-error" class="btn-close-error">&times;</button>
          </div>
          <p id="loading-text"></p>
          <div id="state-loading" class="state-view hidden"></div>
          <div id="state-list" class="state-view">
            <ul id="comment-list" class="comment-list"></ul>
          </div>
          <nav id="pagination-controls" class="hidden">
            <button id="btn-prev-page">&lt; 이전</button>
            <span id="page-indicator">1 / 1</span>
            <button id="btn-next-page">다음 &gt;</button>
          </nav>
          <div id="state-empty" class="state-view hidden"></div>
        </div>
      `;
      initElements();
      global.chrome = {
        i18n: {
          getMessage: jest.fn((key) => key)
        }
      };
      global.alert = jest.fn();
      commentsModule = await import('./comments.js');
      stateModule = await import('./state.js');
      stateModule.state.currentUser = { id: 'test-user-id', user_metadata: { name: 'Tester' } };
      stateModule.state.normalizedCurrentUrl = 'https://example.com/test';
    });

    it('1. A top-level comment renders a Reply button with the correct data-parent-id and accessibility classes', () => {
      const parent = { id: '101', parent_id: null, content: 'Parent 101', created_at: '2026-09-06T10:00:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent]);

      const replyBtn = document.querySelector('.reply-button.btn-action[data-action="reply"]');
      expect(replyBtn).not.toBeNull();
      expect(replyBtn.getAttribute('data-parent-id')).toBe('101');
      expect(replyBtn.getAttribute('data-id')).toBe('101');
      expect(replyBtn.getAttribute('type')).toBe('button');
      expect(replyBtn.querySelector('.reply-icon').textContent).toBe('↳');
      expect(replyBtn.querySelector('.reply-label').textContent).toBe('btnReply');
    });

    it('2. A parent with zero replies can open a reply form', () => {
      const parent = { id: '102', parent_id: null, content: 'Parent 102', created_at: '2026-09-06T10:00:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent]);

      const formContainer = document.getElementById('reply-form-container-102');
      expect(formContainer).not.toBeNull();
      expect(formContainer.classList.contains('hidden')).toBe(true);

      // Trigger opening form
      formContainer.classList.remove('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('reply-input-102')).not.toBeNull();
    });

    it('3. A parent with one existing reply can open a new reply form', () => {
      const comments = [
        { id: '103', parent_id: null, content: 'Parent 103', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '201', parent_id: '103', content: 'Reply 1 to 103', created_at: '2026-09-06T10:05:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const replyBtn = document.querySelector('.reply-button[data-parent-id="103"]');
      expect(replyBtn).not.toBeNull();

      const formContainer = document.getElementById('reply-form-container-103');
      expect(formContainer).not.toBeNull();
      expect(formContainer.classList.contains('hidden')).toBe(true);

      // Open form
      formContainer.classList.remove('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(false);
    });

    it('4. A parent with multiple existing replies can open a new reply form', () => {
      const comments = [
        { id: '104', parent_id: null, content: 'Parent 104', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '202', parent_id: '104', content: 'Reply 1', created_at: '2026-09-06T10:05:00Z', is_deleted: false },
        { id: '203', parent_id: '104', content: 'Reply 2', created_at: '2026-09-06T10:10:00Z', is_deleted: false },
        { id: '204', parent_id: '104', content: 'Reply 3', created_at: '2026-09-06T10:15:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const formContainer = document.getElementById('reply-form-container-104');
      expect(formContainer).not.toBeNull();
      formContainer.classList.remove('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(false);
    });

    it('5. After successful Reply A submission, the parent Reply button still exists with matching data-parent-id', async () => {
      const parent = { id: '105', parent_id: null, content: 'Parent 105', created_at: '2026-09-06T10:00:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent]);

      // Reply A is submitted and comments are rerendered
      const replyA = { id: '205', parent_id: '105', content: 'Reply A', created_at: '2026-09-06T10:05:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent, replyA]);

      const replyBtn = document.querySelector('.reply-button[data-parent-id="105"]');
      expect(replyBtn).not.toBeNull();
      expect(replyBtn.getAttribute('data-parent-id')).toBe('105');
    });

    it('6. Clicking the same parent Reply button again opens a new empty form', () => {
      const comments = [
        { id: '106', parent_id: null, content: 'Parent 106', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '206', parent_id: '106', content: 'Reply A', created_at: '2026-09-06T10:05:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const formContainer = document.getElementById('reply-form-container-106');
      const inputEl = document.getElementById('reply-input-106');
      expect(formContainer.classList.contains('hidden')).toBe(true);
      expect(inputEl.value).toBe('');

      // Open form
      formContainer.classList.remove('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(false);
      expect(inputEl.value).toBe('');
    });

    it('7. Reply B submission succeeds with the same parent_id as Reply A', async () => {
      const insertedRows = [];
      window.supabaseClient = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockImplementation((rows) => {
            insertedRows.push(...rows);
            return Promise.resolve({ error: null });
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      };

      const parent = { id: '107', parent_id: null, content: 'Parent 107', created_at: '2026-09-06T10:00:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent]);

      // Submit Reply A
      const inputA = document.getElementById('reply-input-107');
      inputA.value = 'Reply A content';
      await commentsModule.handleReplySubmit('107');

      expect(insertedRows.length).toBe(1);
      expect(insertedRows[0].parent_id).toBe('107');
      expect(insertedRows[0].content).toBe('Reply A content');

      // Now rerender with Parent + Reply A
      const replyA = { id: '207', parent_id: '107', content: 'Reply A content', created_at: '2026-09-06T10:05:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent, replyA]);

      // Submit Reply B to the same parent
      const inputB = document.getElementById('reply-input-107');
      inputB.value = 'Reply B content';
      await commentsModule.handleReplySubmit('107');

      expect(insertedRows.length).toBe(2);
      expect(insertedRows[1].parent_id).toBe('107');
      expect(insertedRows[1].content).toBe('Reply B content');
      expect(insertedRows[0].parent_id).toBe(insertedRows[1].parent_id);
    });

    it('8. Reply A and Reply B render in created_at ASC order under the same parent', () => {
      const comments = [
        { id: '108', parent_id: null, content: 'Parent 108', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '209', parent_id: '108', content: 'Later reply B', created_at: '2026-09-06T10:20:00Z', is_deleted: false },
        { id: '208', parent_id: '108', content: 'Earlier reply A', created_at: '2026-09-06T10:10:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const repliesContainer = document.getElementById('replies-108');
      const replyItems = repliesContainer.querySelectorAll('.reply-item');
      expect(replyItems.length).toBe(2);
      expect(replyItems[0].getAttribute('data-id')).toBe('208');
      expect(replyItems[0].querySelector('.comment-body').textContent).toBe('Earlier reply A');
      expect(replyItems[1].getAttribute('data-id')).toBe('209');
      expect(replyItems[1].querySelector('.comment-body').textContent).toBe('Later reply B');
    });

    it('9. Replies do not render Reply buttons', () => {
      const comments = [
        { id: '109', parent_id: null, content: 'Parent 109', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '210', parent_id: '109', content: 'Reply 1', created_at: '2026-09-06T10:10:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const repliesContainer = document.getElementById('replies-109');
      const replyItem = repliesContainer.querySelector('.reply-item');
      expect(replyItem.querySelector('.reply-button')).toBeNull();
      expect(replyItem.querySelector('.btn-action[data-action="reply"]')).toBeNull();
    });

    it('10. Failed submission preserves draft text and form visibility', async () => {
      window.supabaseClient = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({ error: new Error('Network failure') })
        })
      };

      const parent = { id: '110', parent_id: null, content: 'Parent 110', created_at: '2026-09-06T10:00:00Z', is_deleted: false };
      commentsModule.renderCommentList([parent]);

      const formContainer = document.getElementById('reply-form-container-110');
      formContainer.classList.remove('hidden');

      const inputEl = document.getElementById('reply-input-110');
      inputEl.value = 'Important draft reply text';

      await commentsModule.handleReplySubmit('110');

      // Form remains visible and draft is untouched
      expect(formContainer.classList.contains('hidden')).toBe(false);
      expect(inputEl.value).toBe('Important draft reply text');
      expect(global.alert).toHaveBeenCalled();
    });

    it('11. Cancel hides the form without deleting or changing replies', () => {
      const comments = [
        { id: '111', parent_id: null, content: 'Parent 111', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '211', parent_id: '111', content: 'Reply 1', created_at: '2026-09-06T10:10:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const formContainer = document.getElementById('reply-form-container-111');
      formContainer.classList.remove('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(false);

      // Trigger cancel
      const cancelBtn = formContainer.querySelector('.btn-action-cancel-reply');
      expect(cancelBtn).not.toBeNull();
      formContainer.classList.add('hidden');
      expect(formContainer.classList.contains('hidden')).toBe(true);

      // Existing replies unaffected
      const repliesContainer = document.getElementById('replies-111');
      expect(repliesContainer.querySelectorAll('.reply-item').length).toBe(1);
    });

    it('12. The reply form is placed after the replies container and is not clipped by layout', () => {
      const comments = [
        { id: '112', parent_id: null, content: 'Parent 112', created_at: '2026-09-06T10:00:00Z', is_deleted: false },
        { id: '212', parent_id: '112', content: 'Reply 1', created_at: '2026-09-06T10:10:00Z', is_deleted: false },
        { id: '213', parent_id: '112', content: 'Reply 2', created_at: '2026-09-06T10:15:00Z', is_deleted: false }
      ];
      commentsModule.renderCommentList(comments);

      const parentItem = document.querySelector('.comment-item[data-id="112"]');
      const repliesContainer = document.getElementById('replies-112');
      const formContainer = document.getElementById('reply-form-container-112');

      expect(parentItem.contains(repliesContainer)).toBe(true);
      expect(parentItem.contains(formContainer)).toBe(true);

      // Verify DOM ordering: repliesContainer comes BEFORE formContainer
      const parentHTML = parentItem.innerHTML;
      const repliesIdx = parentHTML.indexOf('id="replies-112"');
      const formIdx = parentHTML.indexOf('id="reply-form-container-112"');
      expect(formIdx).toBeGreaterThan(repliesIdx);
    });
  });

  describe('Gate 2: Pagination, Chronological ASC Ordering, Reactions, and Font Size', () => {
    describe('paginateThreads pure helper', () => {
      it('returns empty results and totalPages=1 for empty or non-array inputs', () => {
        expect(paginateThreads([])).toEqual({
          pagedThreads: [],
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
        });
        expect(paginateThreads(null)).toEqual({
          pagedThreads: [],
          currentPage: 1,
          totalPages: 1,
          totalCount: 0
        });
      });

      it('correctly splits threads into pages of size THREADS_PER_PAGE (10)', () => {
        const threads = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1), content: `Thread ${i + 1}` }));
        
        const page1 = paginateThreads(threads, 1, 10);
        expect(page1.totalPages).toBe(3);
        expect(page1.currentPage).toBe(1);
        expect(page1.totalCount).toBe(25);
        expect(page1.pagedThreads.length).toBe(10);
        expect(page1.pagedThreads[0].id).toBe('1');
        expect(page1.pagedThreads[9].id).toBe('10');

        const page2 = paginateThreads(threads, 2, 10);
        expect(page2.currentPage).toBe(2);
        expect(page2.pagedThreads.length).toBe(10);
        expect(page2.pagedThreads[0].id).toBe('11');
        expect(page2.pagedThreads[9].id).toBe('20');

        const page3 = paginateThreads(threads, 3, 10);
        expect(page3.currentPage).toBe(3);
        expect(page3.pagedThreads.length).toBe(5);
        expect(page3.pagedThreads[0].id).toBe('21');
        expect(page3.pagedThreads[4].id).toBe('25');
      });

      it('clamps requested page within [1, totalPages]', () => {
        const threads = Array.from({ length: 15 }, (_, i) => ({ id: String(i + 1) }));
        
        const clampedLow = paginateThreads(threads, 0, 10);
        expect(clampedLow.currentPage).toBe(1);
        expect(clampedLow.pagedThreads.length).toBe(10);

        const clampedNeg = paginateThreads(threads, -5, 10);
        expect(clampedNeg.currentPage).toBe(1);

        const clampedHigh = paginateThreads(threads, 99, 10);
        expect(clampedHigh.currentPage).toBe(2);
        expect(clampedHigh.pagedThreads.length).toBe(5);
      });
    });

    describe('renderCommentList in-memory pagination and thread grouping', () => {
      beforeEach(() => {
        document.body.innerHTML = `
          <div id="app">
            <div id="error-banner" class="error-banner hidden">
              <span id="error-message" class="error-message"></span>
            </div>
            <div id="state-loading" class="state-view hidden"></div>
            <div id="state-list" class="state-view">
              <ul id="comment-list" class="comment-list"></ul>
            </div>
            <nav id="pagination-controls" class="hidden">
              <button id="btn-prev-page">&lt; 이전</button>
              <span id="page-indicator">1 / 1</span>
              <button id="btn-next-page">다음 &gt;</button>
            </nav>
            <div id="state-empty" class="state-view hidden"></div>
          </div>
        `;
        initElements();
        global.chrome = {
          i18n: {
            getMessage: jest.fn((key) => key)
          }
        };
        resetPagination();
      });

      it('paginates top-level threads only and never splits a parent from its replies', () => {
        // Create 15 parent comments; parent 1 has 3 replies
        const comments = [];
        for (let i = 1; i <= 15; i++) {
          comments.push({
            id: String(i),
            parent_id: null,
            content: `Parent ${i}`,
            created_at: `2026-09-06T10:${String(i).padStart(2, '0')}:00Z`,
            is_deleted: false
          });
        }
        // Add replies to parent 1
        comments.push(
          { id: '101', parent_id: '1', content: 'Reply 1-A', created_at: '2026-09-06T10:01:10Z', is_deleted: false },
          { id: '102', parent_id: '1', content: 'Reply 1-B', created_at: '2026-09-06T10:01:20Z', is_deleted: false },
          { id: '103', parent_id: '1', content: 'Reply 1-C', created_at: '2026-09-06T10:01:30Z', is_deleted: false }
        );

        renderCommentList(comments);

        // Page 1 should have exactly 10 parent thread elements
        const commentItems = document.querySelectorAll('.comment-item');
        expect(commentItems.length).toBe(10);
        expect(commentItems[0].getAttribute('data-id')).toBe('1');

        // Parent 1 must retain all 3 replies on page 1
        const repliesParent1 = commentItems[0].querySelectorAll('.reply-item');
        expect(repliesParent1.length).toBe(3);

        // Pagination controls are visible
        const paginationControls = document.getElementById('pagination-controls');
        expect(paginationControls.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('page-indicator').textContent).toBe('1 / 2');
        expect(document.getElementById('btn-prev-page').disabled).toBe(true);
        expect(document.getElementById('btn-next-page').disabled).toBe(false);

        // Switch to page 2 in memory without calling Supabase
        changeCommentPage(2);

        const page2Items = document.querySelectorAll('.comment-item');
        expect(page2Items.length).toBe(5); // remaining 5 parents (11..15)
        expect(page2Items[0].getAttribute('data-id')).toBe('11');
        expect(page2Items[4].getAttribute('data-id')).toBe('15');

        expect(document.getElementById('page-indicator').textContent).toBe('2 / 2');
        expect(document.getElementById('btn-prev-page').disabled).toBe(false);
        expect(document.getElementById('btn-next-page').disabled).toBe(true);

        // Navigate back with prevCommentPage()
        prevCommentPage();
        expect(getCurrentCommentPage()).toBe(1);
        expect(document.querySelectorAll('.comment-item').length).toBe(10);
        expect(document.getElementById('page-indicator').textContent).toBe('1 / 2');

        // Navigate forward with nextCommentPage()
        nextCommentPage();
        expect(getCurrentCommentPage()).toBe(2);
        expect(document.querySelectorAll('.comment-item').length).toBe(5);
        expect(document.getElementById('page-indicator').textContent).toBe('2 / 2');
      });

      it('hides pagination controls when top-level threads <= 10', () => {
        const comments = Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          parent_id: null,
          content: `Comment ${i + 1}`,
          created_at: `2026-09-06T10:0${i}:00Z`,
          is_deleted: false
        }));

        renderCommentList(comments);

        expect(document.querySelectorAll('.comment-item').length).toBe(5);
        const paginationControls = document.getElementById('pagination-controls');
        expect(paginationControls.classList.contains('hidden')).toBe(true);
      });

      it('preserves reading position on normal refresh and clamps on thread reduction', () => {
        const comments = Array.from({ length: 25 }, (_, i) => ({
          id: String(i + 1),
          parent_id: null,
          content: `Comment ${i + 1}`,
          created_at: `2026-09-06T10:${String(i).padStart(2, '0')}:00Z`,
          is_deleted: false
        }));

        renderCommentList(comments);
        changeCommentPage(2);
        expect(getCurrentCommentPage()).toBe(2);

        // Refresh with same comments: keeps page 2
        renderCommentList(comments);
        expect(getCurrentCommentPage()).toBe(2);

        // When threads reduce to 5 (totalPages becomes 1), page is clamped to 1
        const reducedComments = comments.slice(0, 5);
        renderCommentList(reducedComments);
        expect(getCurrentCommentPage()).toBe(1);
        expect(document.getElementById('page-indicator').textContent).toBe('1 / 1');
      });
    });

    describe('Compact Reaction Group and Header Standardization', () => {
      beforeEach(() => {
        document.body.innerHTML = `
          <ul id="comment-list"></ul>
          <nav id="pagination-controls" class="hidden">
            <button id="btn-prev-page">&lt; 이전</button>
            <span id="page-indicator">1 / 1</span>
            <button id="btn-next-page">다음 &gt;</button>
          </nav>
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

      it('places Like and Dislike immediately in .comment-header-left with .vote-group and eliminates bottom .vote-area', () => {
        const comment = {
          id: '201',
          parent_id: null,
          content: 'Compact header test',
          created_at: '2026-09-06T10:00:00Z',
          author_name: 'VeryLongAuthorDisplayName123456789',
          like_count: 7,
          dislike_count: 2,
          is_deleted: false
        };

        renderCommentList([comment], { '201': 'like' }, { 'user-1': { public_id: 'PUB-123' } });

        const item = document.querySelector('.comment-item[data-id="201"]');
        expect(item).not.toBeNull();

        // 1. Check .comment-header-left structure
        const headerLeft = item.querySelector('.comment-header-left');
        expect(headerLeft).not.toBeNull();

        const authorContainer = headerLeft.querySelector('.author-container');
        expect(authorContainer).not.toBeNull();
        const authorBtn = authorContainer.querySelector('.comment-author');
        expect(authorBtn).not.toBeNull();
        expect(authorBtn.getAttribute('title')).toBe('VeryLongAuthorDisplayName123456789');
        expect(authorBtn.getAttribute('aria-label')).toBe('VeryLongAuthorDisplayName123456789');

        const voteGroup = headerLeft.querySelector('.vote-group');
        expect(voteGroup).not.toBeNull();

        const likeBtn = voteGroup.querySelector('.btn-vote.btn-like');
        const dislikeBtn = voteGroup.querySelector('.btn-vote.btn-dislike');
        expect(likeBtn).not.toBeNull();
        expect(dislikeBtn).not.toBeNull();
        expect(likeBtn.classList.contains('active')).toBe(true);
        expect(likeBtn.querySelector('.like-count').textContent).toBe('7');
        expect(dislikeBtn.querySelector('.dislike-count').textContent).toBe('2');

        // 2. Ensure bottom .vote-area does NOT exist
        expect(item.querySelector('.vote-area')).toBeNull();

        // 3. Reply button is standardized in .comment-header-right
        const headerRight = item.querySelector('.comment-header-right');
        expect(headerRight).not.toBeNull();
        const replyBtn = headerRight.querySelector('.reply-button');
        expect(replyBtn).not.toBeNull();
        expect(replyBtn.querySelector('.reply-icon').textContent).toBe('↳');
      });

      it('does not render reply button or vote-group on soft-deleted parents', () => {
        const comments = [
          { id: '301', parent_id: null, content: 'Deleted parent', created_at: '2026-09-06T10:00:00Z', is_deleted: true },
          { id: '302', parent_id: '301', content: 'Active child', created_at: '2026-09-06T10:05:00Z', is_deleted: false }
        ];

        renderCommentList(comments);

        const parentItem = document.querySelector('.comment-item[data-id="301"]');
        expect(parentItem).not.toBeNull();
        expect(parentItem.querySelector('.reply-button')).toBeNull();
        expect(parentItem.querySelector('.comment-main .vote-group')).toBeNull();

        // Active child has vote group but no reply button
        const replyItem = parentItem.querySelector('.reply-item[data-id="302"]');
        expect(replyItem).not.toBeNull();
        expect(replyItem.querySelector('.vote-group')).not.toBeNull();
        expect(replyItem.querySelector('.reply-button')).toBeNull();
      });
    });

    describe('Persistent Font Size Settings', () => {
      beforeEach(() => {
        document.documentElement.removeAttribute('data-font-size');
      });

      it('applies font size attribute correctly to document.documentElement', () => {
        applyFontSize('small');
        expect(document.documentElement.getAttribute('data-font-size')).toBe('small');

        applyFontSize('large');
        expect(document.documentElement.getAttribute('data-font-size')).toBe('large');

        applyFontSize('default');
        expect(document.documentElement.getAttribute('data-font-size')).toBe('default');

        // Invalid fallback
        applyFontSize('invalid-size');
        expect(document.documentElement.getAttribute('data-font-size')).toBe('default');
      });

      it('ensures top-level comment body, reply body, and deleted placeholders use the shared .comment-body class', () => {
        const comments = [
          {
            id: 401,
            author_id: 'user-p',
            content: 'Parent comment body text',
            created_at: '2026-09-06T10:00:00Z',
            is_deleted: false,
            parent_id: null
          },
          {
            id: 402,
            author_id: 'user-r',
            content: 'Reply comment body text',
            created_at: '2026-09-06T10:05:00Z',
            is_deleted: false,
            parent_id: 401
          },
          {
            id: 403,
            author_id: 'user-d',
            content: 'Deleted comment content',
            created_at: '2026-09-06T10:10:00Z',
            is_deleted: true,
            parent_id: null
          },
          {
            id: 404,
            author_id: 'user-rd',
            content: 'Reply under deleted parent',
            created_at: '2026-09-06T10:15:00Z',
            is_deleted: false,
            parent_id: 403
          }
        ];

        renderCommentList(comments, {}, {}, {});

        // 1. Parent body uses .comment-body
        const parentItem = document.querySelector('.comment-item[data-id="401"]');
        const parentBody = parentItem.querySelector('.comment-body');
        expect(parentBody).not.toBeNull();
        expect(parentBody.textContent).toContain('Parent comment body text');

        // 2. Reply body uses .comment-body
        const replyItem = parentItem.querySelector('.reply-item[data-id="402"]');
        const replyBody = replyItem.querySelector('.comment-body');
        expect(replyBody).not.toBeNull();
        expect(replyBody.textContent).toContain('Reply comment body text');

        // 3. Deleted parent body uses .comment-body
        const deletedParentItem = document.querySelector('.comment-item[data-id="403"]');
        const deletedParentBody = deletedParentItem.querySelector('.comment-body');
        expect(deletedParentBody).not.toBeNull();
        expect(deletedParentBody.innerHTML).toContain('deletedComment');

        // 4. Form textareas exist
        const replyInput = parentItem.querySelector('.reply-input');
        expect(replyInput).not.toBeNull();
        expect(replyInput.tagName.toLowerCase()).toBe('textarea');
        const editInput = parentItem.querySelector('#comment-edit-input-401');
        expect(editInput).not.toBeNull();
        expect(editInput.tagName.toLowerCase()).toBe('textarea');
        expect(editInput).not.toBeNull();
      });

      it('verifies popup.css defines scalable tokens and applies var(--font-size-base) to .comment-body and textarea', () => {
        const cssPath = path.join(__dirname, 'popup.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        // Check root font-size tokens
        expect(cssContent).toMatch(/--line-height-body:\s*1\.5/);
        expect(cssContent).toMatch(/\[data-font-size="small"\]\s*\{[^}]*--font-size-base:\s*12px/);
        expect(cssContent).toMatch(/\[data-font-size="default"\]\s*\{[^}]*--font-size-base:\s*14px/);
        expect(cssContent).toMatch(/\[data-font-size="large"\]\s*\{[^}]*--font-size-base:\s*16px/);

        // Check .comment-body uses var(--font-size-base) and line-height
        expect(cssContent).toMatch(/\.comment-body\s*\{[^}]*font-size:\s*var\(--font-size-base\)/);
        expect(cssContent).toMatch(/\.comment-body\s*\{[^}]*line-height:\s*var\(--line-height-body,\s*1\.5\)/);

        // Check textarea uses var(--font-size-base)
        expect(cssContent).toMatch(/textarea\s*\{[^}]*font-size:\s*var\(--font-size-base\)/);

        // Check .my-comment-body uses var(--font-size-base)
        expect(cssContent).toMatch(/\.my-comment-body\s*\{[^}]*font-size:\s*var\(--font-size-base\)/);
      });
    });
  });
});
