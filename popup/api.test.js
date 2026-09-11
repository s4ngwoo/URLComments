import { state, resetState } from './state.js';
import * as ui from './ui.js';
import { loadComments } from './comments.js';
import { invalidateMyCommentsCache } from './my_comments.js';
import {
  handleCommentSubmit,
  handleDeleteComment,
  handleReportComment,
} from './api.js';

jest.mock('./ui.js', () => ({
  elements: {},
  showLoading: jest.fn(),
  showError: jest.fn(),
  hideError: jest.fn(),
  showState: jest.fn(),
  setSubmitButtonLoading: jest.fn(),
}));

jest.mock('./comments.js', () => ({
  loadComments: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

jest.mock('./render.js', () => ({
  resetTextareaSize: jest.fn(),
}));

function mockCommentsTable({ insertResult, updateResult } = {}) {
  const eq = jest.fn().mockResolvedValue(updateResult || { error: null });
  const update = jest.fn().mockReturnValue({ eq });
  const insert = jest.fn().mockResolvedValue(insertResult || { error: null });
  const from = jest.fn().mockImplementation((table) => {
    if (table === 'comments') {
      return { insert, update };
    }
    if (table === 'reported_comments') {
      return { insert };
    }
    return { insert, update };
  });
  return { from, insert, update, eq };
}

describe('popup/api.js comment mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    ui.elements.commentInput = { value: 'hello world' };
    ui.elements.charCount = { textContent: '' };
    window.supabaseClient = null;
  });

  describe('handleCommentSubmit', () => {
    it('rejects unauthenticated users before writing', async () => {
      await handleCommentSubmit({ preventDefault: jest.fn() });
      expect(ui.showError).toHaveBeenCalledWith('msgLoginRequiredToWrite');
      expect(window.supabaseClient).toBeNull();
    });

    it('rejects empty content', async () => {
      state.currentUser = { id: 'user-1' };
      state.normalizedCurrentUrl = 'https://example.com/page';
      ui.elements.commentInput.value = '   ';

      await handleCommentSubmit({ preventDefault: jest.fn() });

      expect(ui.showError).toHaveBeenCalledWith('msgEmptyComment');
    });

    it('rejects comments longer than 1000 characters', async () => {
      state.currentUser = { id: 'user-1' };
      state.normalizedCurrentUrl = 'https://example.com/page';
      ui.elements.commentInput.value = 'a'.repeat(1001);

      await handleCommentSubmit({ preventDefault: jest.fn() });

      expect(ui.showError).toHaveBeenCalledWith('msgCommentTooLong');
    });

    it('inserts a comment and reloads the thread on success', async () => {
      state.currentUser = {
        id: 'user-1',
        email: 'a@example.com',
        user_metadata: {},
      };
      state.currentProfile = { display_name: 'Ada' };
      state.normalizedCurrentUrl = 'https://example.com/page';

      const table = mockCommentsTable();
      window.supabaseClient = table;

      await handleCommentSubmit({ preventDefault: jest.fn() });

      expect(table.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          url: 'https://example.com/page',
          author_id: 'user-1',
          author_name: 'Ada',
          content: 'hello world',
        }),
      ]);
      expect(invalidateMyCommentsCache).toHaveBeenCalled();
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
      expect(ui.setSubmitButtonLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('handleDeleteComment', () => {
    it('does nothing when the user cancels confirmation', async () => {
      global.confirm.mockReturnValue(false);
      window.supabaseClient = { rpc: jest.fn() };

      await handleDeleteComment('c1');

      expect(window.supabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('uses the zero-trust soft_delete_comment RPC when available', async () => {
      state.normalizedCurrentUrl = 'https://example.com/page';
      const table = mockCommentsTable();
      window.supabaseClient = {
        ...table,
        rpc: jest.fn().mockResolvedValue({ error: null }),
      };

      await handleDeleteComment('99');

      expect(window.supabaseClient.rpc).toHaveBeenCalledWith('soft_delete_comment', {
        p_comment_id: '99',
      });
      expect(table.update).not.toHaveBeenCalled();
      expect(invalidateMyCommentsCache).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('msgDeleteSuccess');
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });

    it('falls back to a direct update when the RPC is missing', async () => {
      state.normalizedCurrentUrl = 'https://example.com/page';
      const table = mockCommentsTable();
      window.supabaseClient = {
        ...table,
        rpc: jest.fn().mockResolvedValue({
          error: { code: 'PGRST202', message: 'Could not find the function' },
        }),
      };

      await handleDeleteComment('99');

      expect(table.from).toHaveBeenCalledWith('comments');
      expect(table.update).toHaveBeenCalledWith({ is_deleted: true });
      expect(table.eq).toHaveBeenCalledWith('id', '99');
      expect(global.alert).toHaveBeenCalledWith('msgDeleteSuccess');
    });

    it('does not fall back for unrelated RPC failures', async () => {
      state.normalizedCurrentUrl = 'https://example.com/page';
      const table = mockCommentsTable();
      window.supabaseClient = {
        ...table,
        rpc: jest.fn().mockResolvedValue({
          error: { code: '42501', message: 'permission denied' },
        }),
      };

      await handleDeleteComment('99');

      expect(table.update).not.toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('msgDeleteError'));
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });
  });

  describe('handleReportComment', () => {
    it('treats unique-violation as a duplicate report instead of a hard error', async () => {
      state.currentUser = { id: 'user-2' };
      state.normalizedCurrentUrl = 'https://example.com/page';
      const table = mockCommentsTable({
        insertResult: { error: { code: '23505', message: 'duplicate' } },
      });
      window.supabaseClient = table;

      await handleReportComment('c1');

      expect(global.alert).toHaveBeenCalledWith('msgReportDuplicate');
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });
  });
});
