/**
 * popup/pagination.js
 * Thread grouping, pagination, and chronological sorting logic.
 */

export const THREADS_PER_PAGE = 10;

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
