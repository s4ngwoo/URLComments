# Privacy Policy for URLComments

**Last Updated:** September 2026

Official website: [https://urlcomments.leesangwoo.com/](https://urlcomments.leesangwoo.com/)  
This policy is also published at [https://urlcomments.leesangwoo.com/privacy/](https://urlcomments.leesangwoo.com/privacy/).

## 1. Introduction
URLComments ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and handle your data when you use the URLComments Chrome Extension ("the Extension").

## 2. Information We Collect
In order to provide our service, we collect the following information:
- **Current Tab URL**: We read the URL of the active tab ONLY when you explicitly open the extension or click the "Refresh" button. We do not track your browsing history in the background.
- **Account Information**: If you choose to sign in via Google OAuth, we collect your email address and basic profile information provided by Google to manage your account and attribute your comments.
- **User Content**: Any comments or votes (likes/dislikes) you submit through the Extension.

## 3. How We Use Your Information
- To display comments relevant to the specific webpage you are currently viewing.
- To allow you to post comments, vote, and report inappropriate content.
- To maintain your logged-in session locally on your device.

## 4. Data Sharing and Security
- We **do not** sell your personal data or browsing information to third parties.
- All user content and account information is stored securely using Supabase, which utilizes industry-standard encryption and Row Level Security (RLS) to ensure data privacy.
- We do not share your data except as necessary to provide the service (e.g., storing it in our secure database).

## 5. Permissions Explained
The Extension requests the following permissions for specific functional reasons:
- **`activeTab`**: To read the URL of the page you are currently looking at when you interact with the extension.
- **`storage`**: To save your authentication token so you don't have to log in repeatedly.
- **`identity`**: To facilitate secure Google OAuth login.
- **`tabs`**: To detect when you navigate to a new page so the extension can prompt you to refresh, avoiding unnecessary automated background requests.
- **`sidePanel`**: To display the extension interface seamlessly next to the webpage.

## 6. Your Rights
You can log out of the Extension at any time, which will remove the local session from your browser. You can also revoke OAuth access via your Google Account settings.

## 7. Contact Us
If you have any questions or concerns about this Privacy Policy or our data practices, please contact the developer via the Chrome Web Store support tab, or see the official website at [https://urlcomments.leesangwoo.com/](https://urlcomments.leesangwoo.com/).
