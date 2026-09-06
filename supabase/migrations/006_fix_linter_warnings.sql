-- ==========================================
-- Migration: Fix Supabase Linter Warnings
-- ==========================================

-- 1. Fix "Function Search Path Mutable"
-- 대상 트리거 함수들에 명시적으로 search_path를 빈 문자열('')로 설정하여 보안 취약점 해결
ALTER FUNCTION public.update_profiles_updated_at() SET search_path = '';
ALTER FUNCTION public.check_comment_votes_before_modify() SET search_path = '';

-- update_comments_before_update 함수가 존재할 경우에만 ALTER (이전 마이그레이션 누락 대비)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_comments_before_update') THEN
    ALTER FUNCTION public.update_comments_before_update() SET search_path = '';
  END IF;
END $$;


-- 2. Fix "Public Can Execute SECURITY DEFINER Function" 
-- & "Signed-In Users 단 Execute SECURITY DEFINER Function"
-- 트리거용 SECURITY DEFINER 함수는 REST API(RPC)로 직접 호출될 필요가 없으므로 EXECUTE 권한을 회수(Revoke)
REVOKE EXECUTE ON FUNCTION public.check_reported_comments_before_insert() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_comment_vote_count() FROM public, anon, authenticated;
