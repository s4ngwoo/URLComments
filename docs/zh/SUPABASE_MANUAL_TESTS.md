# 🧪 Supabase 数据库与 RLS 手动验证指南

🌍 [English](../SUPABASE_MANUAL_TESTS.md) | [한국어](../ko/SUPABASE_MANUAL_TESTS.md) | [日本語](../ja/SUPABASE_MANUAL_TESTS.md) | [中文](SUPABASE_MANUAL_TESTS.md) | [Español](../es/SUPABASE_MANUAL_TESTS.md)

本文档提供迁移上线后，验证数据库触发器与行级安全策略（RLS）是否按预期运作的端到端测试流程。

---

## 1. 验证原则

> [!CAUTION]
> **Supabase SQL Editor 无法完全测试 RLS。**
> SQL Editor 具有超级用户（`BYPASSRLS`）特权。可靠的 RLS 验证必须通过 Chrome 扩展 UI 使用两个真实已登录账号（User A 与 User B）进行。

---

## 2. 核心验证项目

| 序号 | 验证场景 | 执行账号 | 预期结果 |
|---|---|---|---|
| **1** | **个人资料与公开 ID** | User A | 首次登录自动生成显示名与 `@...` 公开唯一标识 |
| **2** | **发布评论** | User A | 提交后即刻显示在列表，DB 中 `is_deleted = false` |
| **3** | **编辑本人评论** | User A | 编辑后保存显示 `(已编辑)` 标记，文本更新 |
| **4** | **禁止越权修改/删除** | User B | 无法看到 User A 评论上的编辑/删除按钮，API 请求被 RLS 拦截 |
| **5** | **1 层子回复** | User B | 点击 `↳ 回复` 可以向 User A 的评论提交子回复 |
| **6** | **禁止嵌套回复** | User A | 子回复自身绝不提供回复按钮（严格限制 1 层深度） |
| **7** | **举报他人评论** | User B | 举报被写入 `reported_comments`，再次举报被唯一性约束拦截 |
| **8** | **软删除与上下文保留** | User A | 删除主评论后标记为已删除，但子回复依然保留以维持对话上下文 |
