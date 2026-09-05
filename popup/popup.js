/**
 * URLComments 팝업 메인 스크립트 - Supabase Auth & Database 연동 및 i18n 적용
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM 엘리먼트 참조
  const elements = {
    // Auth Header
    authStatus: document.getElementById('auth-status'),
    btnLogin: document.getElementById('btn-login'),
    userProfile: document.getElementById('user-profile'),
    userEmail: document.getElementById('user-email'),
    btnLogout: document.getElementById('btn-logout'),

    // Error Banner
    errorBanner: document.getElementById('error-banner'),
    errorMessage: document.getElementById('error-message'),
    btnCloseError: document.getElementById('btn-close-error'),

    // URL Bar
    urlBar: document.getElementById('url-bar'),
    currentUrlText: document.getElementById('current-url'),

    // State Views
    stateLoading: document.getElementById('state-loading'),
    loadingText: document.getElementById('loading-text'),
    stateUnsupported: document.getElementById('state-unsupported'),
    stateEmpty: document.getElementById('state-empty'),
    stateList: document.getElementById('state-list'),
    commentList: document.getElementById('comment-list'),

    // Form
    commentForm: document.getElementById('comment-form'),
    commentInput: document.getElementById('comment-input'),
    charCount: document.getElementById('char-count'),
    btnSubmit: document.getElementById('btn-submit'),
    formAuthNotice: document.getElementById('form-auth-notice')
  };

  let normalizedCurrentUrl = null;
  let currentUser = null;

  // Supabase 클라이언트 참조
  const supabase = window.supabaseClient;

  // 1. 앱 초기화
  async function init() {
    setupI18n();
    setupEventListeners();
    await checkAuthSession();
    await initTabUrl();
  }

  // 1-1. 다국어(i18n) 설정
  function setupI18n() {
    document.querySelectorAll('[data-i18n]').forEach(elem => {
      const msg = chrome.i18n.getMessage(elem.getAttribute('data-i18n'));
      if (msg) elem.textContent = msg;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
      const msg = chrome.i18n.getMessage(elem.getAttribute('data-i18n-placeholder'));
      if (msg) elem.placeholder = msg;
    });
  }

  // 2. 이벤트 리스너 등록
  function setupEventListeners() {
    elements.btnLogin.addEventListener('click', handleGoogleLogin);
    elements.btnLogout.addEventListener('click', handleLogout);
    elements.btnCloseError.addEventListener('click', hideError);

    elements.commentInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      elements.charCount.textContent = `${length} / 1000`;
    });

    elements.commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // 3. 인증 세션 확인 및 UI 동기화
  async function checkAuthSession() {
    if (!supabase) {
      updateAuthUI(null);
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
      }
      currentUser = session?.user || null;
      updateAuthUI(currentUser);
    } catch (err) {
      console.error('Session status fetch failed:', err);
      updateAuthUI(null);
    }
  }

  // 4. 인증 UI 상태 업데이트
  function updateAuthUI(user) {
    currentUser = user;

    if (user) {
      elements.btnLogin.classList.add('hidden');
      elements.userProfile.classList.remove('hidden');
      elements.userEmail.textContent = user.email || chrome.i18n.getMessage("defaultUser");
      elements.userEmail.title = user.email || '';

      // 지원되는 URL인 경우 폼 활성화
      if (normalizedCurrentUrl) {
        enableForm();
      }
    } else {
      elements.btnLogin.classList.remove('hidden');
      elements.userProfile.classList.add('hidden');
      elements.userEmail.textContent = '';
      
      disableForm(chrome.i18n.getMessage("authNoticeDefault"));
    }
  }

  // 5. Google 로그인 (chrome.identity.launchWebAuthFlow)
  async function handleGoogleLogin() {
    if (!supabase) {
      showError(chrome.i18n.getMessage("msgCheckSupabaseConfig"));
      return;
    }

    try {
      hideError();
      showLoading(chrome.i18n.getMessage("msgLoginInProgress"));

      const redirectUrl = chrome.identity.getRedirectURL();

      // Supabase OAuth 로그인 URL 생성 (OAuth 리다이렉트 스킵)
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

      // Chrome WebAuthFlow 실행
      chrome.identity.launchWebAuthFlow(
        {
          url: data.url,
          interactive: true
        },
        async (authUrl) => {
          if (chrome.runtime.lastError) {
            console.error('WebAuthFlow Error:', chrome.runtime.lastError);
            showError(chrome.i18n.getMessage("msgLoginFailedClosed"));
            showState(normalizedCurrentUrl ? 'empty' : 'unsupported');
            return;
          }

          if (authUrl) {
            // URL Hash에서 access_token, refresh_token 파싱
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
                showError(chrome.i18n.getMessage("msgSessionSaveFailed") + sessionErr.message);
              } else {
                updateAuthUI(sessionData.session?.user);
                // 세션 유저 정보 local storage에 캐싱
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ userCache: sessionData.session?.user });
                }
              }
            } else {
              showError(chrome.i18n.getMessage("msgNoAuthToken"));
            }
          }

          // 목록 재조회 및 UI 복구
          if (normalizedCurrentUrl) {
            loadComments(normalizedCurrentUrl);
          }
        }
      );
    } catch (err) {
      console.error('Google login error:', err);
      showError(chrome.i18n.getMessage("msgLoginError") + err.message);
      showState(normalizedCurrentUrl ? 'empty' : 'unsupported');
    }
  }

  // 6. 로그아웃
  async function handleLogout() {
    if (!supabase) return;
    try {
      showLoading(chrome.i18n.getMessage("msgLogoutInProgress"));
      await supabase.auth.signOut();
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['userCache']);
      }
      updateAuthUI(null);
      if (normalizedCurrentUrl) {
        loadComments(normalizedCurrentUrl);
      }
    } catch (err) {
      showError(chrome.i18n.getMessage("msgLogoutError"));
    }
  }

  // 7. 현재 탭 정보 가져오기 및 URL 정규화
  async function initTabUrl() {
    try {
      showLoading(chrome.i18n.getMessage("stateLoading"));

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          processUrl(tab.url);
        } else {
          showState('unsupported');
          disableForm(chrome.i18n.getMessage("msgUnsupportedCannotComment"));
        }
      } else {
        processUrl(window.location.href);
      }
    } catch (error) {
      console.error('Tab URL fetch error:', error);
      showState('unsupported');
    }
  }

  // 8. URL 처리 및 댓글 조회 트리거
  function processUrl(rawUrl) {
    const helper = window.urlHelper || {
      isSupportedUrl: (u) => u && (u.startsWith('http://') || u.startsWith('https://')),
      normalizeUrl: (u) => u
    };

    if (!helper.isSupportedUrl(rawUrl)) {
      elements.urlBar.classList.add('hidden');
      showState('unsupported');
      disableForm(chrome.i18n.getMessage("msgUnsupportedCannotComment"));
      return;
    }

    normalizedCurrentUrl = helper.normalizeUrl(rawUrl);

    elements.urlBar.classList.remove('hidden');
    elements.currentUrlText.textContent = normalizedCurrentUrl;
    elements.currentUrlText.title = normalizedCurrentUrl;

    if (currentUser) {
      enableForm();
    } else {
      disableForm(chrome.i18n.getMessage("authNoticeDefault"));
    }

    loadComments(normalizedCurrentUrl);
  }

  // 9. Supabase에서 댓글 목록 조회
  async function loadComments(url) {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    hideError();

    if (!supabase) {
      // Supabase 키 미설정 시 더미 안내 또는 비어있음 표시
      showState('empty');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('url', url)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Comments fetch error:', error);
        showError(chrome.i18n.getMessage("msgLoadCommentsFailed") + error.message + ')');
        showState('empty');
        return;
      }

      if (!data || data.length === 0) {
        showState('empty');
      } else {
        renderCommentList(data);
        showState('list');
      }
    } catch (err) {
      console.error('Comments fetch exception:', err);
      showError(chrome.i18n.getMessage("msgLoadCommentsError"));
      showState('empty');
    }
  }

  // 10. 댓글 작성 제출 핸들러
  async function handleCommentSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
      showError(chrome.i18n.getMessage("msgLoginRequiredToWrite"));
      return;
    }

    if (!normalizedCurrentUrl) {
      showError(chrome.i18n.getMessage("msgCannotGetUrl"));
      return;
    }

    const content = elements.commentInput.value.trim();

    if (!content) {
      showError(chrome.i18n.getMessage("msgEmptyComment"));
      return;
    }

    if (content.length > 1000) {
      showError(chrome.i18n.getMessage("msgCommentTooLong"));
      return;
    }

    if (!supabase) {
      showError(chrome.i18n.getMessage("msgCheckSupabaseConfig"));
      return;
    }

    try {
      hideError();
      setSubmitButtonLoading(true);

      const authorName = currentUser.user_metadata?.full_name || 
                         currentUser.user_metadata?.name || 
                         currentUser.email?.split('@')[0] || 
                         chrome.i18n.getMessage("anonymous");

      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            url: normalizedCurrentUrl,
            author_id: currentUser.id,
            author_name: authorName,
            content: content
          }
        ]);

      if (error) {
        console.error('Comment post error:', error);
        showError(chrome.i18n.getMessage("msgSubmitFailed") + error.message);
      } else {
        // 성공 시 폼 리셋 및 댓글 목록 새로고침
        elements.commentInput.value = '';
        elements.charCount.textContent = '0 / 1000';
        await loadComments(normalizedCurrentUrl);
      }
    } catch (err) {
      console.error('Comment post exception:', err);
      showError(chrome.i18n.getMessage("msgSubmitError"));
    } finally {
      setSubmitButtonLoading(false);
    }
  }

  // 11. 댓글 목록 렌더링
  function renderCommentList(comments) {
    elements.commentList.innerHTML = '';
    comments.forEach(item => {
      const li = document.createElement('li');
      li.className = 'comment-item';
      
      // i18n 날짜 포맷 (현재 브라우저 언어 기반으로 자동 적용되도록 undefined 사용)
      const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      li.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(item.author_name)}</span>
          <span class="comment-date">${createdDate}</span>
        </div>
        <div class="comment-body">${escapeHtml(item.content)}</div>
      `;
      elements.commentList.appendChild(li);
    });
  }

  // 12. 뷰 상태 조절 헬퍼
  function showState(targetState) {
    elements.stateLoading.classList.add('hidden');
    elements.stateUnsupported.classList.add('hidden');
    elements.stateEmpty.classList.add('hidden');
    elements.stateList.classList.add('hidden');

    switch (targetState) {
      case 'loading':
        elements.stateLoading.classList.remove('hidden');
        break;
      case 'unsupported':
        elements.stateUnsupported.classList.remove('hidden');
        break;
      case 'empty':
        elements.stateEmpty.classList.remove('hidden');
        break;
      case 'list':
        elements.stateList.classList.remove('hidden');
        break;
    }
  }

  function showLoading(msg) {
    if (msg) elements.loadingText.textContent = msg;
    showState('loading');
  }

  function showError(msg) {
    elements.errorMessage.textContent = msg;
    elements.errorBanner.classList.remove('hidden');
  }

  function hideError() {
    elements.errorBanner.classList.add('hidden');
    elements.errorMessage.textContent = '';
  }

  function enableForm() {
    elements.commentInput.disabled = false;
    elements.btnSubmit.disabled = false;
    elements.formAuthNotice.textContent = '';
  }

  function disableForm(noticeText) {
    elements.commentInput.disabled = true;
    elements.btnSubmit.disabled = true;
    if (noticeText) {
      elements.formAuthNotice.textContent = noticeText;
    }
  }

  function setSubmitButtonLoading(isLoading) {
    elements.btnSubmit.disabled = isLoading;
    elements.btnSubmit.textContent = isLoading ? chrome.i18n.getMessage("btnSubmitting") : chrome.i18n.getMessage("btnSubmit");
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 앱 시작
  init();
});
