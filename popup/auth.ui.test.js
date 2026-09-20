import { state } from './state.js';
import { ensureProfile } from './profile.js';
import { enableForm, disableForm, elements } from './ui.js';
import { invalidateMyCommentsCache } from './my_comments.js';
import { updateAuthUI } from './auth.js';

jest.mock('./ui.js', () => {
  const elements = {
    btnLogin: {
      classList: { add: jest.fn(), remove: jest.fn() },
    },
    userProfile: {
      classList: { add: jest.fn(), remove: jest.fn() },
    },
    profileDisplayName: { textContent: '' },
    profilePublicId: { textContent: '' },
    btnUserMenu: { setAttribute: jest.fn() },
    userMenuPopover: {
      classList: { add: jest.fn(), remove: jest.fn() },
    },
  };
  return {
    elements,
    showLoading: jest.fn(),
    showError: jest.fn(),
    hideError: jest.fn(),
    showState: jest.fn(),
    enableForm: jest.fn(),
    disableForm: jest.fn(),
  };
});

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

describe('popup/auth.js updateAuthUI form gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state.currentUser = null;
    state.currentProfile = null;
    state.normalizedCurrentUrl = null;
    elements.profileDisplayName.textContent = '';
    elements.profilePublicId.textContent = '';
  });

  test('signed-in user with a profile and supported URL can write', async () => {
    state.normalizedCurrentUrl = 'https://example.com/page';
    ensureProfile.mockResolvedValue({
      display_name: 'Ada',
      public_id: 'ada-1',
    });

    await updateAuthUI({ id: 'user-1' });

    expect(invalidateMyCommentsCache).toHaveBeenCalled();
    expect(state.currentUser).toEqual({ id: 'user-1' });
    expect(elements.profileDisplayName.textContent).toContain('Ada');
    expect(elements.profilePublicId.textContent).toContain('ada-1');
    expect(enableForm).toHaveBeenCalled();
    expect(disableForm).not.toHaveBeenCalled();
  });

  test('signed-in user with a profile but no URL does not enable the composer', async () => {
    state.normalizedCurrentUrl = null;
    ensureProfile.mockResolvedValue({
      display_name: 'Ada',
      public_id: 'ada-1',
    });

    await updateAuthUI({ id: 'user-1' });

    expect(enableForm).not.toHaveBeenCalled();
    expect(disableForm).not.toHaveBeenCalled();
  });

  test('signed-in user whose profile setup fails is fail-closed', async () => {
    state.normalizedCurrentUrl = 'https://example.com/page';
    ensureProfile.mockResolvedValue(null);

    await updateAuthUI({ id: 'user-1' });

    expect(enableForm).not.toHaveBeenCalled();
    expect(disableForm).toHaveBeenCalledWith('profileSetupFailed');
    expect(elements.profileDisplayName.textContent).toBe('profileSetupFailed');
    expect(elements.profilePublicId.textContent).toBe('');
  });

  test('logged-out user disables the composer and clears profile chrome', async () => {
    elements.profileDisplayName.textContent = 'stale';
    elements.profilePublicId.textContent = 'stale-id';

    await updateAuthUI(null);

    expect(state.currentUser).toBeNull();
    expect(enableForm).not.toHaveBeenCalled();
    expect(disableForm).toHaveBeenCalledWith('authNoticeDefault');
    expect(elements.profileDisplayName.textContent).toBe('');
    expect(elements.profilePublicId.textContent).toBe('');
    expect(elements.btnUserMenu.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
  });
});
