/**
 * URLComments SPA(Single Page Application) 감지 스크립트
 * 브라우저 환경에서 동작하며, History API 및 DOM 변화를 감지하여 SPA 여부를 판별합니다.
 */

// 테스트 가능한 구조를 위해 로직을 분리
function startSpaDetector(domains, globalDeps) {
  const windowObj = globalDeps.window || window;
  const historyObj = globalDeps.history || history;
  const documentObj = globalDeps.document || document;
  const chromeObj = globalDeps.chrome || chrome;
  const locationObj = globalDeps.location || location;

  let isSpaDetected = false;
  let lastNotificationTime = 0;

  function notifySpaDetected() {
    if (isSpaDetected) return;
    
    const now = Date.now();
    if (now - lastNotificationTime < 1000) return; // 1초 Throttle
    lastNotificationTime = now;

    isSpaDetected = true;
    try {
      chromeObj.runtime.sendMessage({ type: 'SPA_DETECTED', hostname: locationObj.hostname });
    } catch (e) {
      // 확장 프로그램 컨텍스트가 유효하지 않을 때의 일반적 에러 무시
    }
  }

  // 1. 도메인 기반 즉시 감지
  if (domains.some(domain => locationObj.hostname.includes(domain))) {
    notifySpaDetected();
    return; // 이미 감지되었으므로 추가 감시 불필요
  }

  // 2. History API 래핑을 통한 감지
  const originalPushState = historyObj.pushState;
  const originalReplaceState = historyObj.replaceState;

  historyObj.pushState = function() {
    notifySpaDetected();
    return originalPushState.apply(this, arguments);
  };

  historyObj.replaceState = function() {
    notifySpaDetected();
    return originalReplaceState.apply(this, arguments);
  };

  windowObj.addEventListener('popstate', () => {
    notifySpaDetected();
  });

  // 3. 주요 콘텐츠 영역 DOM 변화 감지 (MutationObserver)
  const observer = new MutationObserver((mutations) => {
    if (isSpaDetected) {
      observer.disconnect();
      return;
    }
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 5 || mutation.removedNodes.length > 5) {
        notifySpaDetected();
        break;
      }
    }
  });

  // 문서 로드 완료 후 관찰 시작 (테스트 환경에서는 setTimeout 무시하거나 모킹 필요)
  const timerId = setTimeout(() => {
    const mainNode = documentObj.querySelector('main') || documentObj.querySelector('[role="main"]') || documentObj.body;
    if (mainNode) {
      observer.observe(mainNode, { childList: true, subtree: true });
    }
  }, 1000);
  
  return {
    notifySpaDetected,
    observer,
    timerId
  };
}

(async function() {
  // 테스트 환경(Node.js)인 경우 즉시 실행 방지
  if (typeof window !== 'undefined' && window.process && window.process.release && window.process.release.name === 'node') {
    return;
  }
  // 중복 실행 방지
  if (typeof window !== 'undefined') {
    if (window.__urlcomments_spa_detector_injected) return;
    window.__urlcomments_spa_detector_injected = true;
  }

  // Fallback 도메인 리스트
  let spaDomains = [
    'instagram.com',
    'twitter.com',
    'x.com',
    'youtube.com',
    'facebook.com',
    'linkedin.com',
    'tiktok.com'
  ];

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const configUrl = chrome.runtime.getURL('content/config.js');
      const config = await import(configUrl);
      if (config && config.KNOWN_SPA_DOMAINS) {
        spaDomains = config.KNOWN_SPA_DOMAINS;
      }
    }
  } catch (e) {
    console.warn('[URLComments] Failed to load config.js dynamically. Using fallback domains.', e);
  }

  if (typeof window !== 'undefined') {
    startSpaDetector(spaDomains, { window, history, document, chrome, location });
  }
})();

// 테스트용 Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { startSpaDetector };
}
