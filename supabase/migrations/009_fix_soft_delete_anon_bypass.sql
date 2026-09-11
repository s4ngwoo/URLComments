-- ====================================================================
-- Migration: 009_fix_soft_delete_anon_bypass.sql
-- Description: Close unauthenticated soft-delete on soft_delete_comment
--
-- Root cause (two issues that combine):
--   1. PostgreSQL grants EXECUTE on new functions to PUBLIC by default.
--      008 GRANTed authenticated but never REVOKEd PUBLIC/anon, so the
--      published anon key can call this SECURITY DEFINER RPC.
--   2. Owner check used `v_author_id <> auth.uid()`. When auth.uid() is
--      NULL (anon), the comparison is NULL and PL/pgSQL IF treats that
--      as false, so the deny branch never runs. The UPDATE then marks
--      any comment deleted and bypasses RLS.
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.soft_delete_comment(p_comment_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id uuid;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  SELECT author_id INTO v_author_id
  FROM public.comments
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found (id: %)', p_comment_id;
  END IF;

  -- NULL-safe owner check: anon (uid IS NULL) and non-authors are denied
  IF v_uid IS NULL OR v_author_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Permission denied: cannot delete another user comment';
  END IF;

  UPDATE public.comments
  SET is_deleted = TRUE,
      updated_at = NOW()
  WHERE id = p_comment_id
    AND author_id = v_uid;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_comment(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_comment(bigint) TO authenticated;
