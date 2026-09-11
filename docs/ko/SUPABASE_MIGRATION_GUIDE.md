# Supabase DB 마이그레이션 실행 가이드

🌍 [English](../SUPABASE_MIGRATION_GUIDE.md) | [한국어](SUPABASE_MIGRATION_GUIDE.md) | [日本語](../ja/SUPABASE_MIGRATION_GUIDE.md) | [中文](../zh/SUPABASE_MIGRATION_GUIDE.md) | [Español](../es/SUPABASE_MIGRATION_GUIDE.md)

---

## 1. 개요 및 적용 대상 기능

본 마이그레이션 세트를 적용하면 다음 기능이 DB 레벨에서 안전하게 지원됩니다:

1. **Comments 기본 기능**: URL 기준 공개 댓글 조회, 작성자 본인 인증, 본문 제약(1~1000자).
2. **사용자 정체성 (Public Identity)**: `public.profiles` 테이블을 통한 `display_name` 및 canonical `@adjective-noun-preposition-place-XXXXX` 공개 ID 관리.
3. **투표 (Comment Votes)**: 댓글당 1인 1표(like/dislike), `comments.like_count`/`dislike_count` 자동 캐시 집계, 음수 방어.
4. **댓글 수정 및 Soft Delete 방어**: 본인 외 수정 차단, 불변 필드 강제 보존, 삭제 댓글 복구 금지, 투표 수 조작 차단.
5. **신고 (Reported Comments)**: 본인 댓글 신고 금지, 삭제된 댓글 신고 금지, 중복 신고 원천 차단 (`23505`), Append-only 보장.

---

## 2. 보안 주의사항 (API Key & Service Role)

> [!CAUTION]
> **API 키 취급 원칙**
> - Chrome Extension 클라이언트(`lib/config.js` 등)에는 반드시 **`SUPABASE_URL`**과 **`SUPABASE_ANON_KEY`**만 사용해야 합니다.
> - **`SERVICE_ROLE_KEY`**는 모든 RLS를 우회하는 마스터 키이므로 **절대로 프런트엔드 코드, manifest, git 커밋에 포함해서는 안 됩니다.**

---

## 3. 사전 점검 및 백업 (Migration 전 필수)

마이그레이션 스크립트를 실행하기 전, 현재 Supabase 프로젝트의 상태를 점검하고 데이터를 백업하세요.

### 3-1. 현재 데이터 수 및 상태 점검 (Read-Only)
Supabase Dashboard ➡️ **SQL Editor**를 열고 아래 쿼리를 실행하여 현재 상태를 확인합니다.

```sql
-- 1. comments 기존 데이터 건수 확인
select count(*) as comment_count from public.comments;

-- 2. 관련 테이블 컬럼 및 데이터 타입 확인
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by table_name, ordinal_position;

-- 3. 활성화된 RLS 정책 확인
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by tablename, policyname;

-- 4. 등록된 트리거 확인
select event_object_table, trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by event_object_table, trigger_name;
```

### 3-2. 데이터 백업 권장 절차
기존에 입력된 댓글 데이터가 중요한 경우, 마이그레이션 전 백업을 수행하세요:
- **방법 1 (간편 백업)**: Supabase Dashboard ➡️ **Table Editor** ➡️ `comments` 테이블 선택 ➡️ 우측 상단 `Export data as CSV` 클릭하여 다운로드.
- **방법 2 (CLI 백업)**: Supabase CLI가 연동되어 있다면 `supabase db dump -f backup_before_migration.sql` 실행.

---

## 4. `author_id` 타입 관련 주의사항 (UUID vs Text)

URLComments 프런트엔드는 Supabase Auth의 `session.user.id` (UUID 형식)를 `author_id`로 사용합니다.

### 상태 확인 쿼리
```sql
select column_name, data_type 
from information_schema.columns 
where table_schema = 'public' and table_name = 'comments' and column_name = 'author_id';
```

- **경우 A**: `data_type = 'uuid'`인 경우 ➡️ 정상 상태입니다. 추가 조치 없이 다음 단계로 진행하세요.
- **경우 B**: 과거 초기 프로토타입 생성으로 인해 `author_id`가 `text`로 되어 있는 경우:
  - **자동 파괴적 변경 금지**: 기존 댓글 데이터에 잘못된 문자열이 들어있을 수 있으므로 마이그레이션에서 강제로 타입을 변경하지 않습니다.
  - **변환 가능 여부 사전 검사**:
    ```sql
    -- 모든 기존 author_id가 올바른 UUID 형식인지 검증
    select id, author_id 
    from public.comments 
    where author_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ```
  - 위 쿼리 결과가 0건(모두 UUID 형식)이고 데이터 백업이 완료된 경우에 한해, 아래 명령으로 수동 변환할 수 있습니다:
    ```sql
    -- (주의: 백업 확인 후 수동 실행)
    alter table public.comments 
      alter column author_id type uuid using author_id::uuid;
      
    alter table public.comments 
      add constraint fk_comments_author foreign key (author_id) references auth.users(id) on delete cascade;
    ```

---

## 5. 단계별 마이그레이션 실행 순서

> [!IMPORTANT]
> **단일 통합 파일(`supabase_schema.sql`)을 한 번에 실행하지 마세요.**  
> `supabase/migrations/` 디렉터리에 분리된 5개의 마이그레이션 파일을 **번호 순서대로 한 파일씩** Supabase SQL Editor에 복사하여 실행합니다.

### 🛑 중단 원칙 (Stop-on-Error)
- 특정 migration 파일 실행 중 에러가 발생하면, **절대로 다음 번호 파일로 넘어가지 마십시오.**
- 에러 코드와 메시지를 기록하고 원인을 파악한 뒤 해결해야 합니다.
- 모든 스크립트는 `IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`를 사용하여 작성되었으므로 안전하게 재실행 가능(Idempotent)합니다.

---

### Step 1: `supabase/migrations/001_comments_baseline.sql`
- **역할**: `user_profiles`(스팸 필터) 테이블 생성, `comments` 테이블 컬럼 보정(`updated_at`, `is_deleted`, 투표 캐시 컬럼), 조회 성능 인덱스 생성, 기본 RLS 정책 등록.
- **실행**: SQL Editor에서 전체 복사 후 `Run`.
- **성공 확인**: 에러 없이 `Success. No rows returned` 출력.

### Step 2: `supabase/migrations/002_profiles_public_identity.sql`
- **역할**: `public.profiles` 테이블 생성, `display_name`(1~30자) 및 `public_id`(Crockford Base32 정규식) 제약조건 추가, RLS 정책 적용, `updated_at` 갱신 트리거 생성.
- **실행**: SQL Editor에서 전체 복사 후 `Run`.
- **성공 확인**: `profiles` 테이블 및 관련 제약조건 생성 완료.

### Step 3: `supabase/migrations/003_comment_votes.sql`
- **역할**: `comment_votes` 테이블 생성, 1인 1표 RLS 및 Unique 제약조건 적용, 삭제된 댓글 투표 방어 트리거 등록, 투표 수 캐시(`like_count`/`dislike_count`) 자동 집계 함수 등록(음수 방지 및 `security definer`).
- **실행**: SQL Editor에서 전체 복사 후 `Run`.
- **성공 확인**: `comment_votes` 관련 트리거 4개 정상 등록.

### Step 4: `supabase/migrations/004_comment_moderation.sql`
- **역할**: `reported_comments` 테이블 생성, 자기 댓글 및 삭제 댓글 신고 차단 트리거 등록, `comments` 테이블의 수정/Soft Delete 상태 전이 방어 트리거(`update_comments_before_update`) 등록.
- **핵심 아키텍처**: 투표 갱신 트리거와 충돌하지 않도록 `app.is_vote_count_update` 플래그를 인식하여 투표 시 불필요한 `updated_at` 갱신 및 `like_count` 덮어쓰기 버그를 방지합니다.
- **실행**: SQL Editor에서 전체 복사 후 `Run`.
- **성공 확인**: 신고 테이블 및 comments 수정 방어 트리거 등록 완료.

### Step 5: `supabase/migrations/005_verify_schema.sql`
- **역할**: 전체 스키마, 컬럼 타입, 제약조건, RLS 활성화 여부, 트리거 등록 상태를 점검하는 **Read-Only 검증 쿼리**.
- **실행**: SQL Editor에서 전체 복사 후 `Run`.
- **성공 확인**: 각 결과 그리드에서 5개 테이블(`comments`, `profiles`, `comment_votes`, `reported_comments`, `user_profiles`)이 모두 정상 표시되는지 확인.

### Step 8: `supabase/migrations/008_zero_trust_soft_delete_rpc.sql`
- **역할**: RLS post-UPDATE SELECT 충돌을 우회하는 SECURITY DEFINER `soft_delete_comment` RPC 추가.
- **실행**: SQL Editor에서 전체 복사 후 `Run`. 이미 적용된 프로젝트는 Step 9로 진행.

### Step 9: `supabase/migrations/009_fix_soft_delete_anon_bypass.sql` **(008을 이미 실행한 운영 DB에서 필수)**
- **역할**: 비인증 소프트 삭제 구멍을 닫습니다. PostgreSQL은 새 함수 EXECUTE를 PUBLIC에 기본 부여하고, `author_id <> auth.uid()`는 `auth.uid() IS NULL`(anon)일 때 거부 분기에 들어가지 않습니다.
- **실행**: SQL Editor에서 전체 복사 후 `Run`. 멱등 (`CREATE OR REPLACE` + `REVOKE`/`GRANT`).

---

## 6. 롤백 원칙 (Rollback Policy)

> [!CAUTION]
> **운영 중인 DB에서 자동 DROP TABLE 방식의 롤백은 금지합니다.**

- 마이그레이션 실패 시, 테이블을 무작정 `DROP`하지 말고 발생한 에러 메시지를 기록하세요.
- 각 migration 스크립트는 멱등성(Idempotent)을 보장하므로, 에러 원인을 조치한 후 해당 번호의 마이그레이션 스크립트를 그대로 다시 실행하시면 됩니다.
- 롤백이 반드시 필요한 경우, 백업해둔 CSV 데이터를 사용하거나 테이블 데이터를 보존한 채 트리거/정책만 개별 `DROP TRIGGER`, `DROP POLICY`로 안전하게 롤백해야 합니다.
