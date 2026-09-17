import { handleCommentSubmit } from './api.js';
import { state, resetState } from './state.js';
import * as ui from './ui.js';

jest.mock('./ui.js', () => ({
  showError: jest.fn(),
  hideError: jest.fn(),
  showLoading: jest.fn(),
  showState: jest.fn(),
  setSubmitButtonLoading: jest.fn(),
  elements: {
    commentInput: { value: 'hello world' },
  },
}));

jest.mock('./comments.js', () => ({
  loadComments: jest.fn(),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

describe('handleCommentSubmit URL guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    window.supabaseClient = undefined;
  });

  it('rejects submit when authenticated but normalizedCurrentUrl is missing', async () => {
    state.currentUser = { id: 'user-1' };
    state.normalizedCurrentUrl = null;
    ui.elements.commentInput.value = 'hello world';

    await handleCommentSubmit({ preventDefault: jest.fn() });

    expect(ui.showError).toHaveBeenCalledWith('msgCannotGetUrl');
    expect(window.supabaseClient).toBeUndefined();
  });
});
