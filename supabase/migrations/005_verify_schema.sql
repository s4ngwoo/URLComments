-- ====================================================================
-- Migration: 005_verify_schema.sql
-- Description: 배포 후 DB 스키마, 제약조건, RLS, 함수, 트리거 정합성 검증 (Read-Only)
-- 주의: 본 스크립트는 어떠한 데이터도 추가/수정/삭제하지 않습니다.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. 필수 테이블 존재 여부 확인
-- 기대 결과: comments, profiles, comment_votes, reported_comments, user_profiles 5개 테이블 조회
-- --------------------------------------------------------------------
select 
  table_schema, 
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by table_name;


-- --------------------------------------------------------------------
-- 2. 컬럼 목록 및 데이터 타입, Nullability 검증
-- --------------------------------------------------------------------
select 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by table_name, ordinal_position;


-- --------------------------------------------------------------------
-- 3. RLS(Row Level Security) 활성화 여부 확인
-- 기대 결과: 5개 테이블 모두 relrowsecurity = true
-- --------------------------------------------------------------------
select 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by relname;


-- --------------------------------------------------------------------
-- 4. RLS 정책(Policies) 목록 및 권한 확인
-- 기대 결과:
-- - comments: comments_select_public, comments_insert_auth, comments_update_auth
-- - profiles: profiles_select, profiles_insert_auth, profiles_update_auth
-- - comment_votes: comment_votes_select_auth, comment_votes_insert_auth, comment_votes_update_auth, comment_votes_delete_auth
-- - reported_comments: reported_select_auth, reported_insert_auth (UPDATE/DELETE 없음)
-- - user_profiles: user_profiles_select
-- --------------------------------------------------------------------
select 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual, 
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by tablename, policyname;


-- --------------------------------------------------------------------
-- 5. 인덱스 목록 확인
-- --------------------------------------------------------------------
select 
  tablename, 
  indexname, 
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by tablename, indexname;


-- --------------------------------------------------------------------
-- 6. 트리거(Triggers) 등록 상태 확인
-- 기대 결과:
-- - comments: before_update_comments
-- - profiles: set_profiles_updated_at
-- - comment_votes: before_insert_update_comment_votes, on_vote_inserted, on_vote_deleted, on_vote_updated
-- - reported_comments: before_insert_reported_comments
-- --------------------------------------------------------------------
select 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by event_object_table, trigger_name;


-- --------------------------------------------------------------------
-- 7. 사용자 정의 함수(Functions) 및 보안 옵션 검증
-- 기대 결과:
-- - update_comment_vote_count (prosecdef = true: security definer)
-- - check_reported_comments_before_insert (prosecdef = true)
-- - check_comment_votes_before_modify
-- - update_comments_before_update
-- - update_profiles_updated_at
-- --------------------------------------------------------------------
select 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as function_configs
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'update_comment_vote_count',
    'check_reported_comments_before_insert',
    'check_comment_votes_before_modify',
    'update_comments_before_update',
    'update_profiles_updated_at'
  )
order by proname;


-- --------------------------------------------------------------------
-- 8. CHECK 제약 조건 및 UNIQUE 제약 조건 확인
-- --------------------------------------------------------------------
select 
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles',
    'public.comments', 'public.profiles', 'public.comment_votes', 'public.reported_comments', 'public.user_profiles'
  )
order by table_name, constraint_name;


-- --------------------------------------------------------------------
-- 9. 현재 테이블별 레코드 수 집계
-- --------------------------------------------------------------------
select 'comments' as table_name, count(*) as row_count from public.comments
union all
select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'comment_votes' as table_name, count(*) as row_count from public.comment_votes
union all
select 'reported_comments' as table_name, count(*) as row_count from public.reported_comments
union all
select 'user_profiles' as table_name, count(*) as row_count from public.user_profiles;


-- --------------------------------------------------------------------
-- 10. 삭제된 댓글 SELECT 정책 동작 설명 (참고용)
-- --------------------------------------------------------------------
-- comments_select_public 정책의 조건: `is_deleted = false`
-- PostgREST API를 통한 일반 SELECT 시, DB 엔진 수준에서 `is_deleted = true`인 행은 완전히 배제됩니다.
-- (대댓글이 도입되기 전까지는 UI 및 API 응답에서 삭제된 댓글이 노출되지 않습니다.)
--
-- [중요 안내]
-- SQL Editor 세션은 postgres 슈퍼유저(BYPASSRLS)로 실행되므로 직접 select * from comments;를 실행하면
-- is_deleted = true 인 데이터도 조회될 수 있습니다.
-- 실제 API 호출 시의 RLS 차단 검증은 `docs/SUPABASE_MANUAL_TESTS.md` 가이드에 따라
-- 실제 브라우저/클라이언트에서 수행해야 합니다.
