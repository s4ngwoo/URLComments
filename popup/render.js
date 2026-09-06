/**
 * popup/render.js
 * HTML string generation, DOM updates, and UI logic for comments.
 */

import { state } from './state.js';
import { elements } from './ui.js';
import { getMessage } from './i18n.js';

export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

export function isTopLevelComment(comment) {
  return !comment.parent_id;
}

export function isReplyComment(comment) {
  return Boolean(comment.parent_id);
}

export function renderReplyItem(reply, userVotes, profiles, userReports) {
  if (reply.is_deleted) return '';

  const replyIdStr = String(reply.id);
  const createdDate = new Date(reply.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const profile = profiles[reply.author_id];
  const displayName = profile?.display_name || reply.author_name || getMessage("anonymous");
  const publicId = profile?.public_id || '';

  const hasReported = state.currentUser && userReports[replyIdStr];
  let actionsHtml = '';
  if (state.currentUser) {
    if (canEditComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="edit" data-id="${replyIdStr}" title="${escapeHtml(getMessage('btnEdit') || '수정')}">✏️</button>`;
    }
    if (canDeleteComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="delete" data-id="${replyIdStr}" title="${escapeHtml(getMessage('btnDelete') || '삭제')}">🗑️</button>`;
    }
    if (canReportComment(reply, state.currentUser) && !hasReported) {
      actionsHtml += `<button class="btn-action" data-action="report" data-id="${replyIdStr}" title="${escapeHtml(getMessage('btnReport') || '신고')}">🚨</button>`;
    }
  }

  const myVote = userVotes[replyIdStr];
  const likeActive = myVote === 'like' ? 'active' : '';
  const dislikeActive = myVote === 'dislike' ? 'active' : '';

  let editLabel = '';
  if (reply.updated_at && reply.updated_at !== reply.created_at) {
    editLabel = `<span class="comment-edited">(${getMessage('labelEdited') || '수정됨'})</span>`;
  }

  let bodyContent = escapeHtml(reply.content);
  if (hasReported) {
    bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(getMessage('labelReported') || 'This comment was reported.')}</span>`;
  }

  const tooltipHtml = publicId
    ? `<div class="author-tooltip" id="tooltip-${replyIdStr}" role="tooltip" hidden>${escapeHtml(getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
    : '';

  const likeTitle = escapeHtml(getMessage('btnLike') || 'Like');
  const dislikeTitle = escapeHtml(getMessage('btnDislike') || 'Dislike');

  return `
    <div class="reply-item" data-id="${replyIdStr}">
      <div class="comment-header">
        <div class="comment-header-left">
          <div class="author-container" style="position: relative; display: flex; align-items: center;">
            <button class="comment-author" type="button" title="${escapeHtml(displayName)}" aria-label="${escapeHtml(displayName)}" ${publicId ? `aria-describedby="tooltip-${replyIdStr}"` : ''}>${escapeHtml(displayName)}</button>
            ${tooltipHtml}
          </div>
          <div class="vote-group">
            <button class="btn-vote btn-like ${likeActive}" type="button" data-vote-type="like" data-id="${replyIdStr}" ${canVoteComment(reply) ? '' : 'disabled'} title="${likeTitle}" aria-label="${likeTitle}">
              <span class="vote-icon">👍</span>
              <span class="vote-count like-count">${reply.like_count || 0}</span>
            </button>
            <button class="btn-vote btn-dislike ${dislikeActive}" type="button" data-vote-type="dislike" data-id="${replyIdStr}" ${canVoteComment(reply) ? '' : 'disabled'} title="${dislikeTitle}" aria-label="${dislikeTitle}">
              <span class="vote-icon">👎</span>
              <span class="vote-count dislike-count">${reply.dislike_count || 0}</span>
            </button>
          </div>
        </div>
        <div class="comment-header-right">
          ${editLabel}
          <span class="comment-date">${createdDate}</span>
          <div class="comment-actions">${actionsHtml}</div>
        </div>
      </div>
      <div class="comment-body" id="comment-body-${replyIdStr}">${bodyContent}</div>
      <div class="comment-edit-form hidden" id="comment-edit-form-${replyIdStr}">
        <div class="textarea-wrapper">
          <textarea id="comment-edit-input-${replyIdStr}" maxlength="1000">${escapeHtml(reply.content)}</textarea>
          <div class="form-bottom" style="margin-top: 4px;">
            <span class="char-count" id="comment-edit-count-${replyIdStr}">${Array.from(reply.content).length} / 1000</span>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${replyIdStr}">${getMessage('btnCancel') || '취소'}</button>
              <button class="btn btn-sm btn-primary btn-action-save" data-id="${replyIdStr}">${getMessage('btnSave') || '저장'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCommentPageSlice(pagedParents, repliesMap, userVotes, profiles, userReports) {
  elements.commentList.innerHTML = '';

  pagedParents.forEach(item => {
    const itemIdStr = String(item.id);
    const li = document.createElement('li');
    li.className = 'comment-item';
    li.setAttribute('data-id', itemIdStr);

    const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const profile = profiles[item.author_id];
    const displayName = profile?.display_name || item.author_name || getMessage("anonymous");
    const publicId = profile?.public_id || '';

    const hasReported = state.currentUser && userReports[itemIdStr];
    let actionsHtml = '';

    if (state.currentUser && !item.is_deleted) {
      if (canEditComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="edit" data-id="${itemIdStr}" title="${escapeHtml(getMessage('btnEdit') || '수정')}">✏️</button>`;
      }
      if (canDeleteComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="delete" data-id="${itemIdStr}" title="${escapeHtml(getMessage('btnDelete') || '삭제')}">🗑️</button>`;
      }
      if (canReportComment(item, state.currentUser) && !hasReported) {
        actionsHtml += `<button class="btn-action" data-action="report" data-id="${itemIdStr}" title="${escapeHtml(getMessage('btnReport') || '신고')}">🚨</button>`;
      }
    }

    const myVote = userVotes[itemIdStr];
    const likeActive = myVote === 'like' ? 'active' : '';
    const dislikeActive = myVote === 'dislike' ? 'active' : '';

    let editLabel = '';
    if (item.updated_at && item.updated_at !== item.created_at) {
      editLabel = `<span class="comment-edited">(${getMessage('labelEdited') || '수정됨'})</span>`;
    }

    let bodyContent = escapeHtml(item.content);
    if (item.is_deleted) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">${escapeHtml(getMessage('deletedComment') || '삭제된 댓글입니다.')}</span>`;
    } else if (hasReported) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(getMessage('labelReported') || 'This comment was reported.')}</span>`;
    }

    const tooltipHtml = publicId && !item.is_deleted
      ? `<div class="author-tooltip" id="tooltip-${itemIdStr}" role="tooltip" hidden>${escapeHtml(getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
      : '';

    const authorDisplay = item.is_deleted ? getMessage("anonymous") : displayName;
    const likeTitle = escapeHtml(getMessage('btnLike') || 'Like');
    const dislikeTitle = escapeHtml(getMessage('btnDislike') || 'Dislike');

    // 활성 최상위 댓글인 경우에만 답글 작성 버튼 노출 (소프트 삭제된 댓글은 새 답글 금지)
    const replyButtonHtml = !item.is_deleted ? `
      <button class="reply-button btn-action" type="button" data-action="reply" data-parent-id="${itemIdStr}" data-id="${itemIdStr}" title="${escapeHtml(getMessage('btnReply') || '답글')}" aria-label="${escapeHtml(getMessage('btnReply') || '답글')}">
        <span class="reply-icon" aria-hidden="true">↳</span>
        <span class="reply-label">${escapeHtml(getMessage('btnReply') || '답글')}</span>
      </button>
    ` : '';

    // 하위 대댓글 HTML 생성 (생성 순서대로 정렬됨)
    const repliesList = repliesMap[itemIdStr] || [];
    const repliesHtml = repliesList
      .map(r => renderReplyItem(r, userVotes, profiles, userReports))
      .join('');

    // 활성 댓글인 경우에만 답글 작성 폼 렌더링 (소프트 삭제된 댓글은 폼 컨테이너 미렌더링)
    const replyFormHtml = !item.is_deleted ? `
      <!-- 1-Depth 대댓글 작성 인라인 폼 (항상 기존 대댓글 목록 뒤에 위치) -->
      <div class="reply-form-container hidden" id="reply-form-container-${itemIdStr}">
        <form class="comment-form reply-form" data-parent-id="${itemIdStr}">
          <div class="textarea-wrapper">
            <textarea class="reply-input" id="reply-input-${itemIdStr}" maxlength="1000" placeholder="${escapeHtml(getMessage('replyPlaceholder') || '답글을 입력하세요 (최대 1000자)')}"></textarea>
            <div class="form-bottom" style="margin-top: 4px;">
              <span class="char-count" id="reply-char-count-${itemIdStr}">0 / 1000</span>
              <div style="display:flex; gap:4px;">
                <button type="button" class="btn btn-sm btn-outline btn-action-cancel-reply" data-parent-id="${itemIdStr}">${getMessage('btnCancel') || '취소'}</button>
                <button type="submit" class="btn btn-sm btn-primary btn-action-submit-reply" data-parent-id="${itemIdStr}">${getMessage('btnSubmitReply') || '답글 등록'}</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    ` : '';

    li.innerHTML = `
      <div class="comment-main">
        <div class="comment-header">
          <div class="comment-header-left">
            <div class="author-container" style="position: relative; display: flex; align-items: center;">
              <button class="comment-author" type="button" title="${escapeHtml(authorDisplay)}" aria-label="${escapeHtml(authorDisplay)}" ${publicId && !item.is_deleted ? `aria-describedby="tooltip-${itemIdStr}"` : ''}>${escapeHtml(authorDisplay)}</button>
              ${tooltipHtml}
            </div>
            ${!item.is_deleted ? `
            <div class="vote-group">
              <button class="btn-vote btn-like ${likeActive}" type="button" data-vote-type="like" data-id="${itemIdStr}" ${canVoteComment(item) ? '' : 'disabled'} title="${likeTitle}" aria-label="${likeTitle}">
                <span class="vote-icon">👍</span>
                <span class="vote-count like-count">${item.like_count || 0}</span>
              </button>
              <button class="btn-vote btn-dislike ${dislikeActive}" type="button" data-vote-type="dislike" data-id="${itemIdStr}" ${canVoteComment(item) ? '' : 'disabled'} title="${dislikeTitle}" aria-label="${dislikeTitle}">
                <span class="vote-icon">👎</span>
                <span class="vote-count dislike-count">${item.dislike_count || 0}</span>
              </button>
            </div>
            ` : ''}
          </div>
          <div class="comment-header-right">
            ${replyButtonHtml}
            ${editLabel}
            <span class="comment-date">${createdDate}</span>
            <div class="comment-actions">${actionsHtml}</div>
          </div>
        </div>
        <div class="comment-body" id="comment-body-${itemIdStr}">${bodyContent}</div>
        <div class="comment-edit-form hidden" id="comment-edit-form-${itemIdStr}">
          <div class="textarea-wrapper">
            <textarea id="comment-edit-input-${itemIdStr}" maxlength="1000">${escapeHtml(item.content)}</textarea>
            <div class="form-bottom" style="margin-top: 4px;">
              <span class="char-count" id="comment-edit-count-${itemIdStr}">${Array.from(item.content).length} / 1000</span>
              <div style="display:flex; gap:4px;">
                <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${itemIdStr}">${getMessage('btnCancel') || '취소'}</button>
                <button class="btn btn-sm btn-primary btn-action-save" data-id="${itemIdStr}">${getMessage('btnSave') || '저장'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 대댓글 목록 컨테이너 -->
      <div class="replies-container ${repliesHtml ? '' : 'hidden'}" id="replies-${itemIdStr}">
        ${repliesHtml}
      </div>

      ${replyFormHtml}
    `;

    elements.commentList.appendChild(li);
  });
}
