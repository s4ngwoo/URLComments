import { state, resetState } from './state.js';
import * as ui from './ui.js';
import { loadComments } from './comments.js';
import { ensureProfile } from './profile.js';
import { initTabUrl } from './spa.js';
import { checkAuthSession, handleGoogleLogin, handleLogout } from './auth.js';

jest.mock('./ui.js', () => ({
  elements: {},
  showLoading: jest.fn(),
  showError: jest.fn(),
  hideError: jest.fn(),
  showState: jest.fn(),
  enableForm: jest.fn(),
  disableForm: jest.fn(),
}));

jest.mock('./comments.js', () => ({
  loadComments: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./profile.js', () => ({
  ensureProfile: jest.fn(),
}));

jest.mock('./my_comments.js', () => ({
  invalidateMyCommentsCache: jest.fn(),
}));

jest.mock('./spa.js', () => ({
  initTabUrl: jest.fn().mockResolvedValue(undefined),
}));

function setupAuthDom() {
  const classed = () => {
    const el = document.createElement('div');
    el.classList.add('hidden');
    return el;
  };

  Object.assign(ui.elements, {
    btnLogin: classed(),
    userProfile: classed(),
    profileDisplayName: document.createElement('span'),
    profilePublicId: document.createElement('span'),
    btnUserMenu: document.createElement('button'),
    userMenuPopover: classed(),
    commentList: document.createElement('ul'),
  });
}

describe('popup/auth.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    setupAuthDom();
    delete chrome.runtime.lastError;
    chrome.runtime.sendMessage.mockReset();
    chrome.storage.local.set.mockReset();
    chrome.storage.local.remove.mockReset();
    chrome.identity.getRedirectURL.mockReturnValue('https://mock.redirect.url/');
    window.supabaseClient = null;
  });

  describe('checkAuthSession', () => {
    it('shows the logged-out UI when supabase is missing', async () => {
      await checkAuthSession();
      expect(ui.elements.btnLogin.classList.contains('hidden')).toBe(false);
      expect(ui.disableForm).toHaveBeenCalled();
    });

    it('applies the signed-in session user', async () => {
      const user = { id: 'user-1' };
      ensureProfile.mockResolvedValue({
        display_name: 'Ada',
        public_id: 'public-1',
      });
      window.supabaseClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user } },
            error: null,
          }),
        },
      };

      await checkAuthSession();

      expect(state.currentUser).toEqual(user);
      expect(ui.elements.btnLogin.classList.contains('hidden')).toBe(true);
      expect(ui.elements.profileDisplayName.textContent).toContain('Ada');
    });
  });

  describe('handleGoogleLogin', () => {
    function mockOAuth(sendMessageImpl) {
      window.supabaseClient = {
        auth: {
          signInWithOAuth: jest.fn().mockResolvedValue({
            data: { url: 'https://accounts.google.com/o/oauth' },
            error: null,
          }),
          setSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'user-1' } } },
            error: null,
          }),
        },
      };
      chrome.runtime.sendMessage.mockImplementation(sendMessageImpl);
    }

    it('restores UI instead of spinning when the auth flow is cancelled', async () => {
      let authCallback;
      mockOAuth((_message, cb) => {
        authCallback = cb;
      });
      state.normalizedCurrentUrl = 'https://example.com/page';

      await handleGoogleLogin();

      expect(ui.showLoading).toHaveBeenCalledWith('msgLoginInProgress');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        {
          type: 'LAUNCH_WEB_AUTH_FLOW',
          url: 'https://accounts.google.com/o/oauth',
          interactive: true,
        },
        expect.any(Function)
      );

      chrome.runtime.lastError = { message: 'The user did not approve access.' };
      await authCallback({ error: 'The user did not approve access.' });

      expect(ui.showError).toHaveBeenCalledWith('msgLoginFailedClosed');
      expect(ui.showState).toHaveBeenCalledWith('empty');
      expect(window.supabaseClient.auth.setSession).not.toHaveBeenCalled();
    });

    it('stores the session when the background flow returns tokens', async () => {
      ensureProfile.mockResolvedValue({
        display_name: 'Ada',
        public_id: 'public-1',
      });
      let authCallback;
      mockOAuth((_message, cb) => {
        authCallback = cb;
      });
      state.normalizedCurrentUrl = 'https://example.com/page';

      await handleGoogleLogin();
      await authCallback({
        authUrl:
          'https://mock.redirect.url/#access_token=at&refresh_token=rt',
      });

      expect(window.supabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: 'at',
        refresh_token: 'rt',
      });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        userCache: { id: 'user-1' },
      });
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });

    it('shows a token error and still exits loading when tokens are missing', async () => {
      let authCallback;
      mockOAuth((_message, cb) => {
        authCallback = cb;
      });

      await handleGoogleLogin();
      await authCallback({ authUrl: 'https://mock.redirect.url/#error=access_denied' });

      expect(ui.showError).toHaveBeenCalledWith('msgNoAuthToken');
      expect(initTabUrl).toHaveBeenCalled();
    });

    it('restores UI when OAuth URL generation fails', async () => {
      window.supabaseClient = {
        auth: {
          signInWithOAuth: jest.fn().mockResolvedValue({
            data: { url: null },
            error: { message: 'oauth down' },
          }),
        },
      };

      await handleGoogleLogin();

      expect(ui.showError).toHaveBeenCalledWith(expect.stringContaining('msgLoginError'));
      expect(ui.showState).toHaveBeenCalledWith('needs-refresh');
    });
  });

  describe('handleLogout', () => {
    it('clears the cached user and reloads comments for the current URL', async () => {
      state.normalizedCurrentUrl = 'https://example.com/page';
      window.supabaseClient = {
        auth: {
          signOut: jest.fn().mockResolvedValue({ error: null }),
        },
      };

      await handleLogout();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['userCache']);
      expect(state.currentUser).toBeNull();
      expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    });
  });
});
