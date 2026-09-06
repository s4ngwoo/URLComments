/**
 * URL 정규화 및 지원 여부 확인 유틸리티
 */

/**
 * 주어진 URL이 지원되는 프로토콜(http, https)인지 확인합니다.
 * @param {string} url 
 * @returns {boolean}
 */
function isSupportedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * 메인 도메인(루트)인지 확인합니다.
 * @param {string} url 
 * @returns {boolean}
 */
function isMainDomain(url) {
  try {
    const parsed = new URL(url);
    // 패스가 '/' 이거나 없는 경우 메인 도메인으로 간주
    return parsed.pathname === '/' || parsed.pathname === '';
  } catch (e) {
    return false;
  }
}

/**
 * 쿼리스트링, 해시를 제거하고 프로토콜, 호스트, 패스만 남겨 정규화된 URL을 반환합니다.
 * 지원하지 않는 URL 스킴일 경우 null을 반환합니다.
 * SPA 정책에 따라, 메인 도메인이 아니면 null을 반환하도록 설계되었습니다. (단, 팝업에서 이 로직을 활용할 수도 있음)
 * 
 * @param {string} rawUrl 
 * @returns {string | null}
 */
function normalizeUrl(rawUrl) {
  if (!isSupportedUrl(rawUrl)) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    let pathname = parsed.pathname;

    // 루트('/')가 아닌 패스 끝의 trailing slash 제거하여 통일
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    // SPA 방어 로직: 요구사항에 따라 메인 도메인이 아니면 null 처리
    // 단, 팝업 스크립트에서 SPA 도메인인지 여부에 따라 분기할 수 있도록
    // 기본 정규화 기능에 탑재할지, 팝업에서 판단할지 결정.
    // 지시사항 4: "메인 도메인이 아닌 경우 -> null 반환"
    if (pathname !== '/' && pathname !== '') {
      return null;
    }

    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch (e) {
    return null;
  }
}

// 브라우저 전역 객체 등록 및 CJS 모듈 지원
if (typeof window !== 'undefined') {
  window.urlHelper = { isSupportedUrl, normalizeUrl, isMainDomain };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isSupportedUrl, normalizeUrl, isMainDomain };
}
