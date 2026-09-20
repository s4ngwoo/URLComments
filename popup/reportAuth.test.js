import { handleReportComment } from './api.js';
import { loadComments } from './comments.js';
import { showLoading } from './ui.js';
import { state } from './state.js';

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

describe('popup/api.js handleReportComment auth guard', () => {
  let insert;

  beforeEach(() => {
    jest.clearAllMocks();
    state.currentUser = null;
    state.normalizedCurrentUrl = 'https://example.com/thread';
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
    insert = jest.fn();
    window.supabaseClient = {
      from: jest.fn(() => ({ insert })),
    };
  });

  test('unauthenticated report does not insert a reporter row', async () => {
    await handleReportComment('comment-1');

    expect(global.confirm).toHaveBeenCalled();
    expect(showLoading).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('msgReportError');
    expect(loadComments).toHaveBeenCalledWith('https://example.com/thread');
  });

  test('cancelled confirm never touches supabase', async () => {
    global.confirm.mockReturnValue(false);

    await handleReportComment('comment-1');

    expect(window.supabaseClient.from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(showLoading).not.toHaveBeenCalled();
    expect(loadComments).not.toHaveBeenCalled();
  });
});
