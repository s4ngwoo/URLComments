# I18n Expansion Plan

## 1. 현재 언어 선택 방식
URLComments의 UI 언어는 사용자의 Chrome UI 언어를 기준으로 선택됩니다.
- 코드 내부에서 `chrome.i18n.getMessage()`를 호출하고, HTML에서는 `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria-label` 속성을 사용하여 `_locales/<locale>/messages.json` 구조의 번역 값을 가져옵니다.
- 확장 프로그램 내에서 언어를 강제로 선택하거나 덮어쓰는 별도의 UI나 로직은 없습니다.

## 2. locale fallback 동작
- `manifest.json`의 `default_locale`이 `en`으로 설정되어 있어, 최종 fallback 언어는 영어입니다.
- 사용자의 Chrome 설정 언어에 해당하는 번역 파일이 없을 경우 다음과 같은 Chrome 자체 fallback 순서가 적용됩니다.
  1. 정확한 지역 locale (예: `es_MX`)
  2. 일반 언어 locale (예: `es`)
  3. `default_locale` (`en`)
- 예시:
  - `es_MX` → `es` (파일 없음) → `en` 표시
  - `zh_CN` → `zh` (파일 없음) → `en` 표시
  - `ja` → `en` 표시 (ja 파일이 없을 때)

## 3. 현재 i18n 파일 및 key 적용 상태
- **manifest.json 설정:** `"default_locale": "en"`
- **디렉터리 구조:** `_locales/` 내에 `en`, `ko` 폴더만 존재합니다.
- **번역 키 구조:** `_locales/en/messages.json` 및 `_locales/ko/messages.json`은 `appName`, `appDesc`, 로그인/로그아웃, 오류 메시지, UI 라벨 등 동일한 key 구조(약 60여 개)를 온전히 갖추고 있습니다.
- **HTML/JS 적용:** `popup.html` 및 모든 `.js` 파일에서 사용자 노출 문구 처리를 위해 i18n API 및 속성(`data-i18n` 등)을 올바르게 적용 중입니다.

## 4. 발견된 하드코딩 사용자 문구 목록
현재 소스 코드 상에 명시적으로 하드코딩된 의미 있는 문구는 없습니다. 단, 다음과 같은 숫자 및 기호 관련 요소만 하드코딩(또는 JS 동적 할당)되어 있습니다.
- `<span id="char-count">0 / 1000</span>`
- `<span id="display-name-count">0 / 30</span>`
- `<span id="current-url">-</span>`
- `<span id="user-avatar">👤</span>`
그 외 사용자 문구는 모두 `data-i18n` 속성을 통해 처리됩니다.

## 5. 일본어/중국어/스페인어 지원 계획
향후 글로벌 사용자 대응을 위해 아래 4가지 번역을 추가할 계획입니다.
```text
_locales/ja/messages.json
_locales/zh_CN/messages.json
_locales/zh_TW/messages.json
_locales/es/messages.json
```

**우선순위:**
1. Japanese: `ja`
2. Chinese Simplified (간체): `zh_CN`
3. Chinese Traditional (번체): `zh_TW`
4. Spanish: `es`

*주의: 중국어는 `zh_CN`과 `zh_TW`를 별도 언어로 분리하여 관리해야 하며, 단순 문자 변환 도구로 일괄 대체하지 않고 지역별 관용구를 반영합니다.*

## 6. 번역 대상과 번역하지 않을 대상

**번역 대상 (사용자 노출 UI):**
- manifest name / description
- 로그인, 로그아웃, 새로고침, 게시, 저장, 취소
- 로딩 중, 빈 댓글, 미지원 URL, 새로고침 필요 상태 안내문
- SPA notice
- 댓글 정렬 옵션 (최신순, 좋아요순 등)
- 좋아요/싫어요 UI
- 계정 메뉴, 표시 이름, public ID 라벨
- tooltip, modal, aria-label 등 접근성 문자열
- 오류 메시지와 안내 문구

**번역하지 않고 원문을 유지할 대상:**
- **Public ID**: (예: `@longface-hippo-at-mars-7K2M9`) 모든 언어 UI에서 영문 canonical identifier 그대로 유지.
- URL 문자열
- Crockford Base32 suffix (ID 뒷자리)
- 데이터베이스 필드명
- 코드 상수 (Constants)
- 사용자가 작성한 댓글 내용
- 사용자가 설정한 표시 이름 (Display Name)

## 7. 향후 구현 계획 (단계별)

1. 영어(`en`) `messages.json`을 Source of Truth(기준점)로 확정.
2. 코드 전체에서 i18n key를 자동 수집하고, 추가된 하드코딩 문구가 없는지 검토.
3. `en`을 기준으로 다른 locale 파일의 key 누락 여부를 검사하는 테스트 코드 또는 Node 스크립트 설계.
4. `ja` 번역 추가 및 Side Panel 렌더링 검수 (글자 길이에 따른 줄바꿈 확인).
5. `zh_CN`, `zh_TW` 개별 추가 및 검수.
6. `es` 추가 (라틴어계 긴 문자열로 인한 레이아웃 깨짐 확인).
7. **GitHub Actions CI 통합:**
   - JSON 문법 검증.
   - locale key consistency 검사 (기준 언어 대비 누락 키 확인).
   - 누락 시 CI Test Fail 처리.
8. **Chrome UI 언어별 수동 검증:**
   - 브라우저 언어를 `ko`, `en`, `ja`, `zh_CN`, `zh_TW`, `es`로 직접 변경하여 최종 UI 점검.
