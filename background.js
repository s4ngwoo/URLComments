/**
 * URLComments Background Service Worker
 * 사이드 패널 열기 및 탭 변경 감지 담당
 */

// 로컬 스토리지 키 생성 헬퍼
function getSpaKey(tabId) {
  return `${tabId}_isSpa`;
}

// 메시지를 보내어 사이드 패널 UI에 '새로고침'을 요구함
function notifyTabChanged() {
  chrome.runtime.sendMessage({ type: 'TAB_CHANGED' }).catch((err) => {
    // 사이드 패널이 닫혀있어 메시지 수신자가 없는 경우 발생하는 일반적인 에러 무시
  });
}

// 1. 확장 프로그램 아이콘 클릭 시 사이드 패널 열기
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

// 2. 탭이 활성화(변경)되었을 때 팝업(사이드 패널) 측으로 알림 전송 (자동 서버 요청 안함)
chrome.tabs.onActivated.addListener((activeInfo) => {
  notifyTabChanged();
});

// 3. 현재 탭의 URL이 변경(새로고침, 링크 이동)되었을 때 알림 전송
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    notifyTabChanged();
  }
});

// 4. Content Script에서 SPA 감지 시 상태 저장 및 사이드 패널로 알림
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'SPA_DETECTED' && sender.tab) {
    const tabId = sender.tab.id;
    const key = getSpaKey(tabId);
    
    // 로컬 스토리지에 해당 탭이 SPA임을 기록
    chrome.storage.local.set({ [key]: true }, () => {
      // 사이드 패널(popup.js) 측으로 SPA_DETECTED 브로드캐스트
      chrome.runtime.sendMessage({ type: 'SPA_DETECTED', tabId: tabId }).catch(() => {});
    });
  }
});
