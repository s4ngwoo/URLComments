import { handleLogout } from './auth.js';
import { elements, initElements, showState } from './ui.js';
import { loadComments } from './comments.js';
import { resetState, setNormalizedUrl } from './state.js';

jest.mock('./ui.js', () => {
  const actual = jest.requireActual('./ui.js');
  return {
    ...actual,
    showLoading: jest.fn(),
    showError: jest.fn(),
    hideError: jest.fn(),
    showState: jest.fn(),
    enableForm: jest.fn(),
    disableForm: jest.fn(),
  };
});

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
  initTabUrl: jest.fn(),
}));

jest.mock('./i18n.js', () => ({
  getMessage: jest.fn((key) => key),
}));

function mountAuthShell({ commentCount = 0 } = {}) {
  const comments = Array.from({ length: commentCount }, (_, i) => `<li>${i}</li>`).join('');
  document.body.innerHTML = `
    <button id="btn-login"></button>
    <div id="user-profile"></div>
    <span id="profile-display-name"></span>
    <span id="profile-public-id"></span>
    <button id="btn-user-menu" aria-expanded="true"></button>
    <div id="user-menu-popover"></div>
    <ul id="comment-list">${comments}</ul>
  `;
  initElements();
}

describe('handleLogout edge paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    chrome.storage.local.remove.mockClear();
  });

  afterEach(() => {
    window.supabaseClient = undefined;
  });

  it('does nothing when supabase is missing', async () => {
    window.supabaseClient = undefined;
    await handleLogout();
    expect(showState).not.toHaveBeenCalled();
    expect(loadComments).not.toHaveBeenCalled();
  });

  it('asks for a refresh when logout succeeds without a current URL', async () => {
    mountAuthShell();
    window.supabaseClient = {
      auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
    };

    await handleLogout();

    expect(window.supabaseClient.auth.signOut).toHaveBeenCalled();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(['userCache']);
    expect(loadComments).not.toHaveBeenCalled();
    expect(showState).toHaveBeenCalledWith('needs-refresh');
    expect(elements.btnLogin.classList.contains('hidden')).toBe(false);
    expect(elements.userProfile.classList.contains('hidden')).toBe(true);
  });

  it('reloads comments when logout succeeds with a current URL', async () => {
    mountAuthShell();
    setNormalizedUrl('https://example.com/page');
    window.supabaseClient = {
      auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
    };

    await handleLogout();

    expect(loadComments).toHaveBeenCalledWith('https://example.com/page');
    expect(showState).not.toHaveBeenCalledWith('needs-refresh');
  });

  it('restores needs-refresh when logout fails without a URL', async () => {
    mountAuthShell();
    window.supabaseClient = {
      auth: { signOut: jest.fn().mockRejectedValue(new Error('network')) },
    };

    await handleLogout();

    expect(loadComments).not.toHaveBeenCalled();
    expect(showState).toHaveBeenCalledWith('needs-refresh');
  });

  it('restores list state when logout fails and comments are already rendered', async () => {
    mountAuthShell({ commentCount: 2 });
    setNormalizedUrl('https://example.com/page');
    window.supabaseClient = {
      auth: { signOut: jest.fn().mockRejectedValue(new Error('network')) },
    };

    await handleLogout();

    expect(loadComments).not.toHaveBeenCalled();
    expect(showState).toHaveBeenCalledWith('list');
  });

  it('restores empty state when logout fails with a URL but no comments', async () => {
    mountAuthShell({ commentCount: 0 });
    setNormalizedUrl('https://example.com/page');
    window.supabaseClient = {
      auth: { signOut: jest.fn().mockRejectedValue(new Error('network')) },
    };

    await handleLogout();

    expect(showState).toHaveBeenCalledWith('empty');
  });
});
