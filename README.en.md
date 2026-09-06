# 💬 URLComments (Leave your opinion anywhere)

🇰🇷 [한국어 버전](README.md)

**URLComments** is a Chrome extension that turns every URL on the web into a communication space. Leave your opinions and interact with others on any web page, whether it's an article, blog, or shopping site.

## ✨ Key Features
- **Easy Communication**: Log in with your Google account in seconds and start leaving comments.
- **Real-time Interactions**: Read what others think about the current page (URL) in real-time.
- **Like/Dislike & Sorting**: Vote on helpful comments and sort them by Newest, Most Liked, or Most Disliked.
- **Side Panel Support**: Enjoy a clean side panel UI that doesn't interfere with your web surfing.

## 🛡️ Privacy-First Philosophy
URLComments values your privacy and web browsing history.
- **No Background Tracking**: We do not automatically send your browsing history (URLs) to our servers when you switch tabs or visit websites.
- **Manual Refresh**: Comments for the current page are only loaded when you explicitly click the extension icon or hit the 'Refresh' button in the panel.
- **Data Minimization**: We only use the URL of the current tab and a basic profile (email, name) essential for providing the commenting service.

### Privacy-first refresh

URLComments checks the current page URL and loads comments only when you explicitly request a refresh. It does not automatically send URLs or fetch comments when you switch tabs, navigate pages, or browse in the background.

Auto-refresh may be reconsidered in the future, but it is not currently available because of its privacy, request-cost, and operational implications.

### Planned personalization

URLComments prioritizes safe, curated personalization over user-uploaded media. Future options may include free avatars and curated theme packs. User-uploaded profile images and comment image attachments are not currently available and are not committed roadmap features.

For more details on product policies regarding cost and operation, see [Future Monetization and Avatars](docs/FUTURE_MONETIZATION_AND_AVATARS.md).

## 🚀 Installation and Usage

### For Users (Standard Installation)
1. Install the extension from the **[Chrome Web Store Link]** (Link to be added after release).
2. Pin the 💬 URLComments icon from the extensions menu in the top right corner of your browser.
3. Click the icon on any web page where you want to leave an opinion to open the side panel.
4. Log in with your Google account and freely write your comments!

### For Developers (Local Testing & Contribution)
1. Clone or download this repository.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Turn on **Developer mode** in the top right corner.
4. Click the **[Load unpacked]** button and select the downloaded project folder.

## 🛠️ Contributor Guide

URLComments is open-source, and anyone is free to contribute. Bug reports, feature suggestions, and Pull Requests (PRs) are always welcome!

### Directory Structure
```text
URLComments/
├── manifest.json          # Chrome Extension config
├── background.js          # Background service worker
├── popup/                 # Side panel UI and business logic modules (auth, comments, votes, etc.)
├── content/               # Content scripts (e.g., SPA detection)
├── lib/                   # Supabase client and environment variables
├── utils/                 # Common utilities like URL normalization
└── _locales/              # Internationalization (i18n) files
```

### Running Tests
This project uses Jest for unit testing and has CI configured via GitHub Actions.
When modifying code or adding new features, please make sure they pass the tests using the commands below.

```bash
# Install dependencies
npm install

# Run unit tests
npm test
```

## 📄 License
This project is open for anyone to fork, modify, and use freely.
