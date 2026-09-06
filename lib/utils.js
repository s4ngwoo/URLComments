/**
 * URLComments 유틸리티 함수
 * 순수 자바스크립트 환경(Node.js 등)에서도 테스트 및 실행이 가능하도록 분리된 로직들입니다.
 */

function normalizeUrl(rawUrl) {
  if (!rawUrl) return null;
  
  // 크롬 내부 URL, 브레이브 내부 URL 등 필터링
  if (rawUrl.startsWith('chrome://') || rawUrl.startsWith('edge://') || rawUrl.startsWith('about:') || rawUrl.startsWith('brave://')) {
    return null;
  }

  try {
    const urlObj = new URL(rawUrl);
    // Origin + Pathname 까지만 유지 (Query string, Hash 제거)
    return urlObj.origin + urlObj.pathname;
  } catch (err) {
    return null; // URL 파싱 실패 시
  }
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${month}/${day} ${hours}:${minutes}`;
}

function validateCommentContent(content) {
  if (typeof content !== 'string') return false;
  
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 1000) return false;
  
  return true;
}

// Node.js 환경(Jest)용 모듈 엑스포트
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeUrl,
    formatDate,
    validateCommentContent
  };
} else {
  // 브라우저 환경 전역 노출
  window.utils = {
    normalizeUrl,
    formatDate,
    validateCommentContent
  };
}
