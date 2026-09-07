# 💬 URLComments (Leave your opinion anywhere)

🌍 [🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇯🇵 日本語](README.ja.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇪🇸 Español](README.es.md)

**URLComments** is a privacy-first Chrome extension that turns every normalized web URL into a public discussion space. Leave and discover short public comments on articles, blog posts, documentation, and shopping sites wherever a URL exists.

---

## 🛡️ Privacy-First Principle

URLComments strictly protects your browsing privacy and personal history:

- **No URL Transmission on Page Navigation**: URLs are never automatically sent to Supabase or any external server while you browse the web or switch tabs.
- **Explicit User Interaction Only**: The extension reads the active tab's URL and fetches page-specific comments only after you explicitly open the extension popup/side panel and request a refresh.
- **Strict URL Normalization**: Query parameters (`?query=...`) and hash fragments (`#section`) are excluded, anchoring comments strictly to `origin + pathname`. This prevents leakage of personal identifiers, UTM tracking tags, or session tokens.
- **Zero Surveillance & Telemetry**: Contains no background polling, analytics, telemetry, or remote code execution.

---

## ✨ Key Features

- **Google Sign-In**: Quick and secure authentication via Supabase Auth and Chrome Identity `launchWebAuthFlow`.
- **Normalized URL Comments**: Post comments up to 1,000 characters tied to normalized webpage URLs.
- **Compact Inline Comment Reactions (Like/Dislike)**: Compact, non-wrapping inline reaction group located directly beside author names for efficient space usage and keyboard accessibility.
- **Comment Editing & Soft Deletion**: Edit your own comments or soft-delete them (`is_deleted = true`).
- **1-Depth Multi-Sibling Replies**:
  - An active top-level parent comment can receive multiple sibling replies.
  - Sibling replies render beneath their parent in chronological ascending order (`created_at ASC`).
  - Active parent comments feature an accessible `↳ Reply` control; replies cannot receive further nested replies (strictly 1-depth).
- **Thread-Based In-Memory Pagination**:
  - Top-level comment threads are paginated in chunks of 10 (`THREADS_PER_PAGE = 10`), keeping parents and all their replies together.
  - Page switching renders from in-memory cached threads without making additional Supabase network queries.
  - Preserves reading position on refresh and reply creation, clamping safely on deletions.
- **Strict Chronological ASC Ordering**:
  - All parent comments and replies are consistently ordered oldest-first (`created_at ASC`), using bigint-safe numeric string ID tie-breaking on identical timestamps. Obsolete sort selection has been completely removed.
- **Independent Language Settings (i18n)**:
  - Supports English, Korean, Japanese, Simplified Chinese, Traditional Chinese, Spanish, and System Default.
  - Overcomes `chrome.i18n` browser limitations via a custom i18n module, allowing users to override the extension language instantly from settings.
- **Independent Persistent Font Size Preferences**:
  - Choose between Small, Default, and Large font sizes, persisted in `chrome.storage.local` independently of theme.
  - Scaled across the popup UI using root `data-font-size` attribute and CSS custom properties.
- **Display-Only Username Truncation**:
  - Long usernames are safely truncated visually with CSS ellipsis without mutating data, preserving full names via `title` and `aria-label` separately from public ID tooltips.
- **Deleted-Parent Context Preservation**:
  - Soft-deleted parent comments with active replies display a placeholder (`"This comment was deleted."`) to preserve discussion context.
  - Deleted parents display no Reply action and do not accept new replies.
- **My Comments Lazy Loading & Invalidation**: Loads personal comment history only when opening the My Comments tab. Cache is invalidated on comment/reply creation, edit, or deletion.
- **Theme Persistence**: Supports System Default, Light Mode, and Dark Mode, persisted in `chrome.storage.local`.
- **Public ID Tooltip**: Accessible horizontal tooltip revealing user public IDs on hover and keyboard focus.
- **Auto-Growing Bounded Textarea**: Smoothly resizes between 48px min-height and 140px max-height.

---

## 🏗️ Architecture & Directory Structure

```text
URLComments/
├── manifest.json              # Manifest V3 extension configuration
├── background.js              # Background service worker for side panel and tab event dispatch
├── popup/                     # Frontend popup and side panel modules
│   ├── popup.html             # Markup for Home, My Comments, Settings tabs, and Profile Modal
│   ├── popup.css              # Vanilla CSS theme variables, layouts, and component styles
│   ├── popup.js               # Lifecycle initialization, tab switching, and event delegation
│   ├── comments.js            # Comments fetch, thread grouping, CRUD, replies, and textarea sizing
│   ├── auth.js                # Google OAuth session check and sign-in/sign-out handlers
│   ├── my_comments.js         # Lazy-loaded My Comments view and cache management
│   ├── settings.js            # Theme and preference management
│   ├── ui.js                  # DOM cache and state transitions (loading, empty, list, etc.)
│   ├── state.js               # Global in-memory reactive state store
│   ├── profile.js             # Display name and Public ID management
│   ├── votes.js               # Like/dislike reaction handler
│   └── spa.js                 # Current tab URL extraction and SPA detection
├── content/
│   ├── spaDetector.js         # Content script detecting client-side routing
│   └── config.js              # SPA detector configuration
├── lib/
│   ├── config.js              # Supabase project URL and anon key configuration
│   ├── supabaseClient.js      # Supabase JS client wrapper and Chrome storage adapter
│   ├── publicId.js            # Base62 public user ID generator
│   └── utils.js               # Pure utility helpers
├── utils/
│   └── urlHelper.js           # URL normalization utility (strips query/hash)
├── _locales/                  # Internationalization resources (ko, en)
└── supabase/
    └── migrations/            # Database schema, RLS policies, and database triggers
        ├── 001_comments_baseline.sql
        ├── 002_profiles_public_identity.sql
        ├── 003_comment_votes.sql
        ├── 004_comment_moderation.sql
        ├── 005_verify_schema.sql
        ├── 006_fix_linter_warnings.sql
        └── 007_one_depth_replies.sql
```

---

## 🔑 Extension Permissions Audit

All permissions defined in `manifest.json` adhere to the principle of least privilege:

| Permission | Real Purpose in Codebase |
| :--- | :--- |
| `sidePanel` | Configures and opens the extension UI within Chrome's native side panel via `chrome.sidePanel.setPanelBehavior`. |
| `storage` | Stores theme preferences, cached authentication state, and per-tab SPA detection flags in `chrome.storage.local`. |
| `identity` | Launches Google OAuth web authentication via `chrome.identity.launchWebAuthFlow`. |
| `tabs` | 1) Listens for active tab changes (`chrome.tabs.onActivated`, `chrome.tabs.onUpdated`) in `background.js` to notify the open side panel to prompt manual refresh. 2) Opens original URLs from My Comments in a new tab via `chrome.tabs.create`. |
| `activeTab` | Temporarily grants access to the current tab URL only at the moment the user interacts with the extension popup, without requiring broad `<all_urls>` host permissions. |

> **Follow-up Note**: Future permission reviews will evaluate whether background tab change notifications can be refined to further isolate `tabs` and `activeTab` scopes.

---

## 💻 Local Development & Testing

### Prerequisites
- Node.js 18+
- Google Chrome browser
- Supabase Project (PostgreSQL + Auth)

### 1. Installation
```bash
# Clone repository
git clone https://github.com/s4ngwoo/URLComments.git
cd URLComments

# Install dependencies
npm install
```

### 2. Configure Supabase Credentials
Copy `lib/config.example.js` to `lib/config.js` and set your Supabase project credentials:
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key"
};
```

### 3. Run Unit Tests
Run Jest tests to verify all pure helpers, state flows, 1-depth multi-sibling replies, and DOM structures:
```bash
npm test
```

### 4. Load Unpacked Extension in Chrome
1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `URLComments` repository folder.

---

## 🗄️ Supabase Migrations

Apply migrations sequentially in the Supabase **SQL Editor**:

1. `001_comments_baseline.sql`: Core `comments` table and baseline RLS policies.
2. `002_profiles_public_identity.sql`: Public profile, display name, and Public ID generation.
3. `003_comment_votes.sql`: Comment reaction tables and server-side count triggers.
4. `004_comment_moderation.sql`: Moderation and reporting tables.
5. `005_verify_schema.sql`: Schema integrity verification views and helpers.
6. `006_fix_linter_warnings.sql`: Performance and index optimizations.
7. `007_one_depth_replies.sql`: Foreign key `parent_id`, 1-depth constraint trigger (`check_comment_one_depth()`), and active reply checker function (`comment_has_active_replies()`).

### 📌 Reply Policy & Deferred Multi-Level Nesting
- **Current Policy**: Multiple sibling replies sharing one active top-level parent are supported. Reply-to-reply nesting (>1 depth) is strictly prevented by database triggers.
- **Future Plan**: Deeper multi-level nesting is intentionally deferred. Supporting it will require a database migration altering the `check_comment_one_depth()` trigger and implementing a recursive thread tree component.

---

## ⚠️ Known Limitations

- **No Real-Time Push Updates**: WebSocket realtime subscriptions are intentionally omitted to safeguard privacy, minimize client battery usage, and reduce unnecessary server load. Use the manual refresh (`↻`) button to reload comments.
- **Normalized URL Matching**: Comments are tied to the canonical normalized URL (`origin + pathname`). Websites with dynamic internal state sharing identical URLs will share a single comment space.

---

## 🧪 Manual Verification Checklist

1. **Privacy Verification**:
   - Open Chrome DevTools Network panel, switch tabs, and navigate through websites.
   - Verify that no URL data or background queries are dispatched.
   - Confirm that network requests only occur when opening the popup and clicking refresh.
2. **Multi-Sibling Replies**:
   - Post top-level comment P.
   - Click `↳ Reply` to submit Reply A.
   - Click `↳ Reply` again on parent P to submit Reply B.
   - Verify Reply A and Reply B render in chronological order beneath parent P, and neither reply shows a Reply button.
3. **Soft Deletion & Context Retention**:
   - Soft-delete a top-level parent that has replies.
   - Verify the parent changes to `"This comment was deleted."` while replies remain visible.
   - Confirm the deleted parent no longer displays a Reply button.
4. **My Comments Verification**:
   - Post a comment, navigate to the My Comments tab, and verify the comment is listed.
   - Click "Open original page" and verify it opens in a new tab.
5. **Theme Persistence**:
   - Change theme between System, Light, and Dark mode in Settings.
   - Close and reopen the extension to confirm the theme persists.
6. **Thread Pagination & Position Preservation**:
   - On a page with >10 comment threads, verify the pagination navigation bar (`< Prev`, `1 / N`, `Next >`) is displayed.
   - Click `Next >` and verify that page 2 renders immediately with no network request, keeping parent and all replies grouped together.
   - Trigger a refresh and confirm reading position remains on the current page.
7. **Font Size & Compact Header Verification**:
   - Switch font size between Small, Default, and Large in Settings, confirming the UI scales properly across the extension.
   - Confirm Like and Dislike reactions are rendered directly beside author names in `.comment-header-left` without wrapping, and long usernames are cleanly truncated with an ellipsis.
