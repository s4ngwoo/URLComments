# Future Monetization and Avatar System Plans

This document outlines the internal product decisions, privacy principles, and cost constraints regarding the future monetization, avatar system, and auto-refresh features for URLComments.

## 1. Image Upload Policy

- **사용자 임의 이미지 업로드**: 제공하지 않음 (Not provided)
- **사용자 임의 프로필 사진 업로드**: 제공하지 않음 (Not provided)
- **댓글 이미지 첨부**: 현재 제공하지 않음 (Not currently available)
- **외부 이미지 URL 렌더링**: 제공하지 않음 (Not provided)
- **base64 이미지 저장**: 제공하지 않음 (Not provided)

### Reason for Policy (정책 사유)
- 불법·유해 콘텐츠 업로드 위험
- 저작권, 초상권, 개인정보 문제
- 악성 파일 및 외부 추적 이미지 위험
- 이미지 신고, 삭제, 차단, 운영 인력 부담
- Storage, CDN egress, 모더레이션 비용 증가
- 현재 토이프로젝트/MVP의 운영 범위를 넘는 복잡도

## 2. Pre-vetted Avatar System (사전 검수형 아바타 정책)

URLComments는 사용자가 업로드한 이미지를 사용하지 않는다.
대신 운영자가 사전 검수한 정적 아바타 catalog만 제공하는 방향을 검토한다.
사용자는 catalog에 있는 아바타 중 하나를 선택할 수 있다.

### Design Direction (설계 방향)
- 프로필 DB에는 이미지 URL이 아니라 `avatar_id`만 저장
- 아바타 파일은 확장 프로그램 내부 asset 또는 운영자가 통제하는 정적 asset으로 제공
- 클라이언트는 `avatar_id`를 미리 정의된 `AVATAR_CATALOG`에서만 조회
- catalog 밖의 값은 기본 아바타로 fallback
- 사용자 입력값으로 이미지 경로, 외부 URL, 파일 경로를 구성하지 않음
- 사용자가 임의 파일, base64 데이터, 외부 이미지 URL을 저장하거나 렌더링하지 않음

**Example Code:**
```js
const AVATAR_CATALOG = {
  'default-comment-bubble': {
    tier: 'free',
    label: 'Comment Bubble'
  },
  'default-blue-hippo': {
    tier: 'free',
    label: 'Blue Hippo'
  },
  'space-hippo-01': {
    tier: 'premium',
    label: 'Space Hippo'
  }
};
```

## 3. Auto-Refresh Policy (자동 새로고침 보류)

URLComments는 사용자의 명시적인 수동 새로고침 동작이 있을 때만 현재 페이지 URL을 확인하고 댓글을 조회합니다.
탭 전환, 페이지 이동, 페이지 로드, 백그라운드 실행만으로 현재 URL을 자동 조회하거나 서버로 전송하지 않습니다.

URLComments checks the current page URL and loads comments only when you explicitly request a refresh. It does not automatically send URLs or fetch comments when you switch tabs, navigate pages, or browse in the background.

### Why Auto-Refresh is Withheld (자동 새로고침 보류 사유)

**프라이버시 (Privacy)**
- URLComments의 핵심 원칙은 사용자가 직접 요청할 때만 현재 URL을 서버로 보내는 것
- 자동 새로고침은 사용자가 웹을 탐색하는 동안 URL을 반복적으로 서비스 서버에 전달할 수 있음
- 탭 이동 및 페이지 이동 시 자동으로 새 URL을 확인하는 방식은 브라우징 활동 추적처럼 보일 수 있음
- Chrome Web Store의 권한 및 사용자 데이터 고지 관점에서 설명과 심사가 복잡해질 수 있음
- 사용자가 자동 갱신을 켰는지, 어느 URL에서 켰는지, 언제 해제할 수 있는지 명확한 UX가 필요함

**비용과 운영 (Cost & Operation)**
- 일정 주기 polling은 댓글이 없는 URL에도 반복적인 DB/API 요청을 발생시킴
- Supabase 무료 티어 및 초기 운영 환경에서 불필요한 요청 비용과 리소스 사용량이 증가할 수 있음
- 많은 사용자가 자동 갱신을 켜면 DB read, 네트워크 egress, 백그라운드 작업량이 빠르게 늘어날 수 있음
- 탭 활성/비활성 상태, Side Panel 열림 여부, 브라우저 절전 상태, 오류 재시도 등 추가 상태 관리가 필요함

**제품 원칙 (Product Principles)**
- 현재 서비스의 “보물찾기” 컨셉은 사용자가 아이콘 또는 새로고침을 눌러 댓글 존재를 발견하는 경험과 잘 맞음
- 자동 갱신은 편의성을 높일 수 있지만, 숨은 댓글을 발견하는 현재의 의도적 경험과 비용 최소화 원칙을 약화할 수 있음
- 실제 사용자가 자동 갱신을 반복적으로 요구하는지 확인되기 전까지 구현하지 않음

## 4. Conditions to Reconsider Auto-Refresh (자동 새로고침 재검토 조건)

자동 새로고침은 완전히 금지된 기능이 아니라, 아래 조건이 충족되고 사용자 수요가 확인될 경우에만 재검토한다.
**자동 새로고침은 프리미엄 기능 후보일 수 있으나, 현재 제품 로드맵에서 구현 확정 기능은 아니다.**

- 실제 사용자 수요 검증
- 명시적인 opt-in UI
- 기본값 OFF
- 특정 URL 단위로만 활성화
- 탭 이동만으로 새로운 URL을 자동 구독하지 않음
- 현재 탭이 활성 상태이고 Side Panel이 열린 경우에만 동작
- 요청 간격 최소 5분 이상
- 자동 새로고침 활성 상태를 UI에 명확히 표시
- 사용자가 언제든 즉시 끌 수 있음
- URL 또는 자동 갱신 설정을 서버에 저장한다면 명확한 개인정보 고지
- 요청 수, 오류율, 비용을 모니터링할 수 있는 구조
- Chrome Web Store 권한 설명과 Privacy Policy 갱신

## 5. Free and Premium Tier Concepts (무료 및 프리미엄 구상)

**가격, 구독 모델, 일회성 구매 모델은 실제 사용자 수요와 결제/운영 비용을 검증한 뒤 결정한다.**
향후 결제 도입 전에는 entitlement/feature flag 구조를 우선 설계하고, 실제 결제 연동은 사용자 수요가 확인된 뒤 진행한다.

### Free (무료)
- 텍스트 댓글
- 수동 새로고침
- 표시 이름
- 랜덤 public ID
- 기본 무료 아바타
- 좋아요/싫어요
- 댓글 정렬

### Supporter / Plus (구독 후보)
- Supporter 배지
- 프리미엄 아바타팩 이용
- 새 아바타팩 조기 접근
- 향후 편의 기능
- 자동 새로고침은 위의 프라이버시 조건을 충족할 경우에만 후보로 검토

### One-time Purchase (일회성 구매 후보)
- 사전 검수된 테마형 아바타팩
- Space Hippo Pack
- Weird Food Pack
- Tiny Monsters Pack
- Hidden Commenter Pack
- Seasonal Pack

## 6. Withholding Comment Images (댓글 이미지 첨부 보류 사유)

**댓글 이미지 첨부는 현재 보류한다.**

댓글 이미지 첨부는 사전 검수형 아바타와 별개인 고위험 기능이므로, 아래 조건이 갖춰지고 유료 가격과 운영 구조가 지속 가능하다고 검증되기 전에는 댓글 이미지 업로드를 구현하지 않는다.

- 댓글 수정/삭제 기능
- 신고 기능
- 관리자 삭제/차단 기능
- 콘텐츠 가이드라인
- 스토리지 한도
- 업로드 파일 검증
- 이미지 모더레이션 정책
- 저작권/초상권 대응 절차
- 비용 모니터링
- 지속 가능한 유료 가격 및 운영 구조 검증
