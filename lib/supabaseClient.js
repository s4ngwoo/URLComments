/**
 * Supabase 클라이언트 초기화 모듈
 * 
 * [사용 안내]
 * 아래 SUPABASE_URL 및 SUPABASE_ANON_KEY 프로젝트 값으로 대체해 주세요.
 * Supabase 대시보드 -> Project Settings -> API 에서 확인 가능합니다.
 */

// 환경변수(config.js)에서 값 불러오기
// config.js가 로드되지 않았을 경우를 대비한 기본값 처리 (에러 방지)
const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) ? window.ENV.SUPABASE_URL : "";
const SUPABASE_ANON_KEY = (window.ENV && window.ENV.SUPABASE_ANON_KEY) ? window.ENV.SUPABASE_ANON_KEY : "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
  console.error("Supabase 설정이 누락되었습니다. lib/config.js 파일을 확인해주세요.");
}

// Chrome Extension의 chrome.storage.local을 Supabase Auth persistence 어댑터로 사용
const chromeStorageAdapter = {
  getItem: (key) => new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([key], (result) => resolve(result[key] || null));
    } else {
      resolve(localStorage.getItem(key));
    }
  }),
  setItem: (key, value) => new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: value }, resolve);
    } else {
      localStorage.setItem(key, value);
      resolve();
    }
  }),
  removeItem: (key) => new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove([key], resolve);
    } else {
      localStorage.removeItem(key);
      resolve();
    }
  })
};

let client = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
} else {
  console.error("Supabase SDK(lib/supabase.js)가 먼저 로드되어야 합니다.");
}

window.supabaseClient = client;
