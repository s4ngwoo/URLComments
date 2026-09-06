/**
 * URLComments 팝업 메인 스크립트 - Supabase Auth & Database 연동 및 i18n 적용
 */

import { state, setSpaDetected, setNormalizedUrl } from './state.js';
import { elements, initElements, showState, setupI18n, disableForm, hideError, showProfileModal, hideProfileModal, showProfileError } from './ui.js';
import { checkAuthSession, handleGoogleLogin, handleLogout, updateAuthUI } from './auth.js';
import { 
  loadComments, 
  handleCommentSubmit, 
  handleDeleteComment, 
  handleReportComment, 
  handleReplySubmit,
  autoResizeTextarea,
  resetTextareaSize
} from './comments.js';
import { handleVoteClick } from './votes.js';
import { initTabUrl } from './spa.js';
import { updateDisplayName, normalizeDisplayName, getCodePointLength } from './profile.js';
import { initSettings } from './settings.js';
import { initMyComments, loadMyCommentsIfNeeded } from './my_comments.js';

document.addEventListener('DOMContentLoaded', async () => {
  initElements();

  // 1. 앱 초기화
  async function init() {
    setupI18n();
    initSettings();
    initMyComments();
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
        setSpaDetected(false);
        elements.pageToolbar.classList.add('hidden');
        elements.spaNotice.classList.add('hidden');
      } else if (message.type === 'SPA_DETECTED') {
        setSpaDetected(true);
      }
    });
  }

  // 2. 이벤트 리스너 등록
  function setupEventListeners() {
    elements.btnLogin.addEventListener('click', handleGoogleLogin);
    elements.btnLogout.addEventListener('click', handleLogout);
    elements.btnCloseError.addEventListener('click', hideError);

    // 탭 전환 이벤트
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.add('hidden'));

        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        const content = document.getElementById(`tab-${tabId}`);
        if (content) {
          content.classList.remove('hidden');
          content.classList.add('active'); // active for styling if needed
        }

        if (tabId === 'my-comments') {
          loadMyCommentsIfNeeded();
        }
      });
    });

    // User Menu Popover toggle
    elements.btnUserMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = elements.btnUserMenu.getAttribute('aria-expanded') === 'true';
      elements.btnUserMenu.setAttribute('aria-expanded', !isExpanded);
      elements.userMenuPopover.classList.toggle('hidden');
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.userProfile.contains(e.target)) {
        elements.btnUserMenu.setAttribute('aria-expanded', 'false');
        elements.userMenuPopover.classList.add('hidden');
      }
    });

    // Close popover on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        elements.btnUserMenu.setAttribute('aria-expanded', 'false');
        elements.userMenuPopover.classList.add('hidden');
        if (!elements.modalEditProfile.classList.contains('hidden')) {
          hideProfileModal();
        }
      }
    });

    // Profile Edit Modal
    elements.btnEditProfile.addEventListener('click', () => {
      elements.btnUserMenu.setAttribute('aria-expanded', 'false');
      elements.userMenuPopover.classList.add('hidden');
      if (state.currentProfile) {
        elements.inputDisplayName.value = state.currentProfile.display_name;
        // The length calculation logic uses Array.from as code points
        const length = Array.from(state.currentProfile.display_name).length;
        elements.displayNameCount.textContent = `${length} / 30`;
      }
      showProfileModal();
    });

    elements.btnCancelProfile.addEventListener('click', hideProfileModal);

    elements.inputDisplayName.addEventListener('input', (e) => {
      const length = Array.from(normalizeDisplayName(e.target.value)).length;
      elements.displayNameCount.textContent = `${length} / 30`;
    });

    elements.formEditProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = elements.inputDisplayName.value;
      elements.btnSaveProfile.disabled = true;
      try {
        await updateDisplayName(newName);
        hideProfileModal();
        updateAuthUI(state.currentUser);
        // Refresh comments to show new display name
        if (state.normalizedCurrentUrl) {
          loadComments(state.normalizedCurrentUrl);
        }
      } catch (err) {
        console.error('Failed to update profile:', err);
        showProfileError(chrome.i18n.getMessage('profileSetupFailed') || '표시 이름을 변경할 수 없습니다.');
      } finally {
        elements.btnSaveProfile.disabled = false;
      }
    });

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
      const length = Array.from(e.target.value).length;
      elements.charCount.textContent = `${length} / 1000`;
      autoResizeTextarea(e.target);
    });

    elements.commentList.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') {
        autoResizeTextarea(e.target);
        if (e.target.id.startsWith('comment-edit-input-')) {
          const commentId = e.target.id.replace('comment-edit-input-', '');
          const countEl = document.getElementById(`comment-edit-count-${commentId}`);
          if (countEl) {
            countEl.textContent = `${Array.from(e.target.value).length} / 1000`;
          }
        } else if (e.target.id.startsWith('reply-input-')) {
          const parentId = e.target.id.replace('reply-input-', '');
          const countEl = document.getElementById(`reply-char-count-${parentId}`);
          if (countEl) {
            countEl.textContent = `${Array.from(e.target.value).length} / 1000`;
          }
        }
      }
    });

    elements.commentForm.addEventListener('submit', handleCommentSubmit);

    // 댓글/대댓글 툴팁 이벤트 위임 (호버 및 키보드 포커스)
    elements.commentList.addEventListener('mouseover', (e) => {
      const authorBtn = e.target.closest('.comment-author');
      if (authorBtn && authorBtn.parentElement) {
        const tooltip = authorBtn.parentElement.querySelector('.author-tooltip');
        if (tooltip) tooltip.hidden = false;
      }
    });

    elements.commentList.addEventListener('mouseout', (e) => {
      const authorBtn = e.target.closest('.comment-author');
      if (authorBtn && authorBtn.parentElement) {
        const tooltip = authorBtn.parentElement.querySelector('.author-tooltip');
        if (tooltip) tooltip.hidden = true;
      }
    });

    elements.commentList.addEventListener('focusin', (e) => {
      const authorBtn = e.target.closest('.comment-author');
      if (authorBtn && authorBtn.parentElement) {
        const tooltip = authorBtn.parentElement.querySelector('.author-tooltip');
        if (tooltip) tooltip.hidden = false;
      }
    });

    elements.commentList.addEventListener('focusout', (e) => {
      const authorBtn = e.target.closest('.comment-author');
      if (authorBtn && authorBtn.parentElement) {
        const tooltip = authorBtn.parentElement.querySelector('.author-tooltip');
        if (tooltip) tooltip.hidden = true;
      }
    });

    // 폼 제출 이벤트 위임 (대댓글 인라인 폼)
    elements.commentList.addEventListener('submit', async (e) => {
      const replyForm = e.target.closest('.reply-form');
      if (replyForm) {
        e.preventDefault();
        const parentId = replyForm.getAttribute('data-parent-id');
        if (parentId) {
          await handleReplySubmit(parentId);
        }
      }
    });

    // 댓글 액션(답글/수정/삭제/신고/투표) 이벤트 위임
    elements.commentList.addEventListener('click', async (e) => {
      const actionBtn = e.target.closest('.btn-action');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const commentId = actionBtn.getAttribute('data-id');
        
        if (action === 'reply') {
          const formContainer = document.getElementById(`reply-form-container-${commentId}`);
          if (formContainer) {
            const isCurrentlyOpen = !formContainer.classList.contains('hidden');
            // 단일 활성 답글 작성창 원칙: 다른 모든 열린 답글창 닫기
            document.querySelectorAll('.reply-form-container').forEach(el => el.classList.add('hidden'));
            if (!isCurrentlyOpen) {
              formContainer.classList.remove('hidden');
              const inputEl = document.getElementById(`reply-input-${commentId}`);
              if (inputEl) {
                inputEl.focus();
                autoResizeTextarea(inputEl);
              }
            }
          }
        } else if (action === 'delete') {
          await handleDeleteComment(commentId);
        } else if (action === 'report') {
          await handleReportComment(commentId);
        } else if (action === 'edit') {
          const bodyEl = document.getElementById(`comment-body-${commentId}`);
          const formEl = document.getElementById(`comment-edit-form-${commentId}`);
          if (bodyEl && formEl) {
            bodyEl.classList.add('hidden');
            formEl.classList.remove('hidden');
            const inputEl = document.getElementById(`comment-edit-input-${commentId}`);
            if (inputEl) {
              inputEl.focus();
              inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
              autoResizeTextarea(inputEl);
            }
          }
        }
        return;
      }

      // 대댓글 취소 버튼
      const cancelReplyBtn = e.target.closest('.btn-action-cancel-reply');
      if (cancelReplyBtn) {
        const parentId = cancelReplyBtn.getAttribute('data-parent-id');
        const formContainer = document.getElementById(`reply-form-container-${parentId}`);
        if (formContainer) {
          formContainer.classList.add('hidden');
        }
        return;
      }

      const cancelBtn = e.target.closest('.btn-action-cancel');
      if (cancelBtn) {
        const commentId = cancelBtn.getAttribute('data-id');
        const bodyEl = document.getElementById(`comment-body-${commentId}`);
        const formEl = document.getElementById(`comment-edit-form-${commentId}`);
        if (bodyEl && formEl) {
          formEl.classList.add('hidden');
          bodyEl.classList.remove('hidden');
        }
        return;
      }
      
      const saveBtn = e.target.closest('.btn-action-save');
      if (saveBtn) {
        const commentId = saveBtn.getAttribute('data-id');
        const inputEl = document.getElementById(`comment-edit-input-${commentId}`);
        if (inputEl) {
          const newContent = inputEl.value.trim();
          if (!newContent) {
            alert(chrome.i18n.getMessage("msgEmptyComment") || '댓글 내용을 입력해주세요.');
            return;
          }
          if (newContent.length > 1000) {
            alert(chrome.i18n.getMessage("msgCommentTooLong") || '댓글은 1000자를 넘을 수 없습니다.');
            return;
          }
          saveBtn.disabled = true;
          const { handleEditComment } = await import('./comments.js');
          await handleEditComment(commentId, newContent);
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

