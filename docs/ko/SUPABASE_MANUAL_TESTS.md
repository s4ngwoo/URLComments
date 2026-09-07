# Supabase DB 및 RLS 수동 검증 가이드 (Manual Tests)

🌍 [English](../SUPABASE_MANUAL_TESTS.md) | [한국어](SUPABASE_MANUAL_TESTS.md) | [日本語](../ja/SUPABASE_MANUAL_TESTS.md) | [中文](../zh/SUPABASE_MANUAL_TESTS.md) | [Español](../es/SUPABASE_MANUAL_TESTS.md)

---

## 1. RLS 검증의 본질과 SQL Editor의 한계

> [!CAUTION]
> **Supabase SQL Editor에서는 RLS가 온전히 검증되지 않습니다.**
> 1. **슈퍼유저 권한 (`BYPASSRLS`)**: SQL Editor는 기본적으로 `postgres` 관리자 역할로 쿼리를 실행하므로, 테이블의 RLS 정책을 무시합니다.
> 2. **세션 역할 전환의 한계**: `set_config('role', 'authenticated', true)`를 사용하더라도 Postgres 상위 세션 권한의 영향을 완벽히 배제할 수 없습니다.
> 3. **외래키(FK) 제약**: `comments.author_id` 및 `reported_comments.reporter_id`는 `auth.users(id)`를 참조하므로 가짜 UUID로 INSERT를 시도하면 RLS 검증에 도달하기 전에 외래키 위반 에러로 중단됩니다.
>
> **따라서 신뢰할 수 있는 RLS 검증은 실제 발급된 JWT 토큰을 가진 두 개의 사용자 계정(User A, User B)을 통해 Chrome Extension UI 또는 클라이언트 SDK로 수행해야 합니다.**

---

## 2. 권장 테스트 환경 준비 (2계정 테스트)

- **테스터 준비**: 두 개의 서로 다른 Google 계정 (예: `User A`, `User B`)
- **브라우저 설정**: 
  - 일반 창에서 `User A`로 로그인
  - 시크릿 창(또는 별도 Chrome Profile)에서 `User B`로 로그인
- **대상 URL**: 동일한 테스트 페이지 (예: `https://example.com/test-page`)

---

## 3. 기능별 E2E 수동 검증 체크리스트

| 번호 | 검증 시나리오 | 수행 계정 | 예상 결과 | 판정 |
|---|---|---|---|---|
| **1** | **프로필 생성 및 Public ID 발급** | User A | 최초 로그인 시 `display_name`과 canonical `@...` 형태의 고유 ID가 정상 생성되고 UI에 노출됨 | [ ] |
| **2** | **댓글 작성** | User A | 댓글 본문 입력 후 등록 시 목록에 즉시 추가되며, DB `comments` 테이블에 `author_id = User A UUID`, `is_deleted = false`로 저장됨 | [ ] |
| **3** | **본인 댓글 수정** | User A | `[수정]` 버튼 클릭 ➡️ 인라인 에디터에서 수정 ➡️ 저장 시 `(수정됨)` 라벨이 나타나고 본문이 정상 반영됨 | [ ] |
| **4** | **타인 댓글 수정/삭제 차단** | User B | User A의 댓글에 `[수정]`, `[삭제]` 버튼이 아예 렌더링되지 않음. (API를 통한 강제 UPDATE 시 RLS에 의해 거부됨) | [ ] |
| **5** | **타인 정상 댓글 신고** | User B | User A의 댓글에서 `[🚨 신고]` 클릭 ➡️ 확인창 승인 ➡️ 정상 접수 알럿 후 버튼이 `[✅ 신고 접수됨]`으로 비활성화됨 | [ ] |
| **6** | **동일 댓글 중복 신고 차단** | User B | 이미 신고한 댓글에 대해 다시 신고 시도(또는 API 직접 호출) 시 `이미 신고한 댓글입니다.` 알럿 발생 (DB `23505` Unique 제약 방어) | [ ] |
| **7** | **자기 댓글 신고 차단** | User A | 본인 댓글에는 `[🚨 신고]` 버튼이 노출되지 않음. (API를 통한 강제 INSERT 시 `Cannot report your own comment.` 트리거 예외 발생) | [ ] |
| **8** | **투표 토글 및 카운트 정확성** | User B | 👍 클릭 시 `like_count` +1 및 활성화 ➡️ 한 번 더 클릭 시 취소되어 -1 (0 미만으로 내려가지 않음) ➡️ 👎 클릭 시 `dislike_count` +1 정상 반영 | [ ] |
| **9** | **본인 댓글 Soft Delete** | User A | `[삭제]` 클릭 후 승인 ➡️ 댓글 목록에서 즉시 사라짐. (DB상에서는 `is_deleted = true`로 보존) | [ ] |
| **10** | **삭제된 댓글 일반 조회 숨김** | User B | 목록 새로고침 시 삭제된 User A의 댓글이 전혀 노출되지 않음 (`comments_select_public` RLS에 의해 원천 배제) | [ ] |
| **11** | **삭제된 댓글 투표/신고 차단** | User B | (API 직접 호출 시) 삭제된 댓글 ID로 투표나 신고를 시도하면 DB 트리거에 의해 `Cannot vote on a deleted comment.`, `Cannot report a deleted comment.` 예외 발생 | [ ] |

---

## 4. 오류 발생 시 기록 양식 (Incident Report)

테스트 또는 마이그레이션 중 오류가 발생할 경우 아래 양식에 맞춰 정보를 기록하고 검토하세요.

```text
==================================================
[URLComments Migration/Test Error Report]
==================================================
1. 발생 위치: [Migration 파일 번호 (예: 003_comment_votes.sql) 또는 UI 수동 테스트]
2. 수행 계정: [User A / User B / SQL Editor]
3. Supabase Error Code: [예: 23505, 42501, PGRST116 등]
4. Error Message: [전체 에러 메시지 원문]
5. 실행한 쿼리 또는 액션: [수행한 SQL 또는 클릭한 버튼]
6. 현재 테이블 상태 확인 결과:
   - SELECT count(*) from comments;
   - SELECT count(*) from comment_votes;
==================================================
```
