import { handleDeleteComment } from './api.js';
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

describe('handleDeleteComment confirm gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    global.alert = jest.fn();
    global.confirm = jest.fn();
    window.supabaseClient = {
      rpc: jest.fn(),
      from: jest.fn(),
    };
  });

  test('does not call RPC or UPDATE when the user cancels confirm', async () => {
    global.confirm.mockReturnValue(false);
    state.currentUser = { id: 'user-1' };
    state.normalizedCurrentUrl = 'https://example.com/page';

    await handleDeleteComment('c1');

    expect(window.supabaseClient.rpc).not.toHaveBeenCalled();
    expect(window.supabaseClient.from).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });
});
