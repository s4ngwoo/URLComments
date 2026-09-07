-- ====================================================================
-- Migration: 008_zero_trust_soft_delete_rpc.sql
-- Description: Zero-Trust soft delete function for comments
--              Bypasses PostgreSQL post-UPDATE SELECT evaluation while
--              preserving original content in the DB for audit trail.
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
BEGIN
  -- 대상 댓글의 작성자 확인
  SELECT author_id INTO v_author_id
  FROM public.comments
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found (id: %)', p_comment_id;
  END IF;

  -- 본인 작성 여부 엄격 검증
  IF v_author_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: cannot delete another user comment';
  END IF;

  -- 소프트 삭제 수행 (원본 content는 감사 추적을 위해 안전하게 보존)
  UPDATE public.comments
  SET is_deleted = TRUE,
      updated_at = NOW()
  WHERE id = p_comment_id;

  RETURN TRUE;
END;
$$;

-- REST API를 통해 인증된 사용자가 호출할 수 있도록 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.soft_delete_comment(bigint) TO authenticated;
