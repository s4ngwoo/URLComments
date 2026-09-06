-- ====================================================================
-- URLComments Unified Schema Reference Snapshot
-- 
-- [안내]
-- 이 파일은 전체 DB 스키마의 최종 통합 레퍼런스 스냅샷입니다.
-- 실제 Supabase 프로젝트에 스키마를 안전하게 배포하거나 마이그레이션할 때는
-- 이 파일을 통째로 실행하지 마시고, 아래 디렉터리의 개별 마이그레이션 파일을
-- 번호 순서대로(001 -> 002 -> 003 -> 004 -> 005) 순차 실행하세요:
-- 
--   supabase/migrations/
--   ├── 001_comments_baseline.sql
--   ├── 002_profiles_public_identity.sql
--   ├── 003_comment_votes.sql
--   ├── 004_comment_moderation.sql
--   └── 005_verify_schema.sql
--
-- 상세 가이드: docs/SUPABASE_MIGRATION_GUIDE.md
-- ====================================================================

-- ==========================================
-- 0. User Profiles (스팸 유저 등 관리용)
-- ==========================================
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_spammer boolean not null default false,
  trust_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

-- 누구나 프로필 조회 가능
create policy "user_profiles_select" on user_profiles for select using (true);
GRANT SELECT ON TABLE user_profiles TO anon, authenticated;

-- (선택) 회원가입 시 자동으로 user_profiles에 로우를 생성하는 트리거가 필요할 수 있으나, 
-- MVP에서는 스팸 처리할 유저를 관리자가 수동으로 insert/update 하는 방식을 권장합니다.


-- ==========================================
-- 0.5 Profiles (사용자 표시 이름 및 Public ID)
-- ==========================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  public_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    char_length(trim(display_name)) between 1 and 30
  ),
  check (
    public_id ~ '^@[a-z]+-[a-z]+-[a-z]+-[a-z]+-[0-9A-HJKMNPQRSTVWXYZ]{5}$'
  )
);

alter table public.profiles enable row level security;

-- 누구나 프로필 조회 가능
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);

-- 본인 프로필 삽입 가능
drop policy if exists "profiles_insert_auth" on public.profiles;
create policy "profiles_insert_auth" on public.profiles
  for insert
  with check (auth.uid() = id);

-- 본인 프로필 수정 가능
drop policy if exists "profiles_update_auth" on public.profiles;
create policy "profiles_update_auth" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 프로필 삭제는 현재 불가능하게 설정 (기본 DENY)

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- updated_at 자동 갱신 트리거
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

-- ==========================================
-- 1. Comments 테이블
-- ==========================================
create table if not exists comments (
  id bigint primary key generated always as identity,
  url text not null,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null,
  content text not null check (
    char_length(trim(content)) > 0 and 
    char_length(content) <= 1000
  ),
  is_deleted boolean not null default false,
  parent_id bigint references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- (기존 테이블 업데이트용 - 이미 테이블이 있다면 실행)
alter table comments add column if not exists is_deleted boolean not null default false;
alter table comments add column if not exists parent_id bigint references comments(id) on delete cascade;
alter table comments add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_comments_url_created_at on comments(url, created_at asc);
create index if not exists idx_comments_parent_id_created_at on comments(parent_id, created_at asc);

-- 1-Depth 제한 트리거 함수
create or replace function public.check_comment_one_depth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_parent_id bigint;
  v_parent_url text;
  v_parent_exists boolean;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.id is not null and new.parent_id = new.id then
    raise exception 'Self-parenting is not allowed: comment cannot be its own parent (id: %, parent_id: %)', 
      new.id, new.parent_id;
  end if;

  select parent_id, url, true 
  into v_parent_parent_id, v_parent_url, v_parent_exists
  from public.comments
  where id = new.parent_id;

  if not found or v_parent_exists is not true then
    raise exception 'Referenced parent comment does not exist (parent_id: %)', new.parent_id;
  end if;

  if v_parent_parent_id is not null then
    raise exception 'Nested replies are not allowed: maximum depth is 1 (attempted reply to reply id: %, which belongs to parent id: %)', 
      new.parent_id, v_parent_parent_id;
  end if;

  if new.url <> v_parent_url then
    raise exception 'Reply URL (%) does not match parent comment URL (%)', new.url, v_parent_url;
  end if;

  return new;
end;
$$;

revoke execute on function public.check_comment_one_depth() from public, anon, authenticated;

drop trigger if exists before_insert_update_comments_one_depth on comments;
create trigger before_insert_update_comments_one_depth
  before insert or update of parent_id
  on comments
  for each row
  execute function public.check_comment_one_depth();

alter table comments enable row level security;

-- 기존 정책 충돌 방지를 위해 삭제
drop policy if exists "comments_select_public" on comments;
drop policy if exists "comments_insert_auth" on comments;
drop policy if exists "comments_update_auth" on comments;

-- 4. 읽기 정책: 삭제되지 않은 댓글 또는 활성 대댓글이 달린 부모 댓글 조회 허용
create policy "comments_select_public"
  on comments
  for select
  using (
    (
      is_deleted = false
      or exists (
        select 1 from comments replies
        where replies.parent_id = comments.id
          and replies.is_deleted = false
      )
    )
    and not exists (
      select 1 from user_profiles 
      where id = comments.author_id 
      and is_spammer = true
    )
  );

-- 5. 쓰기 정책: 로그인한 본인 명의로만 INSERT
create policy "comments_insert_auth"
  on comments
  for insert
  with check (auth.uid() = author_id);

-- 6. 수정 정책(Soft Delete용): 작성자 본인만 UPDATE 가능
create policy "comments_update_auth"
  on comments
  for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- updated_at 자동 갱신 및 보안 방어 트리거 (comments)
create or replace function public.update_comments_before_update()
returns trigger as $$
begin
  -- 투표 카운트 내부 갱신 예외 처리
  if current_setting('app.is_vote_count_update', true) = 'true' then
    new.content = old.content;
    new.is_deleted = old.is_deleted;
    new.url = old.url;
    new.author_id = old.author_id;
    new.created_at = old.created_at;
    new.id = old.id;
    new.updated_at = old.updated_at;
    return new;
  end if;

  -- 1. 삭제된 댓글은 어떠한 UPDATE도 불가
  if old.is_deleted = true then
    raise exception 'Cannot update a deleted comment.';
  end if;

  -- 2. is_deleted 상태 전이 (false -> true만 허용, 복구 불가)
  if new.is_deleted = false and old.is_deleted = true then
    raise exception 'Cannot undelete a comment.';
  end if;

  -- 3. 클라이언트가 수정할 수 없는 필드 강제 복원
  new.url = old.url;
  new.author_id = old.author_id;
  new.created_at = old.created_at;
  new.id = old.id;
  new.like_count = old.like_count;
  new.dislike_count = old.dislike_count;
  
  -- 4. 일반 수정 (is_deleted = false 상태 유지)인 경우 content 검증
  if new.is_deleted = false then
    new.content = trim(new.content);
    if char_length(new.content) = 0 or char_length(new.content) > 1000 then
      raise exception 'Content must be between 1 and 1000 characters.';
    end if;
    new.updated_at = now();
  else
    -- soft delete 인 경우 content 변경 무시 (기존 유지)
    new.content = old.content;
    new.updated_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_update_comments on comments;
create trigger before_update_comments
  before update on comments
  for each row execute function public.update_comments_before_update();

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;
GRANT SELECT ON TABLE comments TO anon;
GRANT USAGE ON SEQUENCE comments_id_seq TO anon, authenticated;


-- ==========================================
-- 2. 신고 (Reported Comments) 테이블
-- ==========================================
create table if not exists reported_comments (
  id bigint primary key generated always as identity,
  comment_id bigint not null references comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(comment_id, reporter_id)
);

alter table reported_comments enable row level security;

create policy "reported_insert_auth"
  on reported_comments
  for insert
  with check (auth.uid() = reporter_id);

GRANT INSERT ON TABLE reported_comments TO authenticated;

-- 신고 테이블 보안 검증 트리거
create or replace function public.check_reported_comments_before_insert()
returns trigger as $$
declare
  target_author_id uuid;
  target_is_deleted boolean;
begin
  -- 대상 댓글 정보 조회
  select author_id, is_deleted into target_author_id, target_is_deleted 
  from comments where id = new.comment_id;

  if not found then
    raise exception 'Comment not found.';
  end if;

  if target_is_deleted = true then
    raise exception 'Cannot report a deleted comment.';
  end if;

  if target_author_id = new.reporter_id then
    raise exception 'Cannot report your own comment.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists before_insert_reported_comments on reported_comments;
create trigger before_insert_reported_comments
  before insert on reported_comments
  for each row execute function public.check_reported_comments_before_insert();

-- ==========================================
-- 3. 좋아요/싫어요 (Comment Votes) 테이블 및 캐시 갱신 트리거
-- ==========================================

-- 3-1. 기존 comments 테이블에 캐시 컬럼 추가
alter table comments add column if not exists like_count bigint not null default 0;
alter table comments add column if not exists dislike_count bigint not null default 0;

-- 3-2. 투표 테이블 생성
create table if not exists comment_votes (
  id bigint primary key generated always as identity,
  comment_id bigint not null references comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

-- 인덱스 생성 (성능 최적화)
create index if not exists idx_comment_votes_comment_user on comment_votes(comment_id, user_id);

-- 3-3. 투표 테이블 RLS 적용
alter table comment_votes enable row level security;

drop policy if exists "comment_votes_select_auth" on comment_votes;
drop policy if exists "comment_votes_insert_auth" on comment_votes;
drop policy if exists "comment_votes_delete_auth" on comment_votes;
drop policy if exists "comment_votes_update_auth" on comment_votes;

create policy "comment_votes_select_auth"
  on comment_votes for select
  using (auth.uid() is not null);

create policy "comment_votes_insert_auth"
  on comment_votes for insert
  with check (auth.uid() = user_id);

create policy "comment_votes_delete_auth"
  on comment_votes for delete
  using (auth.uid() = user_id);

create policy "comment_votes_update_auth"
  on comment_votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comment_votes TO authenticated;

-- 삭제된 댓글에 대한 투표 차단 트리거
create or replace function public.check_comment_votes_before_modify()
returns trigger as $$
declare
  target_is_deleted boolean;
begin
  -- 대상 댓글 상태 확인
  select is_deleted into target_is_deleted 
  from comments where id = new.comment_id;

  if not found then
    raise exception 'Comment not found.';
  end if;

  if target_is_deleted = true then
    raise exception 'Cannot vote on a deleted comment.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists before_insert_update_comment_votes on comment_votes;
create trigger before_insert_update_comment_votes
  before insert or update on comment_votes
  for each row execute function public.check_comment_votes_before_modify();

-- 3-4. 투표 수 자동 갱신을 위한 트리거 함수
create or replace function update_comment_vote_count()
returns trigger as $$
begin
  -- 트랜잭션 로컬 플래그 설정 (comments BEFORE UPDATE 트리거와 연계)
  perform set_config('app.is_vote_count_update', 'true', true);

  -- 투표 추가 시
  if (TG_OP = 'INSERT') then
    if (new.vote_type = 'like') then
      update comments set like_count = like_count + 1 where id = new.comment_id;
    elsif (new.vote_type = 'dislike') then
      update comments set dislike_count = dislike_count + 1 where id = new.comment_id;
    end if;
    return new;
  
  -- 투표 삭제(취소) 시
  elsif (TG_OP = 'DELETE') then
    if (old.vote_type = 'like') then
      update comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
    elsif (old.vote_type = 'dislike') then
      update comments set dislike_count = greatest(0, dislike_count - 1) where id = old.comment_id;
    end if;
    return old;
    
  -- 투표 타입 변경 (좋아요 <-> 싫어요) 시
  elsif (TG_OP = 'UPDATE') then
    if (old.vote_type != new.vote_type) then
      -- 기존 타입 -1
      if (old.vote_type = 'like') then
        update comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
      elsif (old.vote_type = 'dislike') then
        update comments set dislike_count = greatest(0, dislike_count - 1) where id = old.comment_id;
      end if;
      
      -- 새 타입 +1
      if (new.vote_type = 'like') then
        update comments set like_count = like_count + 1 where id = new.comment_id;
      elsif (new.vote_type = 'dislike') then
        update comments set dislike_count = dislike_count + 1 where id = new.comment_id;
      end if;
    end if;
    return new;
  end if;
end;
$$ language plpgsql security definer;

-- 3-5. 트리거 등록
drop trigger if exists on_vote_inserted on comment_votes;
create trigger on_vote_inserted
  after insert on comment_votes
  for each row execute function update_comment_vote_count();

drop trigger if exists on_vote_deleted on comment_votes;
create trigger on_vote_deleted
  after delete on comment_votes
  for each row execute function update_comment_vote_count();

drop trigger if exists on_vote_updated on comment_votes;
create trigger on_vote_updated
  after update of vote_type on comment_votes
  for each row execute function update_comment_vote_count();