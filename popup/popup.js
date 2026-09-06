/**
 * URLComments 팝업 메인 스크립트 - Supabase Auth & Database 연동 및 i18n 적용
 */

import { state, setSpaDomain, setNormalizedUrl } from './state.js';
import { elements, initElements, showState, setupI18n, disableForm, hideError } from './ui.js';
import { checkAuthSession, handleGoogleLogin, handleLogout } from './auth.js';
import { loadComments, handleCommentSubmit, handleDeleteComment, handleReportComment } from './comments.js';
import { handleVoteClick } from './votes.js';
import { initTabUrl } from './spa.js';

document.addEventListener('DOMContentLoaded', async () => {
  initElements();

  // 1. 앱 초기화
  async function init() {
    setupI18n();
    setupEventListeners();
    await checkAuthSession();
    
    // 시작 시 자동 조회를 하지 않고, 사이드 패널 정책에 따라 "새로고침 필요" 상태 노출
    showState('needs-refresh');
    elements.btnRefresh.classList.remove('hidden');
  }

  // 백그라운드 탭 변경 및 SPA 감지 알림 수신
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TAB_CHANGED') {
        showState('needs-refresh');
        disableForm(chrome.i18n.getMessage("msgNeedsRefresh") || "페이지가 변경되었습니다. 새로고침을 눌러주세요.");
        setNormalizedUrl(null);
        elements.urlBar.classList.add('hidden');
      } else if (message.type === 'SPA_DETECTED') {
        setSpaDomain(true);
      }
    });
  }

  // 2. 이벤트 리스너 등록
  function setupEventListeners() {
    elements.btnLogin.addEventListener('click', handleGoogleLogin);
    elements.btnLogout.addEventListener('click', handleLogout);
    elements.btnCloseError.addEventListener('click', hideError);

    // 수동 새로고침
    elements.btnRefresh.addEventListener('click', async () => {
      await initTabUrl();
    });

    // 정렬 변경
    elements.sortSelect.addEventListener('change', () => {
      if (state.normalizedCurrentUrl) {
        loadComments(state.normalizedCurrentUrl);
      }
    });

    elements.commentInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      elements.charCount.textContent = `${length} / 1000`;
    });

    elements.commentForm.addEventListener('submit', handleCommentSubmit);

    // 댓글 액션(삭제/신고/투표) 이벤트 위임
    elements.commentList.addEventListener('click', async (e) => {
      const actionBtn = e.target.closest('.btn-action');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const commentId = actionBtn.getAttribute('data-id');
        
        if (action === 'delete') {
          await handleDeleteComment(commentId);
        } else if (action === 'report') {
          await handleReportComment(commentId);
        }
        return;
      }

      const voteBtn = e.target.closest('.btn-vote');
      if (voteBtn) {
        const voteType = voteBtn.getAttribute('data-vote-type');
        const commentId = voteBtn.getAttribute('data-id');
        await handleVoteClick(commentId, voteType, voteBtn);
      }
    });
  }

  // 앱 시작
  init();
});

