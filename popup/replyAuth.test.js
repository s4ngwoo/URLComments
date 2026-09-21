import { handleReplySubmit } from './api.js';
import { state, resetState } from './state.js';

jest.mock('./ui.js', () => ({
  elements: {},
  showLoading: jest.fn(),
  showError: jest.fn(),
  hideError: jest.fn(),
  showState: jest.fn(),
  setSubmitButtonLoading: jest.fn(),
}));

jest.mock('./comments.js', () => ({
  loadComments: jest.fn(),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

jest.mock('./render.js', () => ({
  resetTextareaSize: jest.fn(),
}));

function mockInsert(result = { error: null }) {
  const insert = jest.fn().mockResolvedValue(result);
  window.supabaseClient = {
    from: jest.fn(() => ({ insert })),
  };
  return insert;
}

describe('handleReplySubmit auth and payload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    global.alert = jest.fn();
    document.body.innerHTML = '';
    window.supabaseClient = { from: jest.fn() };
  });

  test('does not insert when the user is logged out', async () => {
    const insert = mockInsert();
    document.body.innerHTML = `<textarea id="reply-input-p1">hello</textarea>`;
    state.currentUser = null;

    await handleReplySubmit('p1');

    expect(global.alert).toHaveBeenCalled();
    expect(window.supabaseClient.from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  test('does not insert when the reply input is missing', async () => {
    const insert = mockInsert();
    state.currentUser = { id: 'user-1', email: 'a@b.c' };
    state.normalizedCurrentUrl = 'https://example.com/page';

    await handleReplySubmit('missing-parent');

    expect(window.supabaseClient.from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });

  test('inserts parent_id and current URL for an authenticated reply', async () => {
    const insert = mockInsert();
    state.currentUser = { id: 'user-1', email: 'writer@example.com' };
    state.normalizedCurrentUrl = 'https://example.com/page';
    document.body.innerHTML = `
      <textarea id="reply-input-p1">nested reply</textarea>
      <button class="btn-action-submit-reply" data-parent-id="p1">Reply</button>
    `;

    await handleReplySubmit('p1');

    expect(window.supabaseClient.from).toHaveBeenCalledWith('comments');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        url: 'https://example.com/page',
        author_id: 'user-1',
        content: 'nested reply',
        parent_id: 'p1',
      }),
    ]);
  });
});
