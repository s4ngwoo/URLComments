/**
 * Client-side counterpart of `normalize_comments_before_insert`.
 * The database trigger is the security boundary; this keeps the official
 * insert payload from shipping forged vote caches if a caller leaks extras.
 */
export function sanitizeCommentInsert(row) {
  const payload = {
    url: row.url,
    author_id: row.author_id,
    author_name: row.author_name,
    content: row.content,
    like_count: 0,
    dislike_count: 0,
    is_deleted: false,
  };
  if (row.parent_id != null) {
    payload.parent_id = row.parent_id;
  }
  return payload;
}
