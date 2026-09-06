-- ====================================================================
-- Migration: 003_comment_votes.sql
-- Description: 좋아요/싫어요 투표 테이블, 삭제 댓글 투표 방어 트리거, 
--              댓글 카운트 캐시 자동 갱신 트리거 및 RLS 설정
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. comment_votes 테이블 생성
-- --------------------------------------------------------------------
create table if not exists public.comment_votes (
  id bigint primary key generated always as identity,
  comment_id bigint not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

create index if not exists idx_comment_votes_comment_user on public.comment_votes(comment_id, user_id);


-- --------------------------------------------------------------------
-- 2. comment_votes RLS (Row Level Security) 설정
-- --------------------------------------------------------------------
alter table public.comment_votes enable row level security;

drop policy if exists "comment_votes_select_auth" on public.comment_votes;
drop policy if exists "comment_votes_insert_auth" on public.comment_votes;
drop policy if exists "comment_votes_delete_auth" on public.comment_votes;
drop policy if exists "comment_votes_update_auth" on public.comment_votes;

-- [SELECT] 로그인 사용자는 본인의 투표 상태만 조회 가능 (최소 권한)
create policy "comment_votes_select_auth"
  on public.comment_votes for select
  using (auth.uid() = user_id);

-- [INSERT] 로그인 사용자가 본인 명의로만 투표 추가 가능
create policy "comment_votes_insert_auth"
  on public.comment_votes for insert
  with check (auth.uid() = user_id);

-- [DELETE] 본인 투표만 취소 가능
create policy "comment_votes_delete_auth"
  on public.comment_votes for delete
  using (auth.uid() = user_id);

-- [UPDATE] 본인 투표 타입(좋아요 <-> 싫어요)만 변경 가능
create policy "comment_votes_update_auth"
  on public.comment_votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.comment_votes to authenticated;
grant usage on sequence comment_votes_id_seq to authenticated;


-- --------------------------------------------------------------------
-- 3. 삭제된 댓글에 대한 신규 투표/수정 차단 트리거 (BEFORE INSERT/UPDATE)
-- --------------------------------------------------------------------
-- 정책: 
-- - comments.is_deleted = true 인 댓글에는 새 투표나 vote_type 변경 불가
-- - 단, 기존 투표의 DELETE(취소)는 삭제된 댓글에 대해서도 허용
create or replace function public.check_comment_votes_before_modify()
returns trigger as $$
declare
  target_is_deleted boolean;
begin
  select is_deleted into target_is_deleted 
  from public.comments where id = new.comment_id;

  if not found then
    raise exception 'Comment not found.';
  end if;

  if target_is_deleted = true then
    raise exception 'Cannot vote on a deleted comment.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists before_insert_update_comment_votes on public.comment_votes;
create trigger before_insert_update_comment_votes
  before insert or update on public.comment_votes
  for each row execute function public.check_comment_votes_before_modify();


-- --------------------------------------------------------------------
-- 4. comments 테이블 like_count / dislike_count 자동 갱신 트리거
-- --------------------------------------------------------------------
-- [보안 및 아키텍처 설명]
-- 1) security definer: 일반 사용자는 타인의 댓글(comments)에 대한 UPDATE 권한(RLS)이 없습니다.
--    따라서 투표 시 comments 테이블의 카운트를 갱신하려면 함수가 소유자 권한으로 실행되어야 합니다.
-- 2) set search_path = public: security definer 함수의 search_path 하이재킹 취약점을 방지하기 위한 필수 보안 설정입니다.
-- 3) app.is_vote_count_update 플래그: comments의 BEFORE UPDATE 트리거가
--    - 투표 갱신을 외부 사용자의 불법 변경으로 오인해 like_count를 롤백하거나
--    - 투표가 발생할 때마다 updated_at을 갱신하여 UI에 '(수정됨)' 라벨이 잘못 붙는 문제를 방지합니다.
-- 4) greatest(0, value - 1): 동시성이나 이상 상황에서도 카운트가 음수로 내려가지 않도록 방어합니다.
create or replace function public.update_comment_vote_count()
returns trigger as $$
begin
  -- 트랜잭션 로컬 플래그 설정 (comments BEFORE UPDATE 트리거와 연계)
  perform set_config('app.is_vote_count_update', 'true', true);

  -- [투표 추가 시]
  if (TG_OP = 'INSERT') then
    if (new.vote_type = 'like') then
      update public.comments set like_count = like_count + 1 where id = new.comment_id;
    elsif (new.vote_type = 'dislike') then
      update public.comments set dislike_count = dislike_count + 1 where id = new.comment_id;
    end if;
    return new;
  
  -- [투표 삭제(취소) 시]
  elsif (TG_OP = 'DELETE') then
    if (old.vote_type = 'like') then
      update public.comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
    elsif (old.vote_type = 'dislike') then
      update public.comments set dislike_count = greatest(0, dislike_count - 1) where id = old.comment_id;
    end if;
    return old;
    
  -- [투표 타입 변경 (좋아요 <-> 싫어요) 시]
  elsif (TG_OP = 'UPDATE') then
    if (old.vote_type != new.vote_type) then
      -- 기존 타입 -1
      if (old.vote_type = 'like') then
        update public.comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
      elsif (old.vote_type = 'dislike') then
        update public.comments set dislike_count = greatest(0, dislike_count - 1) where id = old.comment_id;
      end if;
      
      -- 새 타입 +1
      if (new.vote_type = 'like') then
        update public.comments set like_count = like_count + 1 where id = new.comment_id;
      elsif (new.vote_type = 'dislike') then
        update public.comments set dislike_count = dislike_count + 1 where id = new.comment_id;
      end if;
    end if;
    return new;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_vote_inserted on public.comment_votes;
create trigger on_vote_inserted
  after insert on public.comment_votes
  for each row execute function public.update_comment_vote_count();

drop trigger if exists on_vote_deleted on public.comment_votes;
create trigger on_vote_deleted
  after delete on public.comment_votes
  for each row execute function public.update_comment_vote_count();

drop trigger if exists on_vote_updated on public.comment_votes;
create trigger on_vote_updated
  after update of vote_type on public.comment_votes
  for each row execute function public.update_comment_vote_count();


-- --------------------------------------------------------------------
-- 5. 기존 댓글 투표 수 캐시 정합성 검증 및 재집계 (선택적 쿼리)
-- --------------------------------------------------------------------
-- 만약 트리거 적용 전 이미 comment_votes에 데이터가 존재했다면, 
-- 아래 쿼리를 필요 시 수동 실행하여 comments의 like_count/dislike_count를 동기화할 수 있습니다:
/*
update public.comments c
set 
  like_count = coalesce((select count(*) from public.comment_votes v where v.comment_id = c.id and v.vote_type = 'like'), 0),
  dislike_count = coalesce((select count(*) from public.comment_votes v where v.comment_id = c.id and v.vote_type = 'dislike'), 0);
*/
