import { handleReportComment } from './api.js';
import { loadComments } from './comments.js';
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

function mockInsert(result = { error: null }) {
  const insert = jest.fn().mockResolvedValue(result);
  window.supabaseClient = {
    from: jest.fn(() => ({ insert })),
  };
  return insert;
}

describe('popup/api.js handleReportComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    state.normalizedCurrentUrl = 'https://example.com/page';
    state.currentUser = { id: 'user-1' };
    global.alert = jest.fn();
    global.confirm = jest.fn().mockReturnValue(true);
    window.supabaseClient = undefined;
  });

  it('does not insert when the user cancels the confirm dialog', async () => {
    global.confirm.mockReturnValue(false);
    const insert = mockInsert();

    await handleReportComment('c1');

    expect(window.supabaseClient.from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(loadComments).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('inserts reporter and comment ids then reloads comments on success', async () => {
    const insert = mockInsert({ error: null });

    await handleReportComment('c1');

    expect(ui.showLoading).toHaveBeenCalled();
    expect(window.supabaseClient.from).toHaveBeenCalledWith('reported_comments');
    expect(insert).toHaveBeenCalledWith([
      { comment_id: 'c1', reporter_id: 'user-1' },
    ]);
    expect(global.alert).toHaveBeenCalledWith('msgReportSuccess');
    expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
  });

  it('alerts the duplicate-report message on unique violation without throwing', async () => {
    mockInsert({ error: { code: '23505', message: 'duplicate key' } });

    await handleReportComment('c1');

    expect(global.alert).toHaveBeenCalledWith('msgReportDuplicate');
    expect(global.alert).not.toHaveBeenCalledWith('msgReportError');
    expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
  });

  it('alerts a generic error and still reloads comments when insert fails', async () => {
    mockInsert({ error: { code: '42501', message: 'permission denied' } });

    await handleReportComment('c1');

    expect(global.alert).toHaveBeenCalledWith('msgReportError');
    expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
  });
});
