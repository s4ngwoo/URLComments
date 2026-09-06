/**
 * popup/comments.js
 * 댓글 목록 로드, 렌더링, 작성, 수정, 삭제, 신고 및 1-Depth 대댓글 관리 모듈
 */

import { state } from './state.js';
import { elements, showLoading, showError, hideError, showState, setSubmitButtonLoading, updatePaginationUI } from './ui.js';
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

// Current MVP supports one reply depth; future nested replies will require a new migration to replace/alter the one-depth trigger and a recursive/thread-tree renderer.
export function isTopLevelComment(comment) {
  return !comment.parent_id;
}

export function isReplyComment(comment) {
  return Boolean(comment.parent_id);
}

/**
 * Compares two positive numeric string IDs without Number()/parseInt() conversion.
 * Assumes non-negative integer IDs (Postgres bigint sequence values).
 * 1. Longer numeric string represents a larger number.
 * 2. If lengths are equal, lexicographical comparison matches numeric comparison.
 * @param {string|number} idA
 * @param {string|number} idB
 * @returns {number} -1, 0, or 1
 */
export function compareBigIntIdStrings(idA, idB) {
  const strA = String(idA == null ? '' : idA).trim();
  const strB = String(idB == null ? '' : idB).trim();
  if (strA === strB) return 0;
  if (!strA) return -1;
  if (!strB) return 1;
  if (strA.length !== strB.length) {
    return strA.length - strB.length;
  }
  return strA.localeCompare(strB);
}

/**
 * Chronologically compares two comments (created_at ASC).
 * Deterministically tie-breaks using bigint-safe numeric string comparison on id.
 * Like/dislike counts never affect order.
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function compareCommentsChronological(a, b) {
  const timeA = new Date(a.created_at).getTime();
  const timeB = new Date(b.created_at).getTime();
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  return compareBigIntIdStrings(a.id, b.id);
}

/**
 * Groups raw comments into top-level parent threads and their 1-depth replies.
 * - Parent IDs and reply parent_ids are handled as strings to avoid bigint precision loss.
 * - Sibling replies under each parent are sorted chronologically ascending (created_at ASC with stable tie-break).
 * - Parents are filtered: active parents (!is_deleted) or deleted parents that have active replies.
 * @param {Array} comments
 * @returns {{ visibleParents: Array, repliesMap: Object }}
 */
export function groupCommentThreads(comments) {
  if (!Array.isArray(comments)) {
    return { visibleParents: [], repliesMap: {} };
  }

  const parents = [];
  const repliesMap = {};

  comments.forEach(c => {
    const parentIdStr = c.parent_id != null ? String(c.parent_id) : null;
    if (parentIdStr) {
      if (!repliesMap[parentIdStr]) {
        repliesMap[parentIdStr] = [];
      }
      repliesMap[parentIdStr].push(c);
    } else {
      parents.push(c);
    }
  });

  // Sort replies under each parent chronologically ascending
  Object.keys(repliesMap).forEach(parentIdStr => {
    repliesMap[parentIdStr].sort(compareCommentsChronological);
  });

  // Filter visible parents: active parents or deleted parents with active replies
  const visibleParents = parents.filter(p => {
    const parentIdStr = String(p.id);
    if (!p.is_deleted) return true;
    const activeChildren = (repliesMap[parentIdStr] || []).filter(r => !r.is_deleted);
    return activeChildren.length > 0;
  });

  return { visibleParents, repliesMap };
}

export const THREADS_PER_PAGE = 10;

/**
 * Pure helper to paginate top-level threads.
 * Parent and all replies remain together on the same page.
 * @param {Array} threads
 * @param {number} currentPage
 * @param {number} pageSize
 * @returns {{ pagedThreads: Array, currentPage: number, totalPages: number, totalCount: number }}
 */
export function paginateThreads(threads, currentPage = 1, pageSize = THREADS_PER_PAGE) {
  if (!Array.isArray(threads)) {
    return {
      pagedThreads: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0
    };
  }
  const totalCount = threads.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const pagedThreads = threads.slice(startIndex, startIndex + pageSize);

  return {
    pagedThreads,
    currentPage: validPage,
    totalPages,
    totalCount
  };
}

// In-memory thread storage for pagination without network refetch
let currentCommentThreads = { visibleParents: [], repliesMap: {} };
let currentCommentVotes = {};
let currentProfiles = {};
let currentUserReports = {};
let currentCommentPage = 1;

export function getCurrentCommentPage() {
  return currentCommentPage;
}

export function setCurrentCommentPage(page) {
  currentCommentPage = page;
}

export function changeCommentPage(page) {
  const totalCount = currentCommentThreads.visibleParents ? currentCommentThreads.visibleParents.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / THREADS_PER_PAGE));
  currentCommentPage = Math.min(Math.max(1, page), totalPages);
  renderCurrentPage();
}

export function prevCommentPage() {
  changeCommentPage(currentCommentPage - 1);
}

export function nextCommentPage() {
  changeCommentPage(currentCommentPage + 1);
}

/**
 * 개별 대댓글 렌더링 HTML 생성 (헤더 반응 버튼 컴팩트 배치)
 */
function renderReplyItem(reply, userVotes, profiles, userReports) {
  if (reply.is_deleted) return '';

  const replyIdStr = String(reply.id);
  const createdDate = new Date(reply.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const profile = profiles[reply.author_id];
  const displayName = profile?.display_name || reply.author_name || chrome.i18n.getMessage("anonymous");
  const publicId = profile?.public_id || '';

  const hasReported = state.currentUser && userReports[replyIdStr];
  let actionsHtml = '';
  if (state.currentUser) {
    if (canEditComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="edit" data-id="${replyIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnEdit') || '수정')}">✏️</button>`;
    }
    if (canDeleteComment(reply, state.currentUser)) {
      actionsHtml += `<button class="btn-action" data-action="delete" data-id="${replyIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnDelete') || '삭제')}">🗑️</button>`;
    }
    if (canReportComment(reply, state.currentUser) && !hasReported) {
      actionsHtml += `<button class="btn-action" data-action="report" data-id="${replyIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnReport') || '신고')}">🚨</button>`;
    }
  }

  const myVote = userVotes[replyIdStr];
  const likeActive = myVote === 'like' ? 'active' : '';
  const dislikeActive = myVote === 'dislike' ? 'active' : '';

  let editLabel = '';
  if (reply.updated_at && reply.updated_at !== reply.created_at) {
    editLabel = `<span class="comment-edited">(${chrome.i18n.getMessage('labelEdited') || '수정됨'})</span>`;
  }

  let bodyContent = escapeHtml(reply.content);
  if (hasReported) {
    bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(chrome.i18n.getMessage('labelReported') || '신고 접수된 댓글입니다.')}</span>`;
  }

  const tooltipHtml = publicId
    ? `<div class="author-tooltip" id="tooltip-${replyIdStr}" role="tooltip" hidden>${escapeHtml(chrome.i18n.getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
    : '';

  return `
    <div class="reply-item" data-id="${replyIdStr}">
      <div class="comment-header">
        <div class="comment-header-left">
          <div class="author-container" style="position: relative; display: flex; align-items: center;">
            <button class="comment-author" type="button" title="${escapeHtml(displayName)}" aria-label="${escapeHtml(displayName)}" ${publicId ? `aria-describedby="tooltip-${replyIdStr}"` : ''}>${escapeHtml(displayName)}</button>
            ${tooltipHtml}
          </div>
          <div class="vote-group">
            <button class="btn-vote btn-like ${likeActive}" type="button" data-vote-type="like" data-id="${replyIdStr}" ${canVoteComment(reply) ? '' : 'disabled'} title="좋아요" aria-label="좋아요">
              <span class="vote-icon">👍</span>
              <span class="vote-count like-count">${reply.like_count || 0}</span>
            </button>
            <button class="btn-vote btn-dislike ${dislikeActive}" type="button" data-vote-type="dislike" data-id="${replyIdStr}" ${canVoteComment(reply) ? '' : 'disabled'} title="싫어요" aria-label="싫어요">
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
              <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${replyIdStr}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
              <button class="btn btn-sm btn-primary btn-action-save" data-id="${replyIdStr}">${chrome.i18n.getMessage('btnSave') || '저장'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 페이지네이션 슬라이스 렌더링 (최상위 부모 및 하위 대댓글)
 */
function renderCommentPageSlice(pagedParents, repliesMap, userVotes, profiles, userReports) {
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
    const displayName = profile?.display_name || item.author_name || chrome.i18n.getMessage("anonymous");
    const publicId = profile?.public_id || '';

    const hasReported = state.currentUser && userReports[itemIdStr];
    let actionsHtml = '';

    if (state.currentUser && !item.is_deleted) {
      if (canEditComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="edit" data-id="${itemIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnEdit') || '수정')}">✏️</button>`;
      }
      if (canDeleteComment(item, state.currentUser)) {
        actionsHtml += `<button class="btn-action" data-action="delete" data-id="${itemIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnDelete') || '삭제')}">🗑️</button>`;
      }
      if (canReportComment(item, state.currentUser) && !hasReported) {
        actionsHtml += `<button class="btn-action" data-action="report" data-id="${itemIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnReport') || '신고')}">🚨</button>`;
      }
    }

    const myVote = userVotes[itemIdStr];
    const likeActive = myVote === 'like' ? 'active' : '';
    const dislikeActive = myVote === 'dislike' ? 'active' : '';

    let editLabel = '';
    if (item.updated_at && item.updated_at !== item.created_at) {
      editLabel = `<span class="comment-edited">(${chrome.i18n.getMessage('labelEdited') || '수정됨'})</span>`;
    }

    let bodyContent = escapeHtml(item.content);
    if (item.is_deleted) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">${escapeHtml(chrome.i18n.getMessage('deletedComment') || '삭제된 댓글입니다.')}</span>`;
    } else if (hasReported) {
      bodyContent = `<span style="color: var(--text-muted); font-style: italic;">🚨 ${escapeHtml(chrome.i18n.getMessage('labelReported') || '신고 접수된 댓글입니다.')}</span>`;
    }

    const tooltipHtml = publicId && !item.is_deleted
      ? `<div class="author-tooltip" id="tooltip-${itemIdStr}" role="tooltip" hidden>${escapeHtml(chrome.i18n.getMessage('authorTooltipPublicId') || 'User ID: ')}${escapeHtml(publicId)}</div>`
      : '';

    const authorDisplay = item.is_deleted ? chrome.i18n.getMessage("anonymous") : displayName;

    // 활성 최상위 댓글인 경우에만 답글 작성 버튼 노출 (소프트 삭제된 댓글은 새 답글 금지)
    const replyButtonHtml = !item.is_deleted ? `
      <button class="reply-button btn-action" type="button" data-action="reply" data-parent-id="${itemIdStr}" data-id="${itemIdStr}" title="${escapeHtml(chrome.i18n.getMessage('btnReply') || '답글')}" aria-label="${escapeHtml(chrome.i18n.getMessage('btnReply') || '답글')}">
        <span class="reply-icon" aria-hidden="true">↳</span>
        <span class="reply-label">${escapeHtml(chrome.i18n.getMessage('btnReply') || '답글')}</span>
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
            <textarea class="reply-input" id="reply-input-${itemIdStr}" maxlength="1000" placeholder="${escapeHtml(chrome.i18n.getMessage('replyPlaceholder') || '답글을 입력하세요 (최대 1000자)')}"></textarea>
            <div class="form-bottom" style="margin-top: 4px;">
              <span class="char-count" id="reply-char-count-${itemIdStr}">0 / 1000</span>
              <div style="display:flex; gap:4px;">
                <button type="button" class="btn btn-sm btn-outline btn-action-cancel-reply" data-parent-id="${itemIdStr}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
                <button type="submit" class="btn btn-sm btn-primary btn-action-submit-reply" data-parent-id="${itemIdStr}">${chrome.i18n.getMessage('btnSubmitReply') || '답글 등록'}</button>
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
              <button class="btn-vote btn-like ${likeActive}" type="button" data-vote-type="like" data-id="${itemIdStr}" ${canVoteComment(item) ? '' : 'disabled'} title="좋아요" aria-label="좋아요">
                <span class="vote-icon">👍</span>
                <span class="vote-count like-count">${item.like_count || 0}</span>
              </button>
              <button class="btn-vote btn-dislike ${dislikeActive}" type="button" data-vote-type="dislike" data-id="${itemIdStr}" ${canVoteComment(item) ? '' : 'disabled'} title="싫어요" aria-label="싫어요">
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
                <button class="btn btn-sm btn-outline btn-action-cancel" data-id="${itemIdStr}">${chrome.i18n.getMessage('btnCancel') || '취소'}</button>
                <button class="btn btn-sm btn-primary btn-action-save" data-id="${itemIdStr}">${chrome.i18n.getMessage('btnSave') || '저장'}</button>
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

/**
 * 현재 페이지의 댓글 스레드 슬라이스를 렌더링
 */
export function renderCurrentPage() {
  const { visibleParents, repliesMap } = currentCommentThreads;
  if (!visibleParents || visibleParents.length === 0) {
    elements.commentList.innerHTML = '';
    showState('empty');
    updatePaginationUI(1, 1);
    return;
  }

  const pagination = paginateThreads(visibleParents, currentCommentPage, THREADS_PER_PAGE);
  currentCommentPage = pagination.currentPage;

  renderCommentPageSlice(pagination.pagedThreads, repliesMap, currentCommentVotes, currentProfiles, currentUserReports);
  updatePaginationUI(pagination.currentPage, pagination.totalPages);
  showState('list');
}

/**
 * 댓글 목록 렌더링 (최상위 댓글 및 1단계 대댓글 계층 구조, 시간순 ASC 정렬 및 페이지네이션)
 */
export function renderCommentList(comments, userVotes = {}, profiles = {}, userReports = {}) {
  const { visibleParents, repliesMap } = groupCommentThreads(comments);

  // 시간순 오름차순(oldest first) 정렬 및 동일 시간 시 bigint 안전 id 타이 브레이크
  visibleParents.sort(compareCommentsChronological);

  currentCommentThreads = { visibleParents, repliesMap };
  currentCommentVotes = userVotes;
  currentProfiles = profiles;
  currentUserReports = userReports;

  // 읽기 위치 보존: 현재 페이지가 여전히 유효하면 유지, 초과 시 최대 페이지로 클램핑
  const totalPages = Math.max(1, Math.ceil(visibleParents.length / THREADS_PER_PAGE));
  currentCommentPage = Math.min(Math.max(1, currentCommentPage), totalPages);

  renderCurrentPage();
}

let currentFetchSequence = 0;
let lastLoadedUrl = null;

export function resetPagination() {
  currentCommentPage = 1;
  lastLoadedUrl = null;
}

/**
 * 현재 페이지의 댓글과 대댓글 조회 (N+1 방지 1회 통합 쿼리)
 */
export async function loadComments(url) {
  if (lastLoadedUrl !== url) {
    currentCommentPage = 1;
    lastLoadedUrl = url;
  }
  const fetchSeq = ++currentFetchSequence;
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

    // Discard stale in-flight response if a newer fetch was initiated or active URL changed
    if (fetchSeq !== currentFetchSequence || url !== state.normalizedCurrentUrl) {
      return;
    }

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

    if (fetchSeq !== currentFetchSequence || url !== state.normalizedCurrentUrl) {
      return;
    }

    renderCommentList(data, userVotes, profiles, userReports);
    showState('list');

  } catch (err) {
    if (fetchSeq !== currentFetchSequence || url !== state.normalizedCurrentUrl) {
      return;
    }
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

    inputEl.value = '';
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
