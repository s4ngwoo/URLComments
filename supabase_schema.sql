-- 1. comments 테이블 생성
create table if not exists comments (
  id bigint primary key generated always as identity,
  url text not null,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null,
  content text not null check (
    char_length(trim(content)) > 0 and 
    char_length(content) <= 1000
  ),
  created_at timestamptz not null default now()
);

-- 2. URL 기준 + 생성시간 정렬 조회를 위한 복합 인덱스
create index if not exists idx_comments_url_created_at 
  on comments(url, created_at asc);

-- 3. RLS(Row Level Security) 활성화
alter table comments enable row level security;

-- 4. 읽기 정책: 누구나 모든 댓글 조회 가능 (Public)
create policy "comments_select_public"
  on comments
  for select
  using (true);

-- 5. 쓰기 정책: 로그인한 사용자 본인 명의로만 INSERT 허용
create policy "comments_insert_auth"
  on comments
  for insert
  with check (
    auth.uid() is not null and 
    auth.uid() = author_id
  );

-- 6. 테이블 접근 권한(Grants) 부여
-- 테이블 생성 시 권한이 자동으로 부여되지 않은 경우를 대비해 명시적으로 권한을 추가합니다.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;
GRANT SELECT ON TABLE comments TO anon;