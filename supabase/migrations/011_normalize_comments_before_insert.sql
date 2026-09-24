-- ====================================================================
-- Migration: 011_normalize_comments_before_insert.sql
-- Description: Force vote caches and deletion flag on INSERT.
--              update_comments_before_update only runs on UPDATE, so an
--              authenticated author can POST like_count / dislike_count /
--              is_deleted and seed forged totals (or hide the row).
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

create or replace function public.normalize_comments_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Clients may not seed vote caches or insert already-deleted rows.
  new.like_count = 0;
  new.dislike_count = 0;
  new.is_deleted = false;
  return new;
end;
$$;

drop trigger if exists before_insert_comments on public.comments;
create trigger before_insert_comments
  before insert on public.comments
  for each row execute function public.normalize_comments_before_insert();
