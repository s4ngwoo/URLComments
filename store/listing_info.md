# Chrome Web Store Listing Information

이 문서는 Chrome Web Store 등록 시 제출해야 하는 정보들을 모아둔 템플릿입니다. 제출 창에 그대로 복사해서 사용하세요.

---

## 1. Store Listing (기본 정보)

### Name (이름)
- **KO:** URLComments – 어디든 남기는 내 의견
- **EN:** URLComments – Leave your opinion anywhere

### Summary (한 줄 설명 - 132자 이내)
- **KO:** URL이 있는 곳이라면 어디서든 사람들의 의견을 확인하고 나의 생각을 자유롭게 남길 수 있는 소셜 주석 확장 프로그램입니다.
- **EN:** A social annotation extension that lets you read others' thoughts and leave your own opinions on any web page based on its URL.

### Description (상세 설명)
**[KO 버전]**
💬 URLComments는 웹상의 모든 URL을 하나의 소통 공간으로 만들어주는 크롬 확장 프로그램입니다!
기사, 블로그, 쇼핑몰 등 댓글 창이 없는 페이지라도 URLComments를 통해 자유롭게 의견을 남기고 다른 사람들의 생각을 확인할 수 있습니다.

💡 무엇을 하는 확장 프로그램인가요?
📌 특정 URL 기반 소통: 현재 접속 중인 웹 페이지의 URL을 기준으로 사람들이 남긴 의견을 모아서 보여줍니다.
✍️ 실시간 의견 남기기: 나만의 생각이나 리뷰, 유용한 팁을 1000자 이내로 자유롭게 작성할 수 있습니다.
⚡ 간편한 인증: 별도의 복잡한 회원가입 없이 Google 계정으로 1초 만에 안전하게 로그인하여 바로 사용할 수 있습니다.

🚀 왜 설치해야 하나요?
✔️ 댓글 창이 없는 곳에서도 소통 가능: 흥미로운 뉴스를 보거나 쇼핑몰에서 상품을 구경할 때, 다른 사람의 진짜 생각이 궁금했던 적 있으신가요? URLComments를 설치하면 어떤 페이지에서든 사람들과 의견을 나눌 수 있습니다!
👣 나만의 웹 서핑 발자취: 유용한 정보가 있는 페이지에 나만의 메모나 의견을 남겨두고 다른 사람과 인사이트를 공유할 수 있습니다.
🔒 프라이버시 중심의 안전한 설계: 백그라운드에서 사용자의 브라우징 기록을 몰래 추적하지 않습니다. 오직 당신이 확장 프로그램 아이콘을 '클릭'했을 때만 작동하여 매우 안전하고 가볍습니다.

**[EN 버전]**
💬 URLComments turns every URL on the web into a communication space!
Even if an article, blog, or shopping page doesn't have a comment section, you can freely leave your thoughts and see what others think using URLComments.

💡 What it does
📌 URL-based Communication: It gathers and displays opinions left by others based on the exact URL of the web page you are currently visiting.
✍️ Real-time Opinion Sharing: You can freely write your own thoughts, reviews, or useful tips (up to 1000 characters).
⚡ Easy Authentication: Log in securely in just 1 second using your Google account without a separate sign-up process.

🚀 Why you should install it
✔️ Communicate where there are no comment sections: Have you ever wondered what other people genuinely think while reading an interesting article or browsing a product on a shopping site? By installing URLComments, you can share opinions with people on ANY web page!
👣 Leave your own digital footprints: Leave your own notes or opinions on pages with useful information and share your insights with others.
🔒 Privacy-focused and Safe: We do not track your browsing history in the background. The extension only works when you explicitly 'click' the icon, making it highly secure and lightweight.

---

## 2. Privacy practices (권한 및 목적 설명)

### Single Purpose Description (단일 목적 설명)
- **KO:** 이 확장 프로그램은 사용자가 아이콘을 클릭했을 때, 현재 페이지의 URL을 기반으로 다른 사람들이 남긴 의견을 조회하고 자신의 의견을 작성하는 단일 기능만을 제공합니다.
- **EN:** This extension provides a single functionality: when the user clicks the icon, it allows them to view and write opinions based on the URL of the current web page.

### Permission Justification (권한 사용 목적)
**1. activeTab**
- **KO:** 사용자가 팝업 아이콘을 클릭했을 때만 현재 탭의 URL을 읽어와 해당 URL에 달린 의견을 조회하고 데이터베이스에 작성하기 위해 사용합니다.
- **EN:** Used to securely read the URL of the current tab only when the user explicitly clicks the extension icon, in order to fetch and post comments for that specific URL.

**2. storage**
- **KO:** Google 로그인 세션 토큰(JWT)과 사용자 프로필 정보를 로컬 환경에 안전하게 저장하고 유지하기 위해 사용합니다.
- **EN:** Used to securely store the Google login session token (JWT) and user profile information locally to maintain the login state.

**3. identity**
- **KO:** 사용자의 Google 계정을 이용한 OAuth 기반 로그인 팝업(`chrome.identity.launchWebAuthFlow`)을 안전하게 열고 인증을 처리하기 위해 사용합니다.
- **EN:** Used to securely open the Google OAuth login popup (`chrome.identity.launchWebAuthFlow`) and handle user authentication.
