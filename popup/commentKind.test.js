import { isReplyComment, isTopLevelComment } from './render.js';

describe('popup/render.js comment kind helpers', () => {
  it('treats missing and null parent_id as a top-level comment', () => {
    expect(isTopLevelComment({ id: '1' })).toBe(true);
    expect(isTopLevelComment({ id: '1', parent_id: null })).toBe(true);
    expect(isTopLevelComment({ id: '1', parent_id: undefined })).toBe(true);
    expect(isReplyComment({ id: '1', parent_id: null })).toBe(false);
  });

  it('treats a present parent_id as a reply, including numeric ids', () => {
    expect(isTopLevelComment({ id: '2', parent_id: '1' })).toBe(false);
    expect(isReplyComment({ id: '2', parent_id: '1' })).toBe(true);
    expect(isReplyComment({ id: '2', parent_id: 12 })).toBe(true);
  });
});
