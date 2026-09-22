import { state, resetState } from './state.js';
import * as ui from './ui.js';
import { loadComments } from './comments.js';
import { invalidateMyCommentsCache } from './my_comments.js';
import { handleCommentSubmit, handleReplySubmit } from './api.js';

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

function mockCommentsInsert(insertResult) {
  const insert = jest.fn().mockResolvedValue(insertResult);
  const from = jest.fn().mockReturnValue({ insert });
  return { from, insert };
}

describe('popup/api.js author_name fallback and submit failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    global.alert = jest.fn();
    ui.elements.commentInput = { value: 'hello world' };
    ui.elements.charCount = { textContent: '' };
    window.supabaseClient = null;
    state.normalizedCurrentUrl = 'https://example.com/page';
  });

  async function submit() {
    await handleCommentSubmit({ preventDefault: jest.fn() });
  }

  it('falls back to OAuth full_name when profile display_name is missing', async () => {
    state.currentUser = {
      id: 'user-1',
      email: 'ada@example.com',
      user_metadata: { full_name: 'Ada Lovelace', name: 'Ignored' },
    };
    state.currentProfile = null;
    const table = mockCommentsInsert({ error: null });
    window.supabaseClient = table;

    await submit();

    expect(table.insert).toHaveBeenCalledWith([
      expect.objectContaining({ author_id: 'user-1', author_name: 'Ada Lovelace' }),
    ]);
  });

  it('falls back to email local-part when metadata names are missing', async () => {
    state.currentUser = {
      id: 'user-1',
      email: 'ada@example.com',
      user_metadata: {},
    };
    state.currentProfile = {};
    const table = mockCommentsInsert({ error: null });
    window.supabaseClient = table;

    await submit();

    expect(table.insert).toHaveBeenCalledWith([
      expect.objectContaining({ author_name: 'ada' }),
    ]);
  });

  it('falls back to anonymous i18n key when no identity fields exist', async () => {
    state.currentUser = {
      id: 'user-1',
      user_metadata: {},
    };
    state.currentProfile = null;
    const table = mockCommentsInsert({ error: null });
    window.supabaseClient = table;

    await submit();

    expect(table.insert).toHaveBeenCalledWith([
      expect.objectContaining({ author_name: 'anonymous' }),
    ]);
  });

  it('surfaces submit error and always clears loading without wiping the composer', async () => {
    state.currentUser = { id: 'user-1', user_metadata: { name: 'Ada' } };
    const table = mockCommentsInsert({ error: { message: 'rls denied' } });
    window.supabaseClient = table;

    await submit();

    expect(ui.showError).toHaveBeenCalledWith('msgSubmitError');
    expect(ui.elements.commentInput.value).toBe('hello world');
    expect(invalidateMyCommentsCache).not.toHaveBeenCalled();
    expect(loadComments).not.toHaveBeenCalled();
    expect(ui.setSubmitButtonLoading).toHaveBeenCalledWith(true);
    expect(ui.setSubmitButtonLoading).toHaveBeenLastCalledWith(false);
  });

  it('uses the same author fallback chain for replies', async () => {
    state.currentUser = {
      id: 'user-1',
      email: 'ada@example.com',
      user_metadata: {},
    };
    document.body.innerHTML = `
      <textarea id="reply-input-parent-1">thanks</textarea>
      <button class="btn-action-submit-reply" data-parent-id="parent-1">Send</button>
    `;
    const table = mockCommentsInsert({ error: null });
    window.supabaseClient = table;

    await handleReplySubmit('parent-1');

    expect(table.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        author_name: 'ada',
        parent_id: 'parent-1',
        content: 'thanks',
      }),
    ]);
  });
});
