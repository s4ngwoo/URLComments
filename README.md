# 💬 URLComments (보물찾기 같은 숨은 댓글)

모든 웹 페이지에 나만의 댓글을 남기고, 다른 사람들이 남긴 숨겨진 댓글을 찾아볼 수 있는 크롬 확장 프로그램입니다. 특정 기사, 블로그, 쇼핑몰 상품 페이지 등 어디서든 URL을 기반으로 소통할 수 있습니다. 마치 인터넷 곳곳에 숨겨진 보물을 찾는 듯한 경험을 선사합니다.

## 1. 프로젝트 소개
- **서비스 컨셉:** URL을 기반으로 "이 페이지에 누가 어떤 글을 남겼을까?"를 확인하고 나만의 흔적을 남길 수 있는 소셜 주석 도구.
- **MVP 기능:** 
  - Google 계정을 이용한 간편 로그인 (OAuth)
  - 현재 보고 있는 페이지(URL)에 작성된 댓글 실시간 조회
  - 나만의 댓글 작성 (최대 1000자)
  - 미지원 페이지(`chrome://` 등) 예외 처리
- **타겟 사용자:** 특정 웹 페이지에 대한 생각이나 유용한 팁을 다른 사람들과 공유하고 싶은 누구나 (Google 계정만 있으면 OK).

## 2. 기술 스택
- **프론트엔드 (Extension):** HTML, Vanilla CSS, Vanilla JavaScript (Chrome Extension Manifest V3)
- **백엔드 (BaaS):** Supabase (PostgreSQL, Row Level Security 적용)
- **인증:** Supabase Auth (Google OAuth Provider), Chrome Identity API
- **향후 계획:** 트래픽 증가 및 스케일링을 대비하여 **Cloudflare Workers (API) + D1 (DB)** 조합으로 마이그레이션 예정

## 3. 프로젝트 구조
```text
URLComments/
├── manifest.json          # Chrome Extension 설정 (권한, 버전, 백그라운드 스크립트 등)
├── popup/
│   ├── popup.html         # 확장 프로그램 클릭 시 나타나는 메인 UI
│   ├── popup.css          # 팝업 UI 스타일링
│   └── popup.js           # 팝업의 핵심 비즈니스 로직 (DOM 제어, Supabase 통신)
├── lib/
│   ├── supabase.js        # Supabase 공식 UMD 번들 라이브러리 (로컬 캐싱)
│   ├── supabaseClient.js  # Supabase 초기화 및 Chrome Storage 어댑터 설정
│   └── config.js          # (git ignore 됨) API 키 등 환경변수 분리 파일
├── utils/
│   └── urlHelper.js       # URL 정규화 로직 (해시 제거, 소문자 변환 등)
└── supabase_schema.sql    # DB 테이블 생성 및 RLS 정책 쿼리 모음
```

## 4. 설정 가이드 (Getting Started)

이 프로젝트를 로컬에서 실행하고 테스트하려면 다음 단계를 따르세요.

### Step 1: Supabase 프로젝트 생성 및 DB 설정
1. [Supabase](https://supabase.com)에 회원가입 후 새로운 프로젝트를 생성합니다.
2. 대시보드의 **SQL Editor**로 이동하여 `supabase_schema.sql`의 모든 내용을 붙여넣고 실행(Run)합니다. (테이블 생성 및 RLS 권한 부여)

### Step 2: Google OAuth 설정
1. **Google Cloud Console**에서 새 프로젝트를 만들고 'OAuth 동의 화면'을 구성합니다.
2. '사용자 인증 정보(Credentials)'에서 **웹 애플리케이션**용 OAuth 2.0 클라이언트 ID를 생성합니다.
3. 승인된 리디렉션 URI에 `https://<YOUR_SUPABASE_ID>.supabase.co/auth/v1/callback`을 추가합니다.
4. 발급받은 Client ID와 Client Secret을 Supabase 대시보드(Authentication -> Providers -> Google)에 입력하고 활성화합니다.

### Step 3: Chrome Extension 설정
1. Chrome 브라우저에서 `chrome://extensions/`에 접속합니다.
2. '개발자 모드'를 켜고 **[압축해제된 확장 프로그램을 로드합니다]**를 클릭해 이 프로젝트 폴더를 선택합니다.
3. 할당된 확장 프로그램 ID를 복사합니다.

### Step 4: 환경변수 및 Redirect URI 등록
1. Supabase 대시보드 (Authentication -> URL Configuration -> Redirect URLs)에 `https://<EXTENSION_ID>.chromiumapp.org/`를 추가합니다.
2. 프로젝트의 `lib/config.example.js`를 복사하여 `lib/config.js`를 만듭니다.
3. Supabase 대시보드(Project Settings -> API)에서 **Project URL**과 **anon key**를 복사해 `lib/config.js`에 입력합니다.

## 5. 테스트 체크리스트

- [ ] **확장 프로그램 로드:** `chrome://extensions`에서 오류 없이 로드되었는가?
- [ ] **미지원 페이지 처리:** `chrome://`이나 빈 탭에서 팝업을 열었을 때 "지원을 안 하는 페이지입니다" 문구가 뜨는가?
- [ ] **로그인:** 구글 로그인 버튼 클릭 시 팝업이 뜨고 성공적으로 프로필(이메일)이 렌더링되는가?
- [ ] **댓글 작성/조회:** 특정 웹사이트(예: google.com)에서 댓글을 작성하면 즉시 리스트에 반영되고, 브라우저를 껐다 켜도 데이터가 유지되는가?
- [ ] **URL 정규화:** 끝에 슬래시(`/`)가 붙은 주소와 안 붙은 주소가 동일한 페이지로 취급되는가?

## 6. 에러 진단 가이드

테스트 중 문제가 발생했다면 아래 시나리오를 점검해 보세요.

1. **로그인 후 다시 로그인 화면으로 돌아옴**
   - **증상:** 로그인 팝업이 닫힌 후에도 로그인이 되지 않음.
   - **점검 항목:** `lib/config.js`의 API 키 오타 여부 / Supabase에 Extension Redirect URI가 정확히 등록되었는지 / Chrome 콘솔(팝업 우클릭 -> 검사) 에러 확인.
   - **해결 방법:** URL Configuration에 `https://<EXTENSION_ID>.chromiumapp.org/` 가 등록되어 있는지 재확인하세요.
2. **댓글 조회 실패 (에러 배너 표시)**
   - **증상:** 로그인 후 에러 배너("댓글을 불러오지 못했습니다")가 뜸.
   - **점검 항목:** `comments` 테이블 존재 여부 / RLS 정책 유무.
   - **해결 방법:** SQL Editor에서 `GRANT SELECT ON TABLE comments TO anon, authenticated;` 쿼리를 실행해 권한을 부여하세요.
3. **댓글 작성 실패 (등록 버튼 클릭 후 에러)**
   - **증상:** "permission denied for table comments" 에러 발생.
   - **점검 항목:** INSERT 권한 누락 또는 RLS 정책(작성자 본인 검증) 실패.
   - **해결 방법:** `GRANT INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;` 쿼리를 실행하세요.
4. **미지원 페이지에서 URL 바가 보임**
   - **증상:** 로컬 파일(`file://`) 등에서 URL이 표시되고 댓글 작성이 가능함.
   - **해결 방법:** `utils/urlHelper.js`의 `isSupportedUrl` 함수에서 `http://`, `https://` 외의 스킴을 엄격히 차단하도록 로직을 점검하세요.

## 7. 확장 기능 Roadmap (Post-MVP)

MVP 릴리즈 이후 고도화할 핵심 기능들입니다.

| 기능 | 우선순위 | 필요 작업 | 비고 |
| :--- | :---: | :--- | :--- |
| **댓글 수정/삭제** | **High** | 1. `UPDATE`, `DELETE` RLS 정책 추가<br>2. UI에 본인 댓글 전용 수정/삭제 버튼 추가 | 기본 CRUD 완성을 위한 필수 기능 |
| **대댓글 (스레드)** | **Medium** | 1. `parent_id` (자기 참조 FK) 컬럼 추가<br>2. UI 들여쓰기 렌더링 적용 | 유저 간 상호작용 및 커뮤니티 활성화 |
| **도메인 제한** | **Medium** | 1. 허용/차단 도메인 목록(DB) 관리<br>2. 클라이언트 URL 체크 로직 고도화 | 스팸 방지 및 특정 서비스 전용 피벗 시 유용 |
| **알림 (Notification)** | **Low** | 1. `notifications` 테이블 설계<br>2. Background Service Worker에서 알림 뱃지 업데이트 | 재방문율(Retention) 증가 목적 |
| **Workers+D1 이전** | **Low** | 1. API(REST)를 Cloudflare Workers로 이전<br>2. DB를 D1으로 마이그레이션 | 트래픽 급증 시 DB 비용 절감 및 엣지 캐싱 |

## 8. Chrome Web Store 프라이버시 설명

웹 스토어 제출 시 참고할 수 있는 프라이버시(Privacy) 관련 가이드라인입니다.
- **데이터 수집 최소화:** 본 확장 프로그램은 댓글 기능 제공을 위해 현재 활성화된 탭의 **URL 정보**와 인증을 위한 **기본 프로필(이메일, 이름)**만을 수집합니다.
- **권한(Permissions) 사용 목적:**
  - `activeTab`: 사용자가 버튼을 클릭했을 때 현재 탭의 URL을 가져오기 위해 사용.
  - `storage`: 로그인 세션 유지를 위한 토큰 임시 저장 목적.
  - `identity`: Google OAuth 로그인(launchWebAuthFlow) 처리에 사용.
- **데이터 관리:** 모든 데이터는 외부 백엔드(Supabase)에 암호화되어 안전하게 보관되며, 사용자는 언제든 로그아웃하거나 자신의 계정을 통해 연동을 해제할 수 있습니다.

## 9. 라이선스 및 기여

본 프로젝트는 토이 프로젝트 목적으로 제작된 동작하는 MVP입니다. 누구나 자유롭게 포크하여 수정하고 사용할 수 있습니다. 버그 제보나 PR(Pull Request)은 언제든 환영합니다!
