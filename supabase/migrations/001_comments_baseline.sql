-- ====================================================================
-- Migration: 001_comments_baseline.sql
-- Description: comments 테이블 및 user_profiles(스팸 방어) 기본 스키마 및 RLS 설정
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. user_profiles 테이블 (스팸 사용자 관리 및 RLS 연동용)
-- --------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_spammer boolean not null default false,
  trust_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles for select using (true);

grant select on table public.user_profiles to anon, authenticated;


-- --------------------------------------------------------------------
-- 2. comments 테이블 기본 생성 및 컬럼 보완
-- --------------------------------------------------------------------
create table if not exists public.comments (
  id bigint primary key generated always as identity,
  url text not null,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null,
  content text not null,
  is_deleted boolean not null default false,
  like_count bigint not null default 0,
  dislike_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 기존 테이블이 이미 존재하는 경우를 대비한 안전한 컬럼 추가
alter table public.comments add column if not exists is_deleted boolean not null default false;
alter table public.comments add column if not exists like_count bigint not null default 0;
alter table public.comments add column if not exists dislike_count bigint not null default 0;
alter table public.comments add column if not exists updated_at timestamptz not null default now();

-- content 제약조건 (앞뒤 공백 제거 후 1자 이상 1000자 이하)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'comments_content_length_check'
  ) then
    alter table public.comments add constraint comments_content_length_check
      check (char_length(trim(content)) > 0 and char_length(content) <= 1000);
  end if;
end $$;

-- 조회 성능 최적화 인덱스 (URL 기준 시간순 정렬)
create index if not exists idx_comments_url_created_at on public.comments(url, created_at asc);


-- --------------------------------------------------------------------
-- 3. comments RLS (Row Level Security) 설정
-- --------------------------------------------------------------------
alter table public.comments enable row level security;

-- 기존 정책 충돌 방지 삭제
drop policy if exists "comments_select_public" on public.comments;
drop policy if exists "comments_insert_auth" on public.comments;
drop policy if exists "comments_update_auth" on public.comments;
drop policy if exists "comments_delete_auth" on public.comments;

-- [SELECT] 대댓글 없는 현 단계 정책: 삭제되지 않은 댓글만 조회 가능 (스팸 유저 제외)
create policy "comments_select_public"
  on public.comments
  for select
  using (
    is_deleted = false
    and not exists (
      select 1 from public.user_profiles 
      where id = comments.author_id 
      and is_spammer = true
    )
  );

-- [INSERT] 인증된 사용자가 본인 author_id로만 작성 가능
create policy "comments_insert_auth"
  on public.comments
  for insert
  with check (auth.uid() = author_id);

-- [UPDATE] 작성자 본인 댓글만 UPDATE 가능 (Soft Delete 및 본문 수정 포함)
create policy "comments_update_auth"
  on public.comments
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- [DELETE] 물리적 삭제 정책은 제공하지 않음 (Soft delete로 일원화)


-- --------------------------------------------------------------------
-- 4. 권한 부여 (최소 권한 원칙)
-- --------------------------------------------------------------------
grant select, insert, update on table public.comments to authenticated;
grant select on table public.comments to anon;
grant usage on sequence comments_id_seq to authenticated;
