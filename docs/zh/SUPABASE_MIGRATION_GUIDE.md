# 🛠️ Supabase 数据库迁移执行指南

🌍 [English](../SUPABASE_MIGRATION_GUIDE.md) | [한국어](../ko/SUPABASE_MIGRATION_GUIDE.md) | [日本語](../ja/SUPABASE_MIGRATION_GUIDE.md) | [中文](SUPABASE_MIGRATION_GUIDE.md) | [Español](../es/SUPABASE_MIGRATION_GUIDE.md)

本文档说明如何将 URLComments 扩展程序所需的数据库模式与 RLS 安全策略安全地部署至 Supabase。

---

## 1. 密钥安全准则

> [!CAUTION]
> 扩展程序前端代码（`lib/config.js`）只能包含 **`SUPABASE_URL`** 与公开的 **`SUPABASE_ANON_KEY`**。拥有全局管理员特权的 **`SERVICE_ROLE_KEY`** 绝不能打包进客户端或提交至代码仓库。

---

## 2. 迁移脚本顺序执行

在 Supabase 控制台的 **SQL Editor** 中，按编号顺序逐个执行 `supabase/migrations/` 下的文件：

1. `001_comments_baseline.sql`: 基础数据表、索引及基线 RLS。
2. `002_profiles_public_identity.sql`: 用户资料表、公开 ID 正则约束与昵称。
3. `003_comment_votes.sql`: 赞/踩投票表与原子计数缓存触发器。
4. `004_comment_moderation.sql`: 举报表与评论修改/软删除状态保护。
5. `005_verify_schema.sql`: 只读验证查询。
6. `006_fix_linter_warnings.sql`: 修复静态检查警告。
7. `007_one_depth_replies.sql`: `parent_id` 字段及 1 层回复完整性保障。
