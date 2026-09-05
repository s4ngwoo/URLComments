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
 * 쿼리스트링, 해시를 제거하고 프로토콜, 호스트, 패스만 남겨 정규화된 URL을 반환합니다.
 * 지원하지 않는 URL 스킴일 경우 null을 반환합니다.
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

    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch (e) {
    return null;
  }
}

// 브라우저 전역 객체 등록 및 CJS 모듈 지원
if (typeof window !== 'undefined') {
  window.urlHelper = { isSupportedUrl, normalizeUrl };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isSupportedUrl, normalizeUrl };
}
