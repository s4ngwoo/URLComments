# 🛠️ Supabase DB移行実行ガイド

🌍 [English](../SUPABASE_MIGRATION_GUIDE.md) | [한국어](../ko/SUPABASE_MIGRATION_GUIDE.md) | [日本語](SUPABASE_MIGRATION_GUIDE.md) | [中文](../zh/SUPABASE_MIGRATION_GUIDE.md) | [Español](../es/SUPABASE_MIGRATION_GUIDE.md)

このドキュメントでは、URLComments Chrome拡張機能に必要なデータベーススキーマおよびセキュリティポリシーをSupabaseに適用する手順を案内します。

---

## 1. セキュリティ注意点

> [!CAUTION]
> クライアント拡張機能（`lib/config.js`）には **`SUPABASE_URL`** と公開用の **`SUPABASE_ANON_KEY`** のみを使用してください。`SERVICE_ROLE_KEY` はすべてのRLSをバイパスするため、絶対にコードやGitリポジトリに含めてはなりません。

---

## 2. 移行ファイルの順次実行手順

Supabaseダッシュボードの **SQL Editor** で、`supabase/migrations/` 配下のファイルを番号順に1つずつ実行します：

1. `001_comments_baseline.sql`: 基本テーブル、インデックス、初期RLSポリシー。
2. `002_profiles_public_identity.sql`: `profiles` テーブル、公開ID制約、表示名管理。
3. `003_comment_votes.sql`: `comment_votes` テーブル、いいね/ひどいね集計トリガー。
4. `004_comment_moderation.sql`: `reported_comments` 通報テーブルおよび状態遷移保護。
5. `005_verify_schema.sql`: 読み取り専用のスキーマ検証クエリ。
6. `006_fix_linter_warnings.sql`: リンター警告の解消。
7. `007_one_depth_replies.sql`: `parent_id` による1階層リプライ構造の確立。
