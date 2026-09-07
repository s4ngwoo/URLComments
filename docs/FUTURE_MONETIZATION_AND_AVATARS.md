# 🚀 Future Monetization and Avatar System Plans

🌍 [English](FUTURE_MONETIZATION_AND_AVATARS.md) | [한국어](ko/FUTURE_MONETIZATION_AND_AVATARS.md) | [日本語](ja/FUTURE_MONETIZATION_AND_AVATARS.md) | [中文](zh/FUTURE_MONETIZATION_AND_AVATARS.md) | [Español](es/FUTURE_MONETIZATION_AND_AVATARS.md)

This document outlines the internal product decisions, privacy principles, and cost constraints regarding the future monetization, avatar system, and auto-refresh features for URLComments.

---

## 1. Image Upload Policy

- **Arbitrary User Image Uploads**: Not provided
- **Custom Profile Picture Uploads**: Not provided
- **Comment Image Attachments**: Not currently available
- **External Image URL Rendering**: Not provided
- **Base64 Image Storage**: Not provided

### Reason for Policy
- Risk of hosting illegal, abusive, or copyrighted content.
- Privacy, publicity rights, and personal data exposure risks.
- Malware distribution vectors and external image tracking pixels (web beacons).
- Heavy operational burden for image reporting, triage, moderation, and legal compliance.
- Increased infrastructure costs for cloud storage, CDN egress, and automated content filtering.
- Exceeds the complexity budget of the current privacy-first MVP.

---

## 2. Pre-vetted Avatar System

URLComments does **not** allow arbitrary user image uploads.
Instead, we consider offering an operator-curated catalog of static avatars. Users can choose an avatar exclusively from this vetted catalog.

### Design Direction
- The profile database stores only an `avatar_id` string, never an image URL or binary payload.
- Avatar files are bundled directly as extension assets or served from a trusted, operator-controlled static CDN.
- The client resolves `avatar_id` strictly against a pre-defined `AVATAR_CATALOG`.
- Any value outside the catalog falls back to the default avatar.
- User input is never used to construct arbitrary file paths or external image URLs.

```javascript
const AVATAR_CATALOG = {
  'default-comment-bubble': {
    tier: 'free',
    label: 'Comment Bubble'
  },
  'default-blue-hippo': {
    tier: 'free',
    label: 'Blue Hippo'
  },
  'space-hippo-01': {
    tier: 'premium',
    label: 'Space Hippo'
  }
};
```

---

## 3. Auto-Refresh Policy (Withheld)

URLComments checks the current page URL and loads comments **only** when the user explicitly opens the popup or manually clicks refresh (`↻`). It does **not** automatically send URLs or fetch comments when switching tabs, navigating pages, or browsing in the background.

### Why Auto-Refresh is Withheld

#### Privacy
- The core pillar of URLComments is that current URLs are dispatched to the server only upon deliberate user intent.
- Automatic polling would repeatedly leak browsing activity to backend servers as users surf the web.
- Automatically querying URLs across tab changes resembles invasive browsing history telemetry.
- Complicates Chrome Web Store privacy disclosures and permission review justifications.

#### Cost & Operations
- Periodic polling generates redundant database queries and API traffic even on pages with zero comments.
- Increases database read IOPS and egress bandwidth on free/starter Supabase tiers.
- Requires complex client-side lifecycle management (handling active/inactive tabs, side panel state, low-power mode, network reconnections).

#### Product Principles
- The "treasure hunt" discovery mechanic relies on the intentional act of clicking the extension icon.
- Automated updates erode this deliberate experience while inflating infrastructure costs.

---

## 4. Conditions to Reconsider Auto-Refresh

Auto-refresh is not permanently forbidden, but will be re-evaluated only if strict criteria are met:

- Verified high user demand.
- Explicit user opt-in UI (default: **OFF**).
- Enabled strictly on a per-URL basis, never globally.
- Operates only when the tab is active and the side panel/popup is visible.
- Polling intervals capped at a minimum of 5 minutes.
- Clear UI indicator that auto-refresh is active.
- Instant, one-click disable toggle.
- Comprehensive Chrome Web Store permission disclosures and updated Privacy Policy.

---

## 5. Free vs. Premium Tier Concepts

Pricing, subscription models, or one-time purchases will be determined only after validating real user demand and payment processing overhead.

### Free Tier
- Plain text comments (up to 1,000 characters).
- Manual refresh.
- Custom display name & random canonical Public ID.
- Default free avatar selection.
- Like / Dislike reactions.
- Chronological thread & reply reading.

### Supporter / Plus (Subscription Candidate)
- Supporter badge on public profile.
- Access to premium curated avatar packs.
- Early access to new cosmetic theme options.
- Conditional auto-refresh (only if privacy criteria are met).

### One-Time Purchases (Cosmetic Bundles)
- Pre-vetted themed avatar collections:
  - Space Hippo Pack
  - Weird Food Pack
  - Tiny Monsters Pack
  - Hidden Commenter Pack
  - Seasonal Festivity Pack

---

## 6. Withholding Comment Images

Comment image attachments are indefinitely withheld. Unlike static pre-vetted avatars, user-submitted comment images introduce extreme legal and operational liabilities. They will not be implemented until robust reporting workflows, automated moderation, and sustainable monetization are established.
