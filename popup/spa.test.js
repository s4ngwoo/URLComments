import { initTabUrl, processUrl } from './spa.js';
import { loadComments } from './comments.js';
import { resetState, state } from './state.js';
import { initElements } from './ui.js';

jest.mock('./comments.js', () => ({
  loadComments: jest.fn().mockResolvedValue(undefined),
}));

function spaFixture() {
  document.body.innerHTML = `
    <div id="page-toolbar" class="page-toolbar hidden">
      <span id="current-url" class="url-text" title="">-</span>
    </div>
    <div id="spa-notice" class="spa-notice hidden"></div>
    <div id="state-loading" class="hidden"><span id="loading-text"></span></div>
    <div id="state-unsupported" class="hidden"></div>
    <div id="state-empty" class="hidden"></div>
    <div id="state-list" class="hidden"></div>
    <div id="state-needs-refresh" class="hidden"></div>
    <div id="app-footer">
      <textarea id="comment-input"></textarea>
      <button id="btn-submit">등록</button>
      <span id="form-auth-notice" class="auth-notice hidden"></span>
    </div>
    <div id="error-banner" class="hidden"><span id="error-message"></span></div>
    <div id="pagination-controls" class="hidden"></div>
  `;
  initElements();
}

describe('popup/spa.js', () => {
  beforeEach(() => {
    resetState();
    spaFixture();
    loadComments.mockClear();
    delete window.urlHelper;
    delete window.utils;
    chrome.tabs.query.mockReset();
  });

  describe('processUrl', () => {
    it('uses urlHelper.normalizeUrl and loads comments for supported pages', () => {
      window.urlHelper = {
        normalizeUrl: jest.fn(() => 'https://example.com/article'),
      };
      state.currentUser = { id: 'user-1' };

      processUrl('https://example.com/article?utm=1');

      expect(window.urlHelper.normalizeUrl).toHaveBeenCalledWith('https://example.com/article?utm=1');
      expect(state.normalizedCurrentUrl).toBe('https://example.com/article');
      expect(document.getElementById('page-toolbar').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('current-url').textContent).toBe('https://example.com/article');
      expect(document.getElementById('comment-input').disabled).toBe(false);
      expect(loadComments).toHaveBeenCalledWith('https://example.com/article');
    });

    it('keeps the form disabled when the URL is supported but the user is logged out', () => {
      window.urlHelper = {
        normalizeUrl: jest.fn(() => 'https://example.com/'),
      };
      state.currentUser = null;

      processUrl('https://example.com/');

      expect(document.getElementById('comment-input').disabled).toBe(true);
      expect(document.getElementById('btn-submit').disabled).toBe(true);
      expect(document.getElementById('form-auth-notice').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('form-auth-notice').textContent).toBe('authNoticeDefault');
      expect(loadComments).toHaveBeenCalledWith('https://example.com/');
    });

    it('shows unsupported and skips loadComments when helper returns null', () => {
      window.urlHelper = { normalizeUrl: jest.fn(() => null) };

      processUrl('chrome://extensions');

      expect(state.normalizedCurrentUrl).toBeNull();
      expect(document.getElementById('page-toolbar').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('state-unsupported').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('comment-input').disabled).toBe(true);
      expect(loadComments).not.toHaveBeenCalled();
    });

    it('fallback helper only allows origin root paths when urlHelper is missing', () => {
      processUrl('https://example.com/article');

      expect(state.normalizedCurrentUrl).toBeNull();
      expect(document.getElementById('state-unsupported').classList.contains('hidden')).toBe(false);
      expect(loadComments).not.toHaveBeenCalled();

      processUrl('https://example.com/');
      expect(state.normalizedCurrentUrl).toBe('https://example.com/');
      expect(loadComments).toHaveBeenCalledWith('https://example.com/');
    });

    it('fallback helper rejects chrome and edge URLs', () => {
      processUrl('chrome://settings');
      expect(state.normalizedCurrentUrl).toBeNull();
      processUrl('edge://flags');
      expect(state.normalizedCurrentUrl).toBeNull();
      expect(loadComments).not.toHaveBeenCalled();
    });

    it('shows the SPA notice when spa detection is already set', () => {
      window.urlHelper = { normalizeUrl: jest.fn(() => 'https://www.youtube.com/watch') };
      state.isSpaDetected = true;

      processUrl('https://www.youtube.com/watch?v=1');

      expect(document.getElementById('spa-notice').classList.contains('hidden')).toBe(false);
    });
  });

  describe('initTabUrl', () => {
    it('marks known SPA hostnames including subdomains and then processes the tab URL', async () => {
      window.urlHelper = {
        normalizeUrl: jest.fn(() => 'https://www.youtube.com/watch'),
      };
      chrome.tabs.query.mockResolvedValue([
        { url: 'https://www.youtube.com/watch?v=abc' },
      ]);

      await initTabUrl();

      expect(state.isSpaDetected).toBe(true);
      expect(window.urlHelper.normalizeUrl).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc');
      expect(loadComments).toHaveBeenCalled();
    });

    it('does not mark non-SPA hosts as SPA', async () => {
      window.urlHelper = {
        normalizeUrl: jest.fn(() => 'https://example.com/post'),
      };
      chrome.tabs.query.mockResolvedValue([{ url: 'https://example.com/post' }]);

      await initTabUrl();

      expect(state.isSpaDetected).toBe(false);
      expect(loadComments).toHaveBeenCalledWith('https://example.com/post');
    });

    it('shows unsupported when the active tab has no URL', async () => {
      chrome.tabs.query.mockResolvedValue([{}]);

      await initTabUrl();

      expect(document.getElementById('state-unsupported').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('comment-input').disabled).toBe(true);
      expect(loadComments).not.toHaveBeenCalled();
    });
  });
});
