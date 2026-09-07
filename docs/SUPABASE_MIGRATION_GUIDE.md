# 🛠️ Supabase Database Migration Guide

🌍 [English](SUPABASE_MIGRATION_GUIDE.md) | [한국어](ko/SUPABASE_MIGRATION_GUIDE.md) | [日本語](ja/SUPABASE_MIGRATION_GUIDE.md) | [中文](zh/SUPABASE_MIGRATION_GUIDE.md) | [Español](es/SUPABASE_MIGRATION_GUIDE.md)

This document provides step-by-step instructions for executing SQL schema migrations and establishing Row Level Security (RLS) policies on your Supabase project.

---

## 1. Feature Coverage

Applying these migrations establishes database-level constraints and security rules for:
1. **URLComments Core**: URL-based comment storage, author ownership verification, and 1,000-character limits.
2. **Public Identity**: Canonical `@adjective-noun-preposition-place-XXXXX` Public IDs and custom display names via `public.profiles`.
3. **Comment Reactions**: 1-user-1-vote constraints, automatic `like_count`/`dislike_count` cache triggers, and negative count guards.
4. **Moderation & Reports**: Append-only reports table, self-reporting prevention, duplicate report blocks (`23505`), and soft-delete safeguards.
5. **1-Depth Hierarchical Replies**: `parent_id` foreign keys, multi-sibling ordering, and reply integrity.

---

## 2. API Key Security Guidelines

> [!CAUTION]
> **API Key Protocol**
> - The client extension (`lib/config.js`) must strictly use **`SUPABASE_URL`** and the public **`SUPABASE_ANON_KEY`**.
> - **`SERVICE_ROLE_KEY`** bypasses all Row Level Security. **Never** include the service role key in extension code, manifests, or git repositories.

---

## 3. Pre-Migration Diagnostics & Backups

Before running migrations on an existing project, inspect table status in the Supabase **SQL Editor**:

```sql
-- 1. Check existing comment volume
select count(*) as comment_count from public.comments;

-- 2. Inspect column types across project tables
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('comments', 'profiles', 'comment_votes', 'reported_comments', 'user_profiles')
order by table_name, ordinal_position;

-- 3. Review active RLS policies
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

---

## 4. Sequential Migration Steps

> [!IMPORTANT]
> Do not execute multiple migration files in a single batch. Execute files in `supabase/migrations/` sequentially one by one in the Supabase **SQL Editor**.

### Step 1: `supabase/migrations/001_comments_baseline.sql`
- **Purpose**: Creates `user_profiles` rate-limiting table, adds missing columns to `comments` (`updated_at`, `is_deleted`, reaction counters), creates performance indexes, and enables baseline RLS.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 2: `supabase/migrations/002_profiles_public_identity.sql`
- **Purpose**: Creates `public.profiles` table with `display_name` (1-30 chars) and `public_id` regex validation, adds RLS policies, and registers `updated_at` triggers.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 3: `supabase/migrations/003_comment_votes.sql`
- **Purpose**: Creates `comment_votes` table, enforces unique 1-vote constraint, prevents voting on deleted comments, and adds atomic count aggregation triggers.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 4: `supabase/migrations/004_comment_moderation.sql`
- **Purpose**: Creates `reported_comments` table, prevents self-reporting and deleted comment reporting, and registers state transition protection triggers on `comments`.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 5: `supabase/migrations/005_verify_schema.sql`
- **Purpose**: Read-only verification script confirming that all tables, indexes, constraints, and triggers are correctly configured.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 6: `supabase/migrations/006_fix_linter_warnings.sql`
- **Purpose**: Resolves Supabase linter warnings regarding search paths and security definer functions.
- **Action**: Paste file content into SQL Editor and click **Run**.

### Step 7: `supabase/migrations/007_one_depth_replies.sql`
- **Purpose**: Adds `parent_id` column to `comments`, creates tree relationship index, and enforces 1-depth hierarchy constraints.
- **Action**: Paste file content into SQL Editor and click **Run**.

---

## 5. Rollback Policy

- All migration scripts are idempotent (`CREATE OR REPLACE`, `IF NOT EXISTS`, `DROP ... IF EXISTS`). If an error occurs, resolve the root cause and re-run the failed migration file safely.
- Never execute destructive `DROP TABLE` commands in a live production environment.
