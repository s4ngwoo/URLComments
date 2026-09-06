import { setSpaDomain, setNormalizedUrl, state } from './state.js';
import { elements, showLoading, showState, disableForm, enableForm } from './ui.js';
import { loadComments } from './comments.js';

const KNOWN_SPA_DOMAINS = [
  'instagram.com', 'twitter.com', 'x.com', 'youtube.com', 
  'facebook.com', 'linkedin.com', 'tiktok.com'
];

export async function initTabUrl() {
  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        let hostname = '';
        try {
          hostname = new URL(tab.url).hostname;
        } catch(e) {}
        
        if (KNOWN_SPA_DOMAINS.some(d => hostname.includes(d))) {
          setSpaDomain(true);
        }
        
        processUrl(tab.url);
      } else {
        showState('unsupported');
        disableForm(chrome.i18n.getMessage("msgUnsupportedCannotComment"));
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
    elements.urlBar.classList.add('hidden');
    
    showState('unsupported-spa');
    disableForm("이 사이트는 JS 로 내용만 바뀌는 페이지이거나, 메인 도메인이 아닙니다.");
    return;
  }

  elements.urlBar.classList.remove('hidden');
  elements.currentUrlText.textContent = state.normalizedCurrentUrl;
  elements.currentUrlText.title = state.normalizedCurrentUrl;

  if (state.currentUser) {
    enableForm();
  } else {
    disableForm(chrome.i18n.getMessage("authNoticeDefault"));
  }

  loadComments(state.normalizedCurrentUrl);
}
