/**
 * popup/comments.js
 * Coordinator module for comments.
 * Aggregates api, pagination, and render modules and manages UI state.
 */

import { state } from './state.js';
import { elements, showLoading, showError, hideError, showState, updatePaginationUI } from './ui.js';
import { getMessage } from './i18n.js';
import { groupCommentThreads, compareCommentsChronological, paginateThreads, THREADS_PER_PAGE } from './pagination.js';
import { renderCommentPageSlice } from './render.js';

// Re-export everything to maintain backward compatibility with popup.js and tests
export * from './api.js';
export * from './pagination.js';
export * from './render.js';

// In-memory thread storage for pagination without network refetch
export let currentCommentThreads = { visibleParents: [], repliesMap: {} };
export let currentCommentVotes = {};
export let currentProfiles = {};
export let currentUserReports = {};
export let currentCommentPage = 1;

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
  showLoading(getMessage("stateLoading"));
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
    showError(getMessage("msgLoadCommentsError") + " " + errDetail);
    showState('empty');
  }
}
