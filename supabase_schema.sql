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
  created_at timestamptz not null default now()
);

-- (기존 테이블 업데이트용 - 이미 테이블이 있다면 실행)
alter table comments add column if not exists is_deleted boolean not null default false;

create index if not exists idx_comments_url_created_at on comments(url, created_at asc);

alter table comments enable row level security;

-- 기존 정책 충돌 방지를 위해 삭제
drop policy if exists "comments_select_public" on comments;
drop policy if exists "comments_insert_auth" on comments;
drop policy if exists "comments_update_auth" on comments;

-- 4. 읽기 정책: 삭제되지 않은 댓글이거나 자신이 작성한 댓글만 보임 (Spammer 제외)
create policy "comments_select_public"
  on comments
  for select
  using (
    (is_deleted = false or auth.uid() = author_id)
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

-- 3-4. 투표 수 자동 갱신을 위한 트리거 함수
create or replace function update_comment_vote_count()
returns trigger as $$
begin
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
      update comments set like_count = like_count - 1 where id = old.comment_id;
    elsif (old.vote_type = 'dislike') then
      update comments set dislike_count = dislike_count - 1 where id = old.comment_id;
    end if;
    return old;
    
  -- 투표 타입 변경 (좋아요 <-> 싫어요) 시
  elsif (TG_OP = 'UPDATE') then
    if (old.vote_type != new.vote_type) then
      -- 기존 타입 -1
      if (old.vote_type = 'like') then
        update comments set like_count = like_count - 1 where id = old.comment_id;
      elsif (old.vote_type = 'dislike') then
        update comments set dislike_count = dislike_count - 1 where id = old.comment_id;
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