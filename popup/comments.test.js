import { 
  canEditComment, 
  canDeleteComment, 
  canReportComment, 
  canVoteComment,
  trimCommentContent,
  isValidCommentContent 
} from './comments.js';

describe('comments.js Pure Functions', () => {
  const userA = { id: 'user-a' };
  const userB = { id: 'user-b' };
  
  const normalCommentUserA = { author_id: 'user-a', is_deleted: false };
  const deletedCommentUserA = { author_id: 'user-a', is_deleted: true };

  describe('canEditComment', () => {
    it('returns false if no user', () => {
      expect(canEditComment(normalCommentUserA, null)).toBe(false);
    });
    it('returns false if comment is deleted', () => {
      expect(canEditComment(deletedCommentUserA, userA)).toBe(false);
    });
    it('returns true if user is author', () => {
      expect(canEditComment(normalCommentUserA, userA)).toBe(true);
    });
    it('returns false if user is not author', () => {
      expect(canEditComment(normalCommentUserA, userB)).toBe(false);
    });
  });

  describe('canDeleteComment', () => {
    it('behaves same as canEditComment', () => {
      expect(canDeleteComment(normalCommentUserA, userA)).toBe(true);
      expect(canDeleteComment(normalCommentUserA, userB)).toBe(false);
      expect(canDeleteComment(deletedCommentUserA, userA)).toBe(false);
    });
  });

  describe('canReportComment', () => {
    it('returns false if no user', () => {
      expect(canReportComment(normalCommentUserA, null)).toBe(false);
    });
    it('returns false if comment is deleted', () => {
      expect(canReportComment(deletedCommentUserA, userB)).toBe(false);
    });
    it('returns false if user is author (cannot report own comment)', () => {
      expect(canReportComment(normalCommentUserA, userA)).toBe(false);
    });
    it('returns true if user is not author', () => {
      expect(canReportComment(normalCommentUserA, userB)).toBe(true);
    });
  });

  describe('canVoteComment', () => {
    it('returns true for normal comment', () => {
      expect(canVoteComment(normalCommentUserA)).toBe(true);
    });
    it('returns false for deleted comment', () => {
      expect(canVoteComment(deletedCommentUserA)).toBe(false);
    });
  });

  describe('trimCommentContent', () => {
    it('trims whitespace', () => {
      expect(trimCommentContent('  hello  ')).toBe('hello');
    });
    it('handles null/undefined gracefully', () => {
      expect(trimCommentContent(null)).toBe('');
      expect(trimCommentContent(undefined)).toBe('');
    });
  });

  describe('isValidCommentContent', () => {
    it('returns true for valid content', () => {
      expect(isValidCommentContent('Hello')).toBe(true);
      expect(isValidCommentContent('a'.repeat(1000))).toBe(true);
    });
    it('returns false for empty or whitespace only', () => {
      expect(isValidCommentContent('')).toBe(false);
      expect(isValidCommentContent('   ')).toBe(false);
    });
    it('returns false if over 1000 chars after trim', () => {
      expect(isValidCommentContent('a'.repeat(1001))).toBe(false);
    });
  });
});
