const { isSupportedUrl, isMainDomain, normalizeUrl } = require('./urlHelper');

describe('urlHelper', () => {
  describe('isSupportedUrl', () => {
    it('accepts http and https URLs', () => {
      expect(isSupportedUrl('https://example.com/path')).toBe(true);
      expect(isSupportedUrl('http://localhost:3000')).toBe(true);
    });

    it('rejects extension, file, and invalid URLs', () => {
      expect(isSupportedUrl('chrome://extensions')).toBe(false);
      expect(isSupportedUrl('edge://settings')).toBe(false);
      expect(isSupportedUrl('file:///tmp/page.html')).toBe(false);
      expect(isSupportedUrl('not-a-url')).toBe(false);
      expect(isSupportedUrl('')).toBe(false);
      expect(isSupportedUrl(null)).toBe(false);
      expect(isSupportedUrl(123)).toBe(false);
    });
  });

  describe('isMainDomain', () => {
    it('treats root path as the main domain', () => {
      expect(isMainDomain('https://example.com/')).toBe(true);
      expect(isMainDomain('https://example.com')).toBe(true);
    });

    it('treats nested paths as not the main domain', () => {
      expect(isMainDomain('https://example.com/article')).toBe(false);
      expect(isMainDomain('https://example.com/a/b')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(isMainDomain('not-a-url')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('strips query, hash, and trailing slashes on nested paths', () => {
      expect(normalizeUrl('https://example.com/page/?q=1#hash')).toBe(
        'https://example.com/page'
      );
    });

    it('keeps the root trailing slash', () => {
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });

    it('normalizes nested SPA paths instead of returning null', () => {
      expect(normalizeUrl('https://app.example.com/dashboard/settings')).toBe(
        'https://app.example.com/dashboard/settings'
      );
    });

    it('returns null for unsupported schemes', () => {
      expect(normalizeUrl('chrome://extensions')).toBeNull();
      expect(normalizeUrl('about:blank')).toBeNull();
    });
  });
});
