-- ====================================================================
-- Migration: 010_reject_replies_to_deleted_parents.sql
-- Description: Block INSERT/UPDATE replies whose parent is soft-deleted.
--              check_comment_one_depth is SECURITY DEFINER, so it can see
--              hidden parents. Without an is_deleted guard, any authenticated
--              user can POST parent_id=<deleted> and comments_select_public
--              re-exposes the deleted row (including content) via
--              comment_has_active_replies().
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.check_comment_one_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_parent_id bigint;
  v_parent_url text;
  v_parent_exists boolean;
  v_parent_is_deleted boolean;
BEGIN
  -- 1. parent_id가 NULL인 경우: 최상위 댓글이므로 항상 허용
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. 자기 자신을 부모로 지정하는 self-parenting 방지
  IF NEW.id IS NOT NULL AND NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Self-parenting is not allowed: comment cannot be its own parent (id: %, parent_id: %)',
      NEW.id, NEW.parent_id;
  END IF;

  -- 3. 부모 댓글 존재 여부, URL, 삭제 여부 및 부모의 parent_id 확인
  SELECT parent_id, url, true, is_deleted
  INTO v_parent_parent_id, v_parent_url, v_parent_exists, v_parent_is_deleted
  FROM public.comments
  WHERE id = NEW.parent_id;

  IF NOT FOUND OR v_parent_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'Referenced parent comment does not exist (parent_id: %)', NEW.parent_id;
  END IF;

  -- 4. Soft-deleted 부모에 새 대댓글을 달면 숨겨진 본문이 SELECT로 재노출됨
  IF v_parent_is_deleted IS TRUE THEN
    RAISE EXCEPTION 'Cannot reply to a deleted comment (parent_id: %)', NEW.parent_id;
  END IF;

  -- 5. 부모 댓글이 이미 대댓글인 경우 (부모의 parent_id가 NOT NULL): 1단계 초과 거부
  IF v_parent_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nested replies are not allowed: maximum depth is 1 (attempted reply to reply id: %, which belongs to parent id: %)',
      NEW.parent_id, v_parent_parent_id;
  END IF;

  -- 6. 대댓글의 URL은 반드시 부모 댓글의 URL과 일치해야 함
  IF NEW.url <> v_parent_url THEN
    RAISE EXCEPTION 'Reply URL (%) does not match parent comment URL (%)', NEW.url, v_parent_url;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_comment_one_depth() FROM public, anon, authenticated;
