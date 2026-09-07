import { getMessage } from './i18n.js';

import { state, setCurrentUser } from './state.js';
import { elements, showLoading, showError, hideError, showState, enableForm, disableForm } from './ui.js';
import { loadComments } from './comments.js';
import { ensureProfile } from './profile.js';
import { invalidateMyCommentsCache } from './my_comments.js';

export async function checkAuthSession() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    updateAuthUI(null);
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session check error:', error);
    }
    const user = session?.user || null;
    updateAuthUI(user);
  } catch (err) {
    console.error('Session status fetch failed:', err);
    updateAuthUI(null);
  }
}

export async function updateAuthUI(user) {
  setCurrentUser(user);
  invalidateMyCommentsCache();

  if (user) {
    const profile = await ensureProfile(user);
    
    elements.btnLogin.classList.add('hidden');
    elements.userProfile.classList.remove('hidden');
    
    if (profile) {
      const displayNameLabel = getMessage("displayName") || "Display Name";
      const publicIdLabel = getMessage("publicId") || "User ID";
      elements.profileDisplayName.textContent = `${displayNameLabel}: ${profile.display_name}`;
      elements.profilePublicId.textContent = `${publicIdLabel}: ${profile.public_id}`;
      // 지원되는 URL인 경우 폼 활성화
      if (state.normalizedCurrentUrl) {
        enableForm();
      }
    } else {
      elements.profileDisplayName.textContent = getMessage('profileSetupFailed') || "프로필 설정 실패";
      elements.profilePublicId.textContent = "";
      disableForm(getMessage('profileSetupFailed'));
    }
  } else {
    elements.btnLogin.classList.remove('hidden');
    elements.userProfile.classList.add('hidden');
    elements.profileDisplayName.textContent = '';
    elements.profilePublicId.textContent = '';
    elements.btnUserMenu.setAttribute('aria-expanded', 'false');
    elements.userMenuPopover.classList.add('hidden');
    
    disableForm(getMessage("authNoticeDefault"));
  }
}

export async function handleGoogleLogin() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    showError(getMessage("msgCheckSupabaseConfig"));
    return;
  }

  try {
    hideError();
    showLoading(getMessage("msgLoginInProgress"));

    const redirectUrl = chrome.identity.getRedirectURL();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true
      }
    });

    if (error || !data?.url) {
      throw new Error(error?.message || 'Google OAuth URL generation failed');
    }

    chrome.runtime.sendMessage(
      { type: 'LAUNCH_WEB_AUTH_FLOW', url: data.url, interactive: true },
      async (response) => {
        if (chrome.runtime.lastError || response?.error) {
          console.error('WebAuthFlow Error:', chrome.runtime.lastError?.message || response?.error);
          showError(getMessage("msgLoginFailedClosed"));
          showState(state.normalizedCurrentUrl ? (elements.commentList.children.length ? 'list' : 'empty') : 'unsupported');
          return;
        }

        const authUrl = response?.authUrl;
        if (authUrl) {
          const urlObj = new URL(authUrl);
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionErr) {
              showError(getMessage("msgSessionSaveFailed") + sessionErr.message);
            } else {
              await updateAuthUI(sessionData.session?.user);
              if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ userCache: sessionData.session?.user });
              }
            }
          } else {
            showError(getMessage("msgNoAuthToken"));
          }
        }

        if (state.normalizedCurrentUrl) {
          loadComments(state.normalizedCurrentUrl);
        }
      }
    );
  } catch (err) {
    console.error('Google login error:', err);
    showError(getMessage("msgLoginError") + err.message);
    showState(state.normalizedCurrentUrl ? 'empty' : 'unsupported');
  }
}

export async function handleLogout() {
  const supabase = window.supabaseClient;
  if (!supabase) return;
  try {
    showLoading(getMessage("msgLogoutInProgress"));
    await supabase.auth.signOut();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['userCache']);
    }
    await updateAuthUI(null);
    if (state.normalizedCurrentUrl) {
      loadComments(state.normalizedCurrentUrl);
    }
  } catch (err) {
    showError(getMessage("msgLogoutError"));
  }
}
