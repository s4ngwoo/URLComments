import { getMessage } from './i18n.js';

import { setSpaDetected, setNormalizedUrl, state } from './state.js';
import { elements, showLoading, showState, disableForm, enableForm } from './ui.js';
import { loadComments } from './comments.js';

const KNOWN_SPA_DOMAINS = [
  'instagram.com', 'twitter.com', 'x.com', 'youtube.com', 
  'facebook.com', 'linkedin.com', 'tiktok.com'
];

export async function initTabUrl() {
  try {
    showLoading(getMessage("stateLoading"));

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        let hostname = '';
        try {
          hostname = new URL(tab.url).hostname;
        } catch(e) {}
        
        if (KNOWN_SPA_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
          setSpaDetected(true);
        }
        
        processUrl(tab.url);
      } else {
        showState('unsupported');
        disableForm(getMessage("msgUnsupportedCannotComment"));
      }
    } else {
      processUrl(window.location.href);
    }
  } catch (error) {
    console.error('Tab URL fetch error:', error);
    showState('unsupported');
  }
}

export function processUrl(rawUrl) {
  const helper = window.urlHelper || window.utils || {
    normalizeUrl: (u) => {
      if (!u) return null;
      if (u.startsWith('chrome://') || u.startsWith('edge://')) return null;
      try { 
        const o = new URL(u); 
        if (o.pathname !== '/' && o.pathname !== '') return null;
        return o.origin + o.pathname; 
      } catch(e) { return null; }
    }
  };

  const normalized = helper.normalizeUrl(rawUrl);
  setNormalizedUrl(normalized);

  if (!state.normalizedCurrentUrl) {
    elements.pageToolbar.classList.add('hidden');
    elements.spaNotice.classList.add('hidden');
    
    showState('unsupported');
    disableForm(getMessage("msgUnsupportedCannotComment") || "지원하지 않는 페이지입니다.");
    return;
  }

  elements.pageToolbar.classList.remove('hidden');
  elements.currentUrlText.textContent = state.normalizedCurrentUrl;
  elements.currentUrlText.title = state.normalizedCurrentUrl;

  if (state.isSpaDetected) {
    elements.spaNotice.classList.remove('hidden');
  } else {
    elements.spaNotice.classList.add('hidden');
  }

  if (state.currentUser) {
    enableForm();
  } else {
    disableForm(getMessage("authNoticeDefault"));
  }

  loadComments(state.normalizedCurrentUrl);
}
