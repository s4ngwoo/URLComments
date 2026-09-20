import { checkAuthSession } from './auth.js';
import { disableForm, enableForm } from './ui.js';
import { ensureProfile } from './profile.js';
import { state } from './state.js';

jest.mock('./ui.js', () => ({
  elements: {
    btnLogin: { classList: { add: jest.fn(), remove: jest.fn() } },
    userProfile: { classList: { add: jest.fn(), remove: jest.fn() } },
    profileDisplayName: { textContent: '' },
    profilePublicId: { textContent: '' },
    btnUserMenu: { setAttribute: jest.fn() },
    userMenuPopover: { classList: { add: jest.fn(), remove: jest.fn() } },
  },
  showLoading: jest.fn(),
  showError: jest.fn(),
  hideError: jest.fn(),
  showState: jest.fn(),
  enableForm: jest.fn(),
  disableForm: jest.fn(),
}));

jest.mock('./comments.js', () => ({
  loadComments: jest.fn(),
}));

jest.mock('./profile.js', () => ({
  ensureProfile: jest.fn(),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

jest.mock('./spa.js', () => ({
  initTabUrl: jest.fn(),
}));

describe('popup/auth.js checkAuthSession recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state.currentUser = { id: 'stale' };
    state.normalizedCurrentUrl = null;
    delete window.supabaseClient;
  });

  test('missing supabase client logs the user out', async () => {
    await checkAuthSession();

    expect(state.currentUser).toBeNull();
    expect(disableForm).toHaveBeenCalledWith('authNoticeDefault');
    expect(enableForm).not.toHaveBeenCalled();
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  test('getSession rejection logs the user out', async () => {
    window.supabaseClient = {
      auth: {
        getSession: jest.fn().mockRejectedValue(new Error('network down')),
      },
    };

    await checkAuthSession();

    expect(state.currentUser).toBeNull();
    expect(disableForm).toHaveBeenCalledWith('authNoticeDefault');
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  test('getSession error with a null session still logs the user out', async () => {
    window.supabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'session missing' },
        }),
      },
    };

    await checkAuthSession();

    expect(state.currentUser).toBeNull();
    expect(disableForm).toHaveBeenCalledWith('authNoticeDefault');
    expect(ensureProfile).not.toHaveBeenCalled();
  });
});
