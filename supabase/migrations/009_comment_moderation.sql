-- ====================================================================
-- Migration: 009_comment_moderation.sql
-- Description: Restore reported_comments + comments UPDATE protection.
--              004_comment_moderation.sql was accidentally a duplicate of
--              003_comment_votes.sql, so these objects never shipped.
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. comments BEFORE UPDATE: freeze identity/vote fields, block undelete
-- --------------------------------------------------------------------
-- Vote-count trigger (003) sets app.is_vote_count_update so this function
-- does not roll back like_count/dislike_count or bump updated_at on votes.
create or replace function public.update_comments_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Internal vote-count updates: keep user-visible fields unchanged.
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

  -- Deleted rows are immutable.
  if old.is_deleted = true then
    raise exception 'Cannot update a deleted comment.';
  end if;

  -- Soft-delete is one-way.
  if new.is_deleted = false and old.is_deleted = true then
    raise exception 'Cannot undelete a comment.';
  end if;

  -- Clients may not retarget, reassign, or forge vote caches.
  new.url = old.url;
  new.author_id = old.author_id;
  new.created_at = old.created_at;
  new.id = old.id;
  new.like_count = old.like_count;
  new.dislike_count = old.dislike_count;

  if new.is_deleted = false then
    new.content = trim(new.content);
    if char_length(new.content) = 0 or char_length(new.content) > 1000 then
      raise exception 'Content must be between 1 and 1000 characters.';
    end if;
    new.updated_at = now();
  else
    new.content = old.content;
    new.updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists before_update_comments on public.comments;
create trigger before_update_comments
  before update on public.comments
  for each row execute function public.update_comments_before_update();

-- --------------------------------------------------------------------
-- 2. reported_comments table, RLS, and insert guard
-- --------------------------------------------------------------------
create table if not exists public.reported_comments (
  id bigint primary key generated always as identity,
  comment_id bigint not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(comment_id, reporter_id)
);

alter table public.reported_comments enable row level security;

drop policy if exists "reported_insert_auth" on public.reported_comments;
create policy "reported_insert_auth"
  on public.reported_comments
  for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "reported_select_auth" on public.reported_comments;
create policy "reported_select_auth"
  on public.reported_comments
  for select
  using (auth.uid() = reporter_id);

grant select, insert on table public.reported_comments to authenticated;
grant usage on sequence public.reported_comments_id_seq to authenticated;

create or replace function public.check_reported_comments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
  target_is_deleted boolean;
begin
  select author_id, is_deleted into target_author_id, target_is_deleted
  from public.comments where id = new.comment_id;

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
$$;

drop trigger if exists before_insert_reported_comments on public.reported_comments;
create trigger before_insert_reported_comments
  before insert on public.reported_comments
  for each row execute function public.check_reported_comments_before_insert();

-- Trigger-only; do not expose as RPC.
revoke execute on function public.check_reported_comments_before_insert() from public, anon, authenticated;
revoke execute on function public.update_comments_before_update() from public, anon, authenticated;
