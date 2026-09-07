# 🤝 Contributing to URLComments

Thank you for your interest in contributing to **URLComments**! This guide provides all necessary instructions to set up your local environment, run tests, understand coding guidelines, and submit contributions.

---

## 📋 Prerequisites

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Google Chrome** (or any Chromium-based browser supporting Manifest V3)
- A **Supabase** account (or local Supabase instance) for database testing

---

## 🚀 Getting Started

### 1. Fork & Clone Repository
```bash
git clone https://github.com/your-username/URLComments.git
cd URLComments
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase Credentials
Create `lib/config.js` (this file is ignored by `.gitignore` to prevent leaking secrets):

```javascript
// lib/config.js
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

> [!CAUTION]
> **Never commit your `SERVICE_ROLE_KEY`.** The client extension must **only** use the public `ANON_KEY`.

### 4. Load Extension into Chrome
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** via the toggle switch in the top-right corner.
3. Click **Load unpacked** and select the root directory of the cloned `URLComments` repository.
4. Pin the URLComments icon to your browser toolbar.

---

## 🧪 Testing

We use [Jest](https://jestjs.io/) along with `jest-environment-jsdom` for automated unit and integration tests.

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npx jest --watch
```

### Test Suite Structure
- `lib/utils.test.js`: URL normalization and sanitization helpers.
- `lib/publicId.test.js`: Canonical pseudonym generation.
- `content/spaDetector.test.js`: SPA URL change detection logic.
- `popup/state.test.js`: State store mutations and selectors.
- `popup/comments.test.js`: 1-depth grouping, chronological sorting, and pagination.
- `popup/votes.test.js`: Like/Dislike reaction flows and optimistic rollbacks.
- `popup/profile.test.js`: Profile and username handlers.
- `popup/my_comments.test.js`: My Comments history and filter views.
- `test/locales.test.js`: **i18n Parity Test** verifying that all localized message files (`en`, `ko`, `ja`, `es`, `zh_CN`, `zh_TW`) have identical translation key sets.

---

## 🌐 Internationalization (i18n)

URLComments supports 6 languages:
- 🇺🇸 English (`en`)
- 🇰🇷 Korean (`ko`)
- 🇯🇵 Japanese (`ja`)
- 🇪🇸 Spanish (`es`)
- 🇨🇳 Simplified Chinese (`zh_CN`)
- 🇹🇼 Traditional Chinese (`zh_TW`)

### Adding a New Translation Key
1. Add the key and description to `_locales/en/messages.json`.
2. Add the corresponding translated messages in all other locale directories (`ko`, `ja`, `es`, `zh_CN`, `zh_TW`).
3. Run `npm test test/locales.test.js` to ensure 100% key parity across all locales.

---

## 🛡️ Coding Principles & Guidelines

1. **Privacy-First (Non-Negotiable)**:
   - **No background tab monitoring**: Never add background scripts or alarms that track user browsing history.
   - **Explicit trigger only**: The active tab URL is accessed only when the popup is opened by the user.
   - **Strict URL normalization**: Always strip query parameters and hash fragments before storing or querying comments.
2. **Vanilla JS Modularity**:
   - Keep modules focused and lightweight. Avoid introducing heavy UI frameworks (React, Vue, Tailwind) that inflate extension package size.
3. **BigInt-Safe IDs**:
   - Supabase `bigint` IDs must always be compared using `String(a) === String(b)` to avoid JavaScript floating point truncation issues.
4. **Chronological Thread Order**:
   - Comments and sibling replies must strictly maintain oldest-first chronological order (`created_at ASC`). Do not reintroduce sorting UI.

---

## 📦 Database Migrations

Database schemas and RLS policies are versioned in `supabase/migrations/`.
- When modifying database schemas, add a sequential migration file (e.g., `008_feature_name.sql`).
- Refer to [docs/SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) for detailed execution instructions.

---

## 📬 Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Verify that all tests pass (`npm test`).
4. Push to your branch and open a Pull Request against the `main` branch.
