# 🧪 Supabase Database & RLS Manual Verification Guide

🌍 [English](SUPABASE_MANUAL_TESTS.md) | [한국어](ko/SUPABASE_MANUAL_TESTS.md) | [日本語](ja/SUPABASE_MANUAL_TESTS.md) | [中文](zh/SUPABASE_MANUAL_TESTS.md) | [Español](es/SUPABASE_MANUAL_TESTS.md)

This document provides a comprehensive end-to-end verification checklist to validate database triggers, Row Level Security (RLS) policies, and authorization boundaries in live staging/production environments.

---

## 1. RLS Testing Principles & Limitations of SQL Editor

> [!CAUTION]
> **Row Level Security cannot be fully validated inside the Supabase SQL Editor.**
> 1. **Superuser Privileges (`BYPASSRLS`)**: The SQL Editor executes queries as the administrative `postgres` role, bypassing all RLS policies.
> 2. **Session Switching Limits**: Even when using `set_config('role', 'authenticated', true)`, underlying Postgres session permissions can skew results.
> 3. **Foreign Key Constraints**: `comments.author_id` references `auth.users(id)`. Attempting to simulate dummy UUIDs without real user sessions will trigger foreign key violations before RLS policies are evaluated.
>
> **Reliable RLS verification requires testing with two authentic user accounts (User A and User B) signed in through the Chrome Extension UI.**

---

## 2. Recommended Test Setup (Two-Account Protocol)

- **Test Accounts**: Two distinct Google accounts (`User A`, `User B`).
- **Browser Windows**:
  - Regular window signed in as `User A`.
  - Incognito window (or secondary Chrome profile) signed in as `User B`.
- **Target Webpage**: The same normalized test URL (e.g., `https://example.com/test-article`).

---

## 3. End-to-End Verification Checklist

| # | Verification Scenario | Actor | Expected Result | Status |
|---|---|---|---|---|
| **1** | **Profile Generation & Public ID** | User A | First login generates a `display_name` and canonical `@...` Public ID shown in the UI header. | [ ] |
| **2** | **Comment Creation** | User A | Submitting a comment inserts it into the UI and stores `author_id = User A UUID`, `is_deleted = false` in the DB. | [ ] |
| **3** | **Author Comment Edit** | User A | Clicking Edit ➔ saving displays `(edited)` indicator and updates comment text. | [ ] |
| **4** | **Prevent Unauthorized Edit / Delete** | User B | User B cannot see Edit or Delete buttons on User A's comment. Direct API attempts are blocked by RLS. | [ ] |
| **5** | **1-Depth Multi-Sibling Reply** | User B | Clicking `↳ Reply` on User A's comment submits a reply. Subsequent replies render under the parent chronologically. | [ ] |
| **6** | **Prevent Nested Replies** | User A | Sibling replies never render a `↳ Reply` button (strictly 1-depth). | [ ] |
| **7** | **Report Another User's Comment** | User B | Submitting a report on User A's comment creates a record in `reported_comments`. Button changes to reported status. | [ ] |
| **8** | **Prevent Duplicate Reports** | User B | Attempting to report the same comment again is blocked by unique constraint (`23505`). | [ ] |
| **9** | **Prevent Self-Reporting** | User A | Users cannot see report options on their own comments. Direct API inserts trigger DB exception. | [ ] |
| **10** | **Vote Toggling & Accurate Count** | User B | Clicking 👍 increases `like_count` by 1. Clicking again cancels the vote (-1, never negative). | [ ] |
| **11** | **Author Soft Delete** | User A | Deleting a parent comment sets `is_deleted = true`. Replies remain visible for contextual continuity. | [ ] |
| **12** | **Block Interaction on Deleted Parent** | User B | Deleted parent comments do not display reply affordances or reaction toggles. | [ ] |

---

## 4. Incident Reporting Template

If unexpected database behavior or authorization errors occur during testing, log details using this template:

```text
==================================================
[URLComments Test / Migration Incident Report]
==================================================
1. Location / Component: [Migration file or UI flow]
2. Active Account: [User A / User B / Anon]
3. Supabase Error Code: [e.g., 23505, 42501, PGRST116]
4. Error Message: [Full raw error text]
5. Action Trigger: [SQL query or button clicked]
6. Table Diagnostics:
   - SELECT count(*) FROM comments;
   - SELECT count(*) FROM comment_votes;
==================================================
```
