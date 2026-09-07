# Chrome Web Store Justifications

## 1. Single Purpose
This extension lets you discover and leave hidden comments on the current page URL. It provides a shared communication space anchored to web addresses, and does nothing else.

## 2. Permission Justification

### `activeTab`
Used only when you click the extension icon to read the current tab's URL and show comments for that specific page. We do not track your browsing history in the background.

### `storage`
Stores your Google login session (OAuth tokens) and basic user profile locally so you don't have to log in every time you open the extension.

### `identity`
Required to open the Google OAuth popup for secure sign-in via the `chrome.identity.launchWebAuthFlow` API.

### `tabs`
Used strictly to detect when you change tabs or navigate to a new page so the side panel can prompt you to refresh the comments. This ensures the extension does not automatically poll the server on every tab change, minimizing privacy impact and data usage.

### `sidePanel`
Used to display the extension's user interface alongside the webpage, allowing you to read and write comments without leaving the current context.
