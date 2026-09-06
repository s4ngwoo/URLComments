const { normalizeUrl, formatDate, validateCommentContent } = require('./utils');

describe('URLComments Utils', () => {
  describe('normalizeUrl', () => {
    it('should strip query string and hash', () => {
      expect(normalizeUrl('https://example.com/page?query=123#hash')).toBe('https://example.com/page');
    });

    it('should filter chrome and internal URLs', () => {
      expect(normalizeUrl('chrome://extensions')).toBeNull();
      expect(normalizeUrl('edge://settings')).toBeNull();
      expect(normalizeUrl('brave://rewards')).toBeNull();
      expect(normalizeUrl('about:blank')).toBeNull();
    });

    it('should handle invalid URLs safely', () => {
      expect(normalizeUrl('not-a-valid-url')).toBeNull();
      expect(normalizeUrl(null)).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should format ISO date correctly (MM/DD HH:mm)', () => {
      // Mocking timezone can be tricky, but we'll use a fixed Date object or match the format
      const isoString = '2025-09-06T14:30:00Z';
      const result = formatDate(isoString);
      
      // Since local time depends on the system running it, we test if it matches the MM/DD HH:mm format
      expect(result).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it('should return empty string for invalid dates', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('validateCommentContent', () => {
    it('should reject empty or whitespace strings', () => {
      expect(validateCommentContent('')).toBe(false);
      expect(validateCommentContent('   ')).toBe(false);
    });

    it('should reject strings longer than 1000 characters', () => {
      const longString = 'a'.repeat(1001);
      expect(validateCommentContent(longString)).toBe(false);
    });

    it('should accept valid strings', () => {
      expect(validateCommentContent('hello')).toBe(true);
      expect(validateCommentContent('This is a valid comment.')).toBe(true);
    });

    it('should reject non-strings', () => {
      expect(validateCommentContent(null)).toBe(false);
      expect(validateCommentContent(123)).toBe(false);
    });
  });
});
