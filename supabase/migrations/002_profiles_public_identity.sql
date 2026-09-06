-- ====================================================================
-- Migration: 002_profiles_public_identity.sql
-- Description: 사용자 표시 이름(display_name) 및 고유 식별자(public_id) 관리 테이블과 RLS 설정
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. profiles 테이블 생성
-- --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  public_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 제약 조건 추가 (안전한 DO 블록)
do $$
begin
  -- display_name 제약조건: 앞뒤 공백 제거 후 1자 이상 30자 이하
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_display_name_length_check'
  ) then
    alter table public.profiles add constraint profiles_display_name_length_check
      check (char_length(trim(display_name)) between 1 and 30);
  end if;

  -- public_id 형식 제약조건:
  -- @adjective-noun-preposition-place-XXXXX (XXXXX: Crockford Base32 5글자)
  -- 생성은 클라이언트(popup/profile.js 및 lib/publicId.js)에서 수행하며,
  -- DB는 형식(regex) 및 UNIQUE 무결성만을 검증합니다.
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_public_id_format_check'
  ) then
    alter table public.profiles add constraint profiles_public_id_format_check
      check (public_id ~ '^@[a-z]+-[a-z]+-[a-z]+-[a-z]+-[0-9A-HJKMNPQRSTVWXYZ]{5}$');
  end if;
end $$;


-- --------------------------------------------------------------------
-- 2. profiles RLS (Row Level Security) 설정
-- --------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert_auth" on public.profiles;
drop policy if exists "profiles_update_auth" on public.profiles;
drop policy if exists "profiles_delete_auth" on public.profiles;

-- [SELECT] 누구나 프로필(표시 이름, public ID) 조회 가능
create policy "profiles_select" on public.profiles for select using (true);

-- [INSERT] 로그인한 사용자 본인 ID로만 프로필 생성 가능
create policy "profiles_insert_auth" on public.profiles
  for insert
  with check (auth.uid() = id);

-- [UPDATE] 로그인한 사용자 본인 프로필만 수정 가능
create policy "profiles_update_auth" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- [DELETE] 프로필 삭제 정책은 제공하지 않음 (계정 탈퇴 시 auth.users cascade로 처리)


-- --------------------------------------------------------------------
-- 3. updated_at 자동 갱신 트리거
-- --------------------------------------------------------------------
create or replace function public.update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_profiles_updated_at();


-- --------------------------------------------------------------------
-- 4. 권한 부여 (최소 권한 원칙)
-- --------------------------------------------------------------------
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;
