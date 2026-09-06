-- ====================================================================
-- Migration: 007_one_depth_replies.sql
-- Description: 1단계 깊이(1-Depth) 대댓글 지원을 위한 parent_id 컬럼 추가,
--              인덱스 생성, 1단계 깊이 강제 트리거 및 RLS 보완
-- Safe & Idempotent (재실행 가능)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. comments 테이블에 parent_id 컬럼 추가 및 외래키 설정
-- --------------------------------------------------------------------
-- comments.id는 bigint generated always as identity이므로 parent_id도 bigint 타입이어야 합니다.
-- 기존 댓글들은 parent_id가 NULL로 유지되어 최상위(Root) 댓글로 동작합니다.
-- 물리적 삭제 시의 무결성을 위해 ON DELETE CASCADE를 적용하되, 
-- 애플리케이션 레벨에서는 soft-delete(is_deleted = true)로 동작합니다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.comments 
      ADD COLUMN parent_id bigint REFERENCES public.comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. 자식 댓글(대댓글) 조회 성능 최적화 인덱스 생성
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_parent_id_created_at 
  ON public.comments(parent_id, created_at ASC);

-- --------------------------------------------------------------------
-- 3. 1-Depth 제한 및 부모 검증 트리거 함수 정의
-- --------------------------------------------------------------------
-- CHECK 제약조건은 동일 행의 컬럼만 검사할 수 있고 다른 행(부모 행)을 쿼리할 수 없으므로,
-- 부모의 parent_id가 NULL인지 확인하여 1단계 깊이를 보장하려면 트리거가 필수적입니다.
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

  -- 3. 부모 댓글 존재 여부, 부모의 URL 및 부모의 parent_id 확인
  SELECT parent_id, url, true 
  INTO v_parent_parent_id, v_parent_url, v_parent_exists
  FROM public.comments
  WHERE id = NEW.parent_id;

  IF NOT FOUND OR v_parent_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'Referenced parent comment does not exist (parent_id: %)', NEW.parent_id;
  END IF;

  -- 4. 부모 댓글이 이미 대댓글인 경우 (부모의 parent_id가 NOT NULL): 1단계 초과 거부
  IF v_parent_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Nested replies are not allowed: maximum depth is 1 (attempted reply to reply id: %, which belongs to parent id: %)', 
      NEW.parent_id, v_parent_parent_id;
  END IF;

  -- 5. 대댓글의 URL은 반드시 부모 댓글의 URL과 일치해야 함
  IF NEW.url <> v_parent_url THEN
    RAISE EXCEPTION 'Reply URL (%) does not match parent comment URL (%)', NEW.url, v_parent_url;
  END IF;

  RETURN NEW;
END;
$$;

-- 보안 및 Linter 준수: REST API를 통한 트리거 함수 직접 실행 권한 회수
REVOKE EXECUTE ON FUNCTION public.check_comment_one_depth() FROM public, anon, authenticated;

-- 트리거 생성 (INSERT 및 parent_id UPDATE 시 동작)
DROP TRIGGER IF EXISTS before_insert_update_comments_one_depth ON public.comments;
CREATE TRIGGER before_insert_update_comments_one_depth
  BEFORE INSERT OR UPDATE OF parent_id
  ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_comment_one_depth();

-- --------------------------------------------------------------------
-- 4. 부모 댓글 Soft-Delete 시 대댓글 보존을 위한 헬퍼 함수 및 RLS SELECT 정책
-- --------------------------------------------------------------------
-- RLS 정책식 내부에서 동일한 comments 테이블을 직접 서브쿼리(EXISTS (SELECT 1 FROM comments ...))하면
-- 서브쿼리에도 동일한 SELECT 정책이 적용되어 PostgreSQL RLS 'infinite recursion' 에러가 발생합니다.
-- 따라서 SECURITY DEFINER 함수를 정의하여 RLS 재귀 없이 부모 댓글에 활성 대댓글이 있는지 검사합니다.
CREATE OR REPLACE FUNCTION public.comment_has_active_replies(p_comment_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comments
    WHERE parent_id = p_comment_id
      AND is_deleted = false
  );
$$;

GRANT EXECUTE ON FUNCTION public.comment_has_active_replies(bigint) TO anon, authenticated;

DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
CREATE POLICY "comments_select_public"
  ON public.comments
  FOR SELECT
  USING (
    (
      is_deleted = false
      OR (parent_id IS NULL AND public.comment_has_active_replies(id))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = comments.author_id 
        AND is_spammer = true
    )
  );

