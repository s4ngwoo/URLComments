# 🤝 URLComments 기여 가이드 (Contributing Guide)

🌍 [English](../CONTRIBUTING.md) | [한국어](CONTRIBUTING.md) | [日本語](../ja/CONTRIBUTING.md) | [中文](../zh/CONTRIBUTING.md) | [Español](../es/CONTRIBUTING.md)

URLComments 프로젝트에 관심을 가져주셔서 감사합니다! 본 가이드는 로컬 개발 환경 구축, 테스트 실행, 코드 컨벤션 및 기여 절차를 안내합니다.

---

## 📋 사전 요구 사항

- **Node.js**: v18.x 이상
- **npm**: v9.x 이상
- **Google Chrome** (또는 Manifest V3를 지원하는 크로미움 기반 브라우저)
- 테스트용 **Supabase** 계정 (또는 로컬 Supabase 인스턴스)

---

## 🚀 시작하기

### 1. 저장소 복제 (Clone)
```bash
git clone https://github.com/your-username/URLComments.git
cd URLComments
```

### 2. 의존성 패키지 설치
```bash
npm install
```

### 3. Supabase 접속 정보 설정
`lib/config.js` 파일을 생성합니다 (보안을 위해 `.gitignore`에 등록되어 있습니다):

```javascript
// lib/config.js
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

> [!CAUTION]
> **`SERVICE_ROLE_KEY`는 절대로 포함하지 마세요.** 클라이언트 확장 프로그램은 반드시 공개 `ANON_KEY`만 사용해야 합니다.

### 4. Chrome에 확장 프로그램 로드
1. Chrome 브라우저에서 `chrome://extensions`로 이동합니다.
2. 우측 상단의 **개발자 모드(Developer mode)** 토글을 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다(Load unpacked)** 버튼을 클릭하고 `URLComments` 루트 폴더를 선택합니다.
4. 브라우저 툴바에 URLComments 아이콘을 고정합니다.

---

## 🧪 테스트 실행

Jest와 `jest-environment-jsdom`을 사용하여 단위 및 통합 테스트를 수행합니다.

### 전체 테스트 실행
```bash
npm test
```

### 변경 감지(Watch) 모드 실행
```bash
npx jest --watch
```

### 테스트 스위트 구성
- `lib/utils.test.js`: URL 정규화 및 유틸리티 검증
- `lib/publicId.test.js`: 공개 Public ID 생성 검증
- `content/spaDetector.test.js`: SPA URL 변경 감지 로직 검증
- `popup/state.test.js`: 중앙 상태 저장소 상태 변경 검증
- `popup/comments.test.js`: 1단계 대댓글 그룹핑, 시간순 정렬 및 페이지네이션
- `popup/votes.test.js`: 좋아요/싫어요 반응 및 롤백 로직
- `popup/profile.test.js`: 프로필 및 표시 이름 처리 검증
- `popup/my_comments.test.js`: 내 댓글 목록 및 탭 전환
- `test/locales.test.js`: **다국어 정합성 검증**(6개 국어 번역 키 완전 일치 확인)

---

## 🌐 다국어 지원 (i18n)

URLComments는 6개 언어를 완벽하게 지원합니다:
- 🇺🇸 영어 (`en`)
- 🇰🇷 한국어 (`ko`)
- 🇯🇵 일본어 (`ja`)
- 🇪🇸 스페인어 (`es`)
- 🇨🇳 중국어 간체 (`zh_CN`)
- 🇹🇼 중국어 번체 (`zh_TW`)

### 신규 번역 키 추가 절차
1. `_locales/en/messages.json`에 키와 영문 설명을 추가합니다.
2. 다른 모든 로케일 디렉터리(`ko`, `ja`, `es`, `zh_CN`, `zh_TW`)의 `messages.json`에 해당 번역을 추가합니다.
3. `npm test test/locales.test.js`를 실행하여 모든 언어 간 키 누락이 없는지 검증합니다.

---

## 🛡️ 핵심 개발 원칙

1. **프라이버시 최우선 (절대 타협 불가)**:
   - **백그라운드 탭 감시 금지**: 브라우징 기록을 추적하는 백그라운드 스크립트나 알람을 절대로 추가하지 않습니다.
   - **명시적 팝업 요청**: 사용자가 확장 프로그램 창을 직접 열었을 때만 URL을 읽고 서버와 통신합니다.
   - **엄격한 URL 정규화**: 쿼리스트링과 해시를 제거하여 개인 추적 식별자의 노출을 원천 방지합니다.
2. **순수 바닐라 JS 모듈화**:
   - 무거운 외부 프레임워크 도입을 지양하고 가볍고 빠른 성능을 유지합니다.
3. **BigInt 안전 비교**:
   - Supabase ID는 부동소수점 오차 방지를 위해 항상 `String(a) === String(b)`로 비교합니다.
4. **시간순 스레드 정렬**:
   - 부모 댓글과 대댓글은 항상 작성일시 오름차순(`created_at ASC`)을 유지합니다.

---

## 📬 Pull Request 제출

1. 기능별 작업 브랜치를 생성합니다:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. 명확하고 간결한 커밋 메시지와 함께 작업 내용을 커밋합니다.
3. `npm test`를 실행하여 모든 테스트가 통과하는지 확인합니다.
4. PR을 생성하고 변경 사유와 테스트 내역을 기술합니다.
