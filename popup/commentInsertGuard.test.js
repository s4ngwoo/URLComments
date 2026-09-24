import { sanitizeCommentInsert } from './commentInsertGuard.js';

describe('sanitizeCommentInsert', () => {
  const base = {
    url: 'https://example.com/page',
    author_id: 'user-1',
    author_name: 'Ada',
    content: 'hello',
  };

  test('forces vote caches and is_deleted even when the caller forges them', () => {
    expect(
      sanitizeCommentInsert({
        ...base,
        like_count: 999999,
        dislike_count: 42,
        is_deleted: true,
      })
    ).toEqual({
      ...base,
      like_count: 0,
      dislike_count: 0,
      is_deleted: false,
    });
  });

  test('keeps parent_id for replies and still zeros vote caches', () => {
    expect(
      sanitizeCommentInsert({
        ...base,
        parent_id: 17,
        like_count: 5,
      })
    ).toEqual({
      ...base,
      parent_id: 17,
      like_count: 0,
      dislike_count: 0,
      is_deleted: false,
    });
  });
});
