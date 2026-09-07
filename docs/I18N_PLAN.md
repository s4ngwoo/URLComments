# 🌐 Internationalization (i18n) Architecture & Expansion Plan

🌍 [English](I18N_PLAN.md) | [한국어](ko/I18N_PLAN.md) | [日本語](ja/I18N_PLAN.md) | [中文](zh/I18N_PLAN.md) | [Español](es/I18N_PLAN.md)

This document outlines the architecture, locale fallback mechanisms, translation workflows, and expansion roadmap for multi-language support in URLComments.

---

## 1. Current Locale Resolution Strategy

The active language in URLComments is resolved through Chrome's native internationalization infrastructure:
- The extension calls `chrome.i18n.getMessage(key)` in JavaScript and uses HTML data attributes (`data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-aria-label`) to populate UI elements from `_locales/<locale>/messages.json`.
- Settings also support explicit user selection, allowing users to override browser defaults dynamically.

---

## 2. Locale Fallback Mechanism

- `manifest.json` specifies `"default_locale": "en"`. English acts as the ultimate fallback for all missing keys or unsupported locales.
- Chrome applies the following locale fallback hierarchy:
  1. Specific regional dialect (e.g., `es_MX`)
  2. Generic language group (e.g., `es`)
  3. `default_locale` (`en`)

---

## 3. Supported Locales & Directory Structure

URLComments currently ships with 6 fully parity-tested locales:

```
_locales/
├── en/messages.json       # English (Canonical source of truth)
├── ko/messages.json       # Korean (한국어)
├── ja/messages.json       # Japanese (日本語)
├── zh_CN/messages.json    # Simplified Chinese (简体中文)
├── zh_TW/messages.json    # Traditional Chinese (繁體中文)
└── es/messages.json       # Spanish (Español)
```

---

## 4. Translation Scope & Rules

### Content Subject to Translation
- Manifest extension name and description.
- Action buttons: Log in, Log out, Refresh, Post, Reply, Edit, Delete, Save, Cancel.
- Empty states, loading spinners, network error banners, and SPA notices.
- Like/Dislike labels and reaction counters.
- Settings labels (Theme, Font Size, UI Language).
- Accessibility attributes (`aria-label`, `title`, tooltips).

### Content Preserved in Original Form (Never Translated)
- **Canonical Public IDs**: E.g., `@longface-hippo-at-mars-7K2M9` remains canonical English format across all language UIs to maintain identity consistency.
- URL strings, origin hosts, and paths.
- Database field names and JavaScript constants.
- User-generated comments and custom display names.

---

## 5. Quality Assurance & Parity Testing

To prevent untranslated or missing keys from reaching production, we enforce automated key parity tests in Jest:

```bash
# Run locale parity validation
npm test test/locales.test.js
```

The test compares the sorted key set of every locale against the canonical reference set. If any locale has missing or excess keys, the test fails immediately in CI.
