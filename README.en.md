# 💬 URLComments (Hidden Comments like a Treasure Hunt)

🇰🇷 [한국어 버전](README.md)

A Chrome extension that allows you to leave your own comments on any web page and find hidden comments left by others. You can communicate based on the URL anywhere, such as specific articles, blogs, or shopping mall product pages. It provides an experience like finding treasures hidden throughout the internet.

## 1. Project Introduction
- **Service Concept:** A social annotation tool that allows you to check "Who left what comment on this page?" and leave your own mark based on the URL.
- **MVP Features:** 
  - Easy login using Google Account (OAuth)
  - Real-time lookup of comments on the current page (URL)
  - Write your own comments (up to 1000 characters)
  - Exception handling for unsupported pages (e.g., `chrome://`)
- **Target Users:** Anyone who wants to share their thoughts or useful tips about a specific web page with others (Only requires a Google account).

## 2. Tech Stack
- **Frontend (Extension):** HTML, Vanilla CSS, Vanilla JavaScript (Chrome Extension Manifest V3)
- **Backend (BaaS):** Supabase (PostgreSQL, Row Level Security applied)
- **Authentication:** Supabase Auth (Google OAuth Provider), Chrome Identity API
- **Future Plans:** Migration to **Cloudflare Workers (API) + D1 (DB)** in preparation for traffic growth and scaling.

## 3. Project Structure
```text
URLComments/
├── manifest.json          # Chrome Extension config (permissions, version, background script, etc.)
├── popup/
│   ├── popup.html         # Main UI shown when clicking the extension icon
│   ├── popup.css          # Popup UI styling
│   └── popup.js           # Core business logic for the popup (DOM manipulation, Supabase API)
├── lib/
│   ├── supabase.js        # Supabase official UMD bundle library (local caching)
│   ├── supabaseClient.js  # Supabase initialization and Chrome Storage adapter setup
│   └── config.js          # (git ignored) Environment variables file for API keys
├── utils/
│   └── urlHelper.js       # URL normalization logic (removing hashes, lowercase conversion, etc.)
└── supabase_schema.sql    # DB table creation and RLS policy queries
```

## 4. Getting Started

Follow these steps to run and test the project locally.

### Step 1: Supabase Project Creation & DB Setup
1. Sign up for [Supabase](https://supabase.com) and create a new project.
2. Navigate to the **SQL Editor** in the dashboard, paste all the contents of `supabase_schema.sql`, and run it. (Creates tables and grants RLS permissions).

### Step 2: Google OAuth Setup
1. Create a new project in the **Google Cloud Console** and configure the 'OAuth consent screen'.
2. Generate an OAuth 2.0 Client ID for a **Web Application** under 'Credentials'.
3. Add `https://<YOUR_SUPABASE_ID>.supabase.co/auth/v1/callback` to the Authorized redirect URIs.
4. Enter the generated Client ID and Client Secret into the Supabase dashboard (Authentication -> Providers -> Google) and enable it.

### Step 3: Chrome Extension Setup
1. Go to `chrome://extensions/` in your Chrome browser.
2. Turn on 'Developer mode' and click **[Load unpacked]**, then select this project folder.
3. Copy the assigned Extension ID.

### Step 4: Environment Variables & Redirect URI Registration
1. Add `https://<EXTENSION_ID>.chromiumapp.org/` to the Supabase dashboard (Authentication -> URL Configuration -> Redirect URLs).
2. Copy `lib/config.example.js` in the project to create `lib/config.js`.
3. Copy the **Project URL** and **anon key** from the Supabase dashboard (Project Settings -> API) and enter them into `lib/config.js`.

## 5. Testing Checklist

- [ ] **Load Extension:** Does it load without errors in `chrome://extensions`?
- [ ] **Unsupported Pages:** Does it show "Unsupported Page" when opening the popup on `chrome://` or empty tabs?
- [ ] **Login:** Does the popup open and successfully render the profile (email) when clicking the Google login button?
- [ ] **Read/Write Comments:** When writing a comment on a specific website (e.g., google.com), is it immediately reflected in the list, and is the data maintained even after restarting the browser?
- [ ] **URL Normalization:** Are addresses with and without a trailing slash (`/`) treated as the same page?

## 6. Troubleshooting Guide

If you encounter issues during testing, check the scenarios below.

1. **Returns to the login screen after logging in**
   - **Symptom:** Login popup closes but you are not logged in.
   - **Checklist:** Typos in API keys in `lib/config.js` / Is the Extension Redirect URI correctly registered in Supabase? / Check Chrome console errors (right-click popup -> Inspect).
   - **Solution:** Double-check that `https://<EXTENSION_ID>.chromiumapp.org/` is registered in URL Configuration.
2. **Failed to load comments (Error banner displayed)**
   - **Symptom:** A red error banner ("Failed to load comments") appears after logging in.
   - **Checklist:** Does the `comments` table exist? / Are RLS policies set up?
   - **Solution:** Run the `GRANT SELECT ON TABLE comments TO anon, authenticated;` query in the SQL Editor to grant permissions.
3. **Failed to write comment (Error after clicking Submit)**
   - **Symptom:** "permission denied for table comments" error occurs.
   - **Checklist:** Missing INSERT grant or RLS policy (author verification) failure.
   - **Solution:** Run the `GRANT INSERT, UPDATE, DELETE ON TABLE comments TO authenticated;` query.
4. **URL bar visible on unsupported pages**
   - **Symptom:** URL is displayed and comments can be written on local files (`file://`).
   - **Solution:** Check the `isSupportedUrl` function in `utils/urlHelper.js` to strictly block schemes other than `http://` and `https://`.

## 7. Extension Roadmap (Post-MVP)

Key features to be advanced after the MVP release.

| Feature | Priority | Required Work | Notes |
| :--- | :---: | :--- | :--- |
| **Edit/Delete Comments** | **High** | 1. Add `UPDATE`, `DELETE` RLS policies<br>2. Add Edit/Delete buttons on UI for user's own comments | Essential feature to complete basic CRUD |
| **Threaded Replies** | **Medium** | 1. Add `parent_id` (self-referencing FK) column<br>2. Apply indentation rendering in UI | Enhances user interaction and community engagement |
| **Domain Restriction** | **Medium** | 1. Manage allowed/blocked domain list (DB)<br>2. Enhance client URL check logic | Useful for spam prevention and pivoting to specific services |
| **Notifications** | **Low** | 1. Design `notifications` table<br>2. Update notification badge via Background Service Worker | Aims to increase user retention rate |
| **Workers+D1 Migration** | **Low** | 1. Migrate API (REST) to Cloudflare Workers<br>2. Migrate DB to D1 | Reduces DB costs and provides edge caching during traffic spikes |

## 8. Chrome Web Store Privacy Explanations

Privacy guidelines to reference when submitting to the Web Store.
- **Data Minimization:** This extension only collects the **URL information** of the currently active tab and a **basic profile (email, name)** for authentication to provide the commenting feature.
- **Purpose of Permissions Use:**
  - `activeTab`: Used to fetch the URL of the current tab when the user clicks the button.
  - `storage`: Used to temporarily store tokens for maintaining login sessions.
  - `identity`: Used to handle Google OAuth login (`launchWebAuthFlow`).
- **Data Management:** All data is encrypted and securely stored in an external backend (Supabase), and users can log out or unlink their accounts at any time.

## 9. License & Contribution

This project is a working MVP created for a toy project. Anyone is free to fork, modify, and use it. Bug reports and Pull Requests (PR) are always welcome!
