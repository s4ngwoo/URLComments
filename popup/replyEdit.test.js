import { handleEditComment, handleReplySubmit } from './api.js';
import { loadComments } from './comments.js';
import { invalidateMyCommentsCache } from './my_comments.js';
import { state, resetState } from './state.js';
import * as ui from './ui.js';

jest.mock('./comments.js', () => ({
  loadComments: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

jest.mock('./render.js', () => ({
  resetTextareaSize: jest.fn(),
}));

jest.mock('./ui.js', () => ({
  elements: {
    commentInput: { value: '' },
    charCount: { textContent: '' },
    btnSubmit: { disabled: false, textContent: '' },
  },
  showLoading: jest.fn(),
  showError: jest.fn(),
  hideError: jest.fn(),
  showState: jest.fn(),
  setSubmitButtonLoading: jest.fn(),
}));

function replyFixture(parentId = 'parent-1') {
  document.body.innerHTML = `
    <textarea id="reply-input-${parentId}"></textarea>
    <button class="btn-action-submit-reply" data-parent-id="${parentId}">등록</button>
  `;
}

function mockInsert(result = { error: null }) {
  const insert = jest.fn().mockResolvedValue(result);
  window.supabaseClient = {
    from: jest.fn(() => ({ insert })),
  };
  return insert;
}

function mockUpdate(result = { error: null }) {
  const eq = jest.fn().mockResolvedValue(result);
  const update = jest.fn().mockReturnValue({ eq });
  window.supabaseClient = {
    from: jest.fn(() => ({ update })),
  };
  return { update, eq };
}

describe('popup/api.js reply and edit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    state.normalizedCurrentUrl = 'https://example.com/page';
    global.alert = jest.fn();
    window.supabaseClient = undefined;
  });

  describe('handleReplySubmit', () => {
    it('alerts and does not insert when unauthenticated', async () => {
      replyFixture();
      document.getElementById('reply-input-parent-1').value = 'hello';
      const insert = mockInsert();

      await handleReplySubmit('parent-1');

      expect(global.alert).toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('alerts and does not insert when content is empty', async () => {
      state.currentUser = { id: 'user-1', email: 'a@b.com' };
      replyFixture();
      document.getElementById('reply-input-parent-1').value = '   ';
      const insert = mockInsert();

      await handleReplySubmit('parent-1');

      expect(global.alert).toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('alerts and does not insert when content exceeds 1000 characters', async () => {
      state.currentUser = { id: 'user-1', email: 'a@b.com' };
      replyFixture();
      document.getElementById('reply-input-parent-1').value = 'x'.repeat(1001);
      const insert = mockInsert();

      await handleReplySubmit('parent-1');

      expect(global.alert).toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
    });

    it('inserts a reply with parent_id and reloads comments on success', async () => {
      state.currentUser = {
        id: 'user-1',
        email: 'a@b.com',
        user_metadata: { full_name: 'Ada' },
      };
      replyFixture();
      document.getElementById('reply-input-parent-1').value = 'Thanks!';
      const insert = mockInsert({ error: null });

      await handleReplySubmit('parent-1');

      expect(window.supabaseClient.from).toHaveBeenCalledWith('comments');
      expect(insert).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/page',
          author_id: 'user-1',
          author_name: 'Ada',
          content: 'Thanks!',
          parent_id: 'parent-1',
        }),
      ]);
      expect(document.getElementById('reply-input-parent-1').value).toBe('');
      expect(invalidateMyCommentsCache).toHaveBeenCalled();
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });

    it('alerts and restores the submit button when insert fails', async () => {
      state.currentUser = { id: 'user-1', email: 'a@b.com' };
      replyFixture();
      document.getElementById('reply-input-parent-1').value = 'Thanks!';
      mockInsert({ error: new Error('insert failed') });

      await handleReplySubmit('parent-1');

      expect(global.alert).toHaveBeenCalled();
      const submitBtn = document.querySelector('.btn-action-submit-reply');
      expect(submitBtn.disabled).toBe(false);
      expect(submitBtn.textContent).toBe('등록');
      expect(loadComments).not.toHaveBeenCalled();
    });
  });

  describe('handleEditComment', () => {
    it('updates content and reloads comments on success', async () => {
      const { update, eq } = mockUpdate({ error: null });

      await handleEditComment('c1', 'edited body');

      expect(ui.showLoading).toHaveBeenCalled();
      expect(window.supabaseClient.from).toHaveBeenCalledWith('comments');
      expect(update).toHaveBeenCalledWith({ content: 'edited body' });
      expect(eq).toHaveBeenCalledWith('id', 'c1');
      expect(invalidateMyCommentsCache).toHaveBeenCalled();
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
      expect(global.alert).not.toHaveBeenCalled();
    });

    it('alerts and still reloads comments when update fails', async () => {
      mockUpdate({ error: new Error('permission denied') });

      await handleEditComment('c1', 'edited body');

      expect(global.alert).toHaveBeenCalled();
      expect(invalidateMyCommentsCache).not.toHaveBeenCalled();
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });
  });
});
