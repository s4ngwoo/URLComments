/**
 * popup/comments.js
 * 댓글 목록 로드, 렌더링, 작성, 수정, 삭제, 신고 및 1-Depth 대댓글 관리 모듈
 */

import { state } from './state.js';
import { elements, showLoading, showError, hideError, showState, setSubmitButtonLoading } from './ui.js';
import { invalidateMyCommentsCache } from './my_comments.js';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Textarea 자동 높이 조절 (Auto-grow) 유틸리티
 */
export function autoResizeTextarea(textarea, minHeight = 48, maxHeight = 140) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
  textarea.style.height = `${newHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

export function resetTextareaSize(textarea, minHeight = 48) {
  if (!textarea) return;
  textarea.style.height = `${minHeight}px`;
  textarea.style.overflowY = 'hidden';
}

export function canEditComment(comment, user) {
  if (!user) return false;
  if (comment.is_deleted) return false;
  return user.id === comment.author_id;
}

export function canDeleteComment(comment, user) {
  return canEditComment(comment, user);
}

export function canReportComment(comment, user) {
  if (!user) return false;
  if (comment.is_deleted) return false;
  return user.id !== comment.author_id;
}

export function canVoteComment(comment) {
  return !comment.is_deleted;
}

export function trimCommentContent(content) {
  return (content || '').trim();
}

export function isValidCommentContent(content) {
  const trimmed = trimCommentContent(content);
  return trimmed.length > 0 && trimmed.length <= 1000;
}

export async function handleEditComment(id, newContent) {
  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('comments')
      .update({ content: newContent })
      .eq('id', id);

    if (error) throw error;

    invalidateMyCommentsCache();
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Edit error:', err);
    alert(chrome.i18n.getMessage('msgEditError') || '댓글 수정 중 오류가 발생했습니다.');
    await loadComments(state.normalizedCurrentUrl);
  }
}

/**
 * 개별 대댓글 렌더링 HTML 생성
 */
function renderReplyItem(reply, userVotes, profiles, userReports) {
  if (reply.is_deleted) return '';

  const createdDate = new Date(reply.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const profile = profiles[reply.author_id];
  const displayName = profile?.display_name || reply.author_name || chrome.i18n.getMessage("anonymous");
  const publicId = profile?.public_id || '';

  const hasReported = state.currentUser && userReports[reply.id];
  let actionsHtml = '';
  if (state.currentUser) {
    if (canEditComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="edit" data-id="${reply.id}" title="${escapeHtml(chrome.i18n.getMessage('btnEdit') || '수정')}">✏️</button>`;
    }
    if (canDeleteComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="delete" data-id="${reply.id}" title="${escapeHtml(chrome.i18n.getMessage('btnDelete') || '삭제')}">🗑️</button>`;
    }
    if (canReportComment(reply, state.currentUser) && !hasReported) {
      actionsHtml += `<button class="btn-action" data-action="report" data-id="${reply.id}" title="${escapeHtml(chrome.i18n.getMessage('btnReport') || '신고')}">🚨</button>`;
    }
  }

  const myVote = userVotes[reply.id];
  const likeActive = myVote === 'like' ? 'active' : '';
  const dislikeActive = myVote === 'dislike' ? 'active' : '';

  let editLabel = '';
  if (reply.updated_at && reply.updated_at !== reply.created_at) {
    editLabel = `<span class="comment-edited" style="font-size:10px; color:var(--text-muted);">(${chrome.i18n.getMessage('labelEdited') || '수정됨'})</span>`;
  }

  let bodyContent = escapeHtml(reply.content);
  if (hasReported) {
    bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(chrome.i18n.getMessage('labelReported') || '신고 접수된 댓글입니다.')}</span>`;
  }

  const tooltipHtml = publicId
    ? `<div class="author-tooltip" id="tooltip-${reply.id}" role="tooltip" hidden>${escapeHtml(chrome.i18n.getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
    : '';

  return `
    <div class="reply-item" data-id="${reply.id}">
      <div class="comment-header">
        <div class="author-container" style="position: relative; display: flex; align-items: center;">
          <button class="comment-author" type="button" ${publicId ? `aria-describedby="tooltip-${reply.id}"` : ''}>${escapeHtml(displayName)}</button>
          ${tooltipHtml}
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${editLabel}
          <span class="comment-date">${createdDate}</span>
          <div class="comment-actions">${actionsHtml}</div>
        </div>
      </div>
      <div class="comment-body" id="comment-body-${reply.id}">${bodyContent}</div>
      <div class="comment-edit-form hidden" id="comment-edit-form-${reply.id}">
        <div class="textarea-wrapper">
          <textarea id="comment-edit-input-${reply.id}" maxlength="1000">${escapeHtml(reply.content)}</textarea>
          <div class="form-bottom" style="margin-top: 4px;">
            <span class="char-count" id="comment-edit-count-${reply.id}">${Array.from(reply.content).length} / 1000</span>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${reply.id}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
              <button class="btn btn-sm btn-primary btn-action-save" data-id="${reply.id}">${chrome.i18n.getMessage('btnSave') || '저장'}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="vote-area">
        <div class="vote-item">
          <button class="btn-vote btn-like ${likeActive}" data-vote-type="like" data-id="${reply.id}" ${canVoteComment(reply) ? '' : 'disabled'}>👍</button>
          <span class="vote-count like-count">${reply.like_count || 0}</span>
        </div>
        <div class="vote-item">
          <button class="btn-vote btn-dislike ${dislikeActive}" data-vote-type="dislike" data-id="${reply.id}" ${canVoteComment(reply) ? '' : 'disabled'}>👎</button>
          <span class="vote-count dislike-count">${reply.dislike_count || 0}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 댓글 목록 렌더링 (최상위 댓글 및 1단계 대댓글 계층 구조)
 */
export function renderCommentList(comments, userVotes = {}, profiles = {}, userReports = {}) {
  elements.commentList.innerHTML = '';

  // 1. 최상위 댓글과 대댓글 분리
  const parents = [];
  const repliesMap = {};

  comments.forEach(c => {
    if (c.parent_id) {
      if (!repliesMap[c.parent_id]) {
        repliesMap[c.parent_id] = [];
      }
      repliesMap[c.parent_id].push(c);
    } else {
      parents.push(c);
    }
  });

  // 2. 대댓글은 생성순(created_at ASC)으로 정렬
  Object.keys(repliesMap).forEach(parentId => {
    repliesMap[parentId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  });

  // 3. 최상위 댓글 정렬 (UI에서 선택된 옵션 기준)
  const sortType = elements.sortSelect ? elements.sortSelect.value : 'latest';
  if (sortType === 'likes') {
    parents.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
  } else if (sortType === 'dislikes') {
    parents.sort((a, b) => (b.dislike_count || 0) - (a.dislike_count || 0));
  } else {
    // latest (기본값)
    parents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // 4. 노출 대상 부모 댓글 필터링: 활성 댓글이거나, 삭제되었더라도 활성 대댓글이 있는 경우만 유지
  const visibleParents = parents.filter(p => {
    if (!p.is_deleted) return true;
    const activeChildren = (repliesMap[p.id] || []).filter(r => !r.is_deleted);
    return activeChildren.length > 0;
  });

  if (visibleParents.length === 0) {
    showState('empty');
    return;
  }

  // 5. DOM 렌더링
  visibleParents.forEach(item => {
    const li = document.createElement('li');
    li.className = 'comment-item';
    li.setAttribute('data-id', item.id);

    const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const profile = profiles[item.author_id];
    const displayName = profile?.display_name || item.author_name || chrome.i18n.getMessage("anonymous");
    const publicId = profile?.public_id || '';

    const hasReported = state.currentUser && userReports[item.id];
    let actionsHtml = '';

    // 답글 버튼은 정상(삭제되지 않은) 최상위 댓글에만 노출
    if (!item.is_deleted) {
      actionsHtml += `<button class="btn-action" data-action="reply" data-id="${item.id}" title="${escapeHtml(chrome.i18n.getMessage('btnReply') || '답글')}">💬</button>`;
    }

    if (state.currentUser && !item.is_deleted) {
      if (canEditComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="edit" data-id="${item.id}" title="${escapeHtml(chrome.i18n.getMessage('btnEdit') || '수정')}">✏️</button>`;
      }
      if (canDeleteComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="delete" data-id="${item.id}" title="${escapeHtml(chrome.i18n.getMessage('btnDelete') || '삭제')}">🗑️</button>`;
      }
      if (canReportComment(item, state.currentUser) && !hasReported) {
        actionsHtml += `<button class="btn-action" data-action="report" data-id="${item.id}" title="${escapeHtml(chrome.i18n.getMessage('btnReport') || '신고')}">🚨</button>`;
      }
    }

    const myVote = userVotes[item.id];
    const likeActive = myVote === 'like' ? 'active' : '';
    const dislikeActive = myVote === 'dislike' ? 'active' : '';

    let editLabel = '';
    if (item.updated_at && item.updated_at !== item.created_at) {
      editLabel = `<span class="comment-edited" style="font-size:10px; color:var(--text-muted);">(${chrome.i18n.getMessage('labelEdited') || '수정됨'})</span>`;
    }

    let bodyContent = escapeHtml(item.content);
    if (item.is_deleted) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">${escapeHtml(chrome.i18n.getMessage('deletedComment') || '삭제된 댓글입니다.')}</span>`;
    } else if (hasReported) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(chrome.i18n.getMessage('labelReported') || '신고 접수된 댓글입니다.')}</span>`;
    }

    const tooltipHtml = publicId && !item.is_deleted
      ? `<div class="author-tooltip" id="tooltip-${item.id}" role="tooltip" hidden>${escapeHtml(chrome.i18n.getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
      : '';

    const authorDisplay = item.is_deleted ? chrome.i18n.getMessage("anonymous") : displayName;

    // 하위 대댓글 HTML 생성
    const repliesList = repliesMap[item.id] || [];
    const repliesHtml = repliesList
      .map(r => renderReplyItem(r, userVotes, profiles, userReports))
      .join('');

    li.innerHTML = `
      <div class="comment-main">
        <div class="comment-header">
          <div class="author-container" style="position: relative; display: flex; align-items: center;">
            <button class="comment-author" type="button" ${publicId && !item.is_deleted ? `aria-describedby="tooltip-${item.id}"` : ''}>${escapeHtml(authorDisplay)}</button>
            ${tooltipHtml}
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${editLabel}
            <span class="comment-date">${createdDate}</span>
            <div class="comment-actions">${actionsHtml}</div>
          </div>
        </div>
        <div class="comment-body" id="comment-body-${item.id}">${bodyContent}</div>
        <div class="comment-edit-form hidden" id="comment-edit-form-${item.id}">
          <div class="textarea-wrapper">
            <textarea id="comment-edit-input-${item.id}" maxlength="1000">${escapeHtml(item.content)}</textarea>
            <div class="form-bottom" style="margin-top: 4px;">
              <span class="char-count" id="comment-edit-count-${item.id}">${Array.from(item.content).length} / 1000</span>
              <div style="display:flex; gap:4px;">
                <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${item.id}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
                <button class="btn btn-sm btn-primary btn-action-save" data-id="${item.id}">${chrome.i18n.getMessage('btnSave') || '저장'}</button>
              </div>
            </div>
          </div>
        </div>
        <div class="vote-area">
          <div class="vote-item">
            <button class="btn-vote btn-like ${likeActive}" data-vote-type="like" data-id="${item.id}" ${canVoteComment(item) ? '' : 'disabled'}>👍</button>
            <span class="vote-count like-count">${item.like_count || 0}</span>
          </div>
          <div class="vote-item">
            <button class="btn-vote btn-dislike ${dislikeActive}" data-vote-type="dislike" data-id="${item.id}" ${canVoteComment(item) ? '' : 'disabled'}>👎</button>
            <span class="vote-count dislike-count">${item.dislike_count || 0}</span>
          </div>
        </div>
      </div>

      <!-- 1-Depth 대댓글 작성 인라인 폼 -->
      <div class="reply-form-container hidden" id="reply-form-container-${item.id}">
        <form class="comment-form reply-form" data-parent-id="${item.id}">
          <div class="textarea-wrapper">
            <textarea class="reply-input" id="reply-input-${item.id}" maxlength="1000" placeholder="${escapeHtml(chrome.i18n.getMessage('replyPlaceholder') || '답글을 입력하세요 (최대 1000자)')}"></textarea>
            <div class="form-bottom" style="margin-top: 4px;">
              <span class="char-count" id="reply-char-count-${item.id}">0 / 1000</span>
              <div style="display:flex; gap:4px;">
                <button type="button" class="btn btn-sm btn-outline btn-action-cancel-reply" data-parent-id="${item.id}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
                <button type="submit" class="btn btn-sm btn-primary btn-action-submit-reply" data-parent-id="${item.id}">${chrome.i18n.getMessage('btnSubmitReply') || '답글 등록'}</button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- 대댓글 목록 컨테이너 -->
      <div class="replies-container ${repliesHtml ? '' : 'hidden'}" id="replies-${item.id}">
        ${repliesHtml}
      </div>
    `;

    elements.commentList.appendChild(li);
  });
}

/**
 * 현재 페이지의 댓글과 대댓글 조회 (N+1 방지 1회 통합 쿼리)
 */
export async function loadComments(url) {
  showLoading(chrome.i18n.getMessage("stateLoading"));
  hideError();

  const supabase = window.supabaseClient;
  if (!supabase) {
    showState('empty');
    return;
  }

  try {
    // 1. 해당 URL의 모든 댓글(최상위 및 대댓글)을 1회의 쿼리로 일괄 조회
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('url', url);

    if (error) throw error;

    if (!data || data.length === 0) {
      showState('empty');
      return;
    }

    let profiles = {};
    const authorIds = [...new Set(data.map(c => c.author_id))];

    if (authorIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, public_id')
        .in('id', authorIds);

      if (!profileError && profileData) {
        profileData.forEach(p => {
          profiles[p.id] = p;
        });
      }
    }

    let userVotes = {};
    let userReports = {};
    if (state.currentUser && data.length > 0) {
      const commentIds = data.map(c => c.id);

      const { data: votesData, error: votesError } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .in('comment_id', commentIds)
        .eq('user_id', state.currentUser.id);

      if (!votesError && votesData) {
        votesData.forEach(v => {
          userVotes[v.comment_id] = v.vote_type;
        });
      }

      const { data: reportsData, error: reportsError } = await supabase
        .from('reported_comments')
        .select('comment_id')
        .in('comment_id', commentIds)
        .eq('reporter_id', state.currentUser.id);

      if (!reportsError && reportsData) {
        reportsData.forEach(r => {
          userReports[r.comment_id] = true;
        });
      }
    }

    renderCommentList(data, userVotes, profiles, userReports);
    showState('list');

  } catch (err) {
    console.error('Comments fetch exception:', err);
    const errDetail = err.message || JSON.stringify(err);
    showError(chrome.i18n.getMessage("msgLoadCommentsError") + " " + errDetail);
    showState('empty');
  }
}

/**
 * 최상위 댓글 작성
 */
export async function handleCommentSubmit(e) {
  e.preventDefault();

  if (!state.currentUser) {
    showError(chrome.i18n.getMessage("msgLoginRequiredToWrite"));
    return;
  }

  if (!state.normalizedCurrentUrl) {
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

  try {
    hideError();
    setSubmitButtonLoading(true);

    const supabase = window.supabaseClient;

    const authorName = state.currentProfile?.display_name ||
      state.currentUser.user_metadata?.full_name ||
      state.currentUser.user_metadata?.name ||
      state.currentUser.email?.split('@')[0] ||
      chrome.i18n.getMessage("anonymous");

    const { error } = await supabase
      .from('comments')
      .insert([{
        url: state.normalizedCurrentUrl,
        author_id: state.currentUser.id,
        author_name: authorName,
        content: content
      }]);

    if (error) throw error;

    invalidateMyCommentsCache();
    elements.commentInput.value = '';
    elements.charCount.textContent = '0 / 1000';
    resetTextareaSize(elements.commentInput);
    await loadComments(state.normalizedCurrentUrl);

  } catch (err) {
    console.error('Comment post exception:', err);
    showError(chrome.i18n.getMessage("msgSubmitError") || "댓글 작성에 실패했습니다.");
  } finally {
    setSubmitButtonLoading(false);
  }
}

/**
 * 1-Depth 대댓글 등록
 */
export async function handleReplySubmit(parentId) {
  if (!state.currentUser) {
    alert(chrome.i18n.getMessage("msgLoginRequiredToWrite") || "로그인 후 댓글을 작성할 수 있습니다.");
    return;
  }

  const inputEl = document.getElementById(`reply-input-${parentId}`);
  const submitBtn = document.querySelector(`.btn-action-submit-reply[data-parent-id="${parentId}"]`);
  if (!inputEl) return;

  const content = inputEl.value.trim();
  if (!content) {
    alert(chrome.i18n.getMessage("msgEmptyComment") || "댓글 내용을 입력해주세요.");
    return;
  }

  if (content.length > 1000) {
    alert(chrome.i18n.getMessage("msgCommentTooLong") || "댓글은 1000자를 초과할 수 없습니다.");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '...';
    }

    const supabase = window.supabaseClient;
    const authorName = state.currentProfile?.display_name ||
      state.currentUser.user_metadata?.full_name ||
      state.currentUser.user_metadata?.name ||
      state.currentUser.email?.split('@')[0] ||
      chrome.i18n.getMessage("anonymous");

    const { error } = await supabase
      .from('comments')
      .insert([{
        url: state.normalizedCurrentUrl,
        author_id: state.currentUser.id,
        author_name: authorName,
        content: content,
        parent_id: parentId
      }]);

    if (error) throw error;

    invalidateMyCommentsCache();
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Reply submit error:', err);
    alert((chrome.i18n.getMessage('msgReplySubmitError') || "답글 등록에 실패했습니다.") + "\n" + (err.message || ''));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

/**
 * 댓글 또는 대댓글 소프트 삭제
 */
export async function handleDeleteComment(id) {
  if (!confirm(chrome.i18n.getMessage('msgConfirmDelete'))) return;

  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;

    invalidateMyCommentsCache();
    alert(chrome.i18n.getMessage('msgDeleteSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Delete error:', err);
    const details = err.message || JSON.stringify(err);
    alert((chrome.i18n.getMessage('msgDeleteError') || "삭제에 실패했습니다.") + "\n" + details);
    await loadComments(state.normalizedCurrentUrl);
  }
}

/**
 * 댓글 또는 대댓글 신고
 */
export async function handleReportComment(id) {
  if (!confirm(chrome.i18n.getMessage('msgConfirmReport'))) return;

  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('reported_comments')
      .insert([{ comment_id: id, reporter_id: state.currentUser.id }]);

    if (error) {
      if (error.code === '23505') {
        alert(chrome.i18n.getMessage('msgReportDuplicate') || '이미 신고한 댓글입니다.');
        await loadComments(state.normalizedCurrentUrl);
        return;
      }
      throw error;
    }

    alert(chrome.i18n.getMessage('msgReportSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Report error:', err);
    alert(chrome.i18n.getMessage('msgReportError') || "신고 처리에 실패했습니다.");
    await loadComments(state.normalizedCurrentUrl);
  }
}
