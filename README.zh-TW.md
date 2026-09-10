<p align="center">
  <img src="assets/marquee-promo-tile.png" alt="URLComments Banner" width="100%">
</p>

# 💬 URLComments (隨處留下您的觀點)

🌍 [🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇯🇵 日本語](README.ja.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇪🇸 Español](README.es.md)

**URLComments** 是一款隱私優先 (Privacy-First) 的 Chrome 擴充功能，它將網路上所有規範化的 URL 轉變為公共的討論空間。無論在文章、部落格、文件還是購物網站，只要有 URL 存在，您都可以與他人留下簡短的公開留言並進行交流。

**官網:** [https://urlcomments.leesangwoo.com/](https://urlcomments.leesangwoo.com/) · [隱私權政策](https://urlcomments.leesangwoo.com/privacy/) · [服務條款](https://urlcomments.leesangwoo.com/terms/)

---

## 🚀 快速上手與使用指南 (Usage)

### 1. 安裝步驟 (載入未封裝擴充功能)
1. 從 [GitHub Releases](https://github.com/s4ngwoo/URLComments/releases) 下載最新版本的 **`URLComments-vX.X.X.zip`**。
2. 將下載的 ZIP 檔案解壓縮至本機資料夾。
3. 開啟 Google Chrome 瀏覽器，在網址列輸入 `chrome://extensions`。
4. 開啟右上角的 **開發人員模式 (Developer mode)**。
5. 點擊左上角的 **載入未封裝項目 (Load unpacked)**，選擇剛剛解壓縮的資料夾。
6. 在瀏覽器右上角工具列中釘選 (Pin) URLComments 圖示。

### 2. 使用方法
1. **瀏覽網頁**: 前往任何想留下或閱讀留言的網頁（新聞文章、部落格、技術文件、購物網站等）。
2. **開啟擴充功能**: 點擊工具列中的 URLComments 圖示開啟側邊欄或彈出視窗。
3. **Google 登入**: 點擊 Google 登入按鈕進行快速安全登入（僅需首次授權）。
4. **閱讀留言**: 瀏覽其他使用者在目前規範化 URL 下留下的公開觀點。
5. **發表與互動**:
   - 在底部輸入框輸入內容（最多 1,000 字）並點擊 **發布**。
   - 點擊留言下方的 `↳ 回覆` 參與 1 層樹狀討論。
   - 點擊作者暱稱旁邊的 👍 / 👎 留下評價。
6. **我的留言與設定**: 使用底部導覽列檢視您的歷史留言，或自訂深色模式、字體大小與介面語言。

---

## 🛡️ 隱私優先原則

URLComments 嚴格保護您的瀏覽歷史和隱私：

- **頁面跳轉時無自動 URL 傳輸**: 當您瀏覽網頁或切換分頁時，目前的 URL 絕對不會被自動發送到 Supabase 或任何外部伺服器。
- **僅在明確操作時請求**: 只有當用戶明確打開擴充功能的彈出視窗（或側邊欄）並請求重新整理時，才會讀取目前活躍分頁的 URL 並獲取該頁面的留言。
- **嚴格的 URL 規範化**: 查詢參數 (`?query=...`) 和雜湊片段 (`#section`) 會被完全剔除，留言僅嚴格綁定到 `origin + pathname`。這從根本上防止了個人追蹤識別碼（如 UTM、工作階段權杖等）的洩露。
- **無後台監控和遙測**: 不包含任何後台輪詢、數據分析 (Analytics)、遙測或遠端程式碼執行。

---

## ✨ 核心功能

- **Google 快捷登入**: 透過 Supabase Auth 和 Chrome Identity `launchWebAuthFlow` 提供安全快速的登入/登出。
- **基於規範化 URL 的公開留言**: 在剝離了查詢字串和雜湊的規範化 URL 上發表最多 1000 個字元的公開留言。
- **緊湊的內嵌留言反饋 (按讚/倒讚)**: 緊湊、不換行的內嵌反饋群組直接放置在作者暱稱旁邊，節省空間並完全保證鍵盤無障礙操作。
- **留言編輯與軟刪除**: 支援編輯您自己的留言或進行軟刪除 (`is_deleted = true`)。
- **一層深度的多兄弟回覆 (1-Depth Multi-Sibling Replies)**:
  - 活躍的頂層父留言可以接收多個兄弟回覆。
  - 回覆將按建立時間的升序 (`created_at ASC`) 渲染在父留言下方。
  - 活躍的頂層留言提供一致的 `↳ 回覆` 按鈕；回覆本身不提供額外的回覆按鈕（嚴格限制為一層深度）。
- **基於執行緒的記憶體分頁**:
  - 頂層留言執行緒以每頁 10 個 (`THREADS_PER_PAGE = 10`) 為單位進行分頁渲染，父留言及其所有回覆將被作為一個完整的執行緒進行分組。
  - 切換頁面時，無需額外的 Supabase 網路請求，即可直接從目前記憶體快取的資料中進行渲染。
  - 重新整理或撰寫回覆時會保留閱讀位置，保持目前所在的頁面不變。
- **嚴格的時間升序排序 (Chronological ASC)**:
  - 所有頂層留言和回覆始終按建立時間升序 (`created_at ASC`) 進行排序；對於同一時間的留言，使用 bigint 安全的字串 ID 進行穩定的打平比較。（舊的排序選項及 UI 已被完全移除）
- **獨立的語言 (Language) 設定**:
  - 支援繁體中文、簡體中文、英語、韓語、日語、西班牙語以及系統預設。
  - 克服了 `chrome.i18n` 依賴於瀏覽器的侷限性，透過自訂 i18n 模組，允許用戶在擴充功能內即時覆蓋語言設定。
- **獨立的字體大小 (Font Size) 偏好設定**:
  - 提供小 (Small)、預設 (Default)、大 (Large) 選項，並獨立於主題永久保存在 `chrome.storage.local` 中。
  - 透過根節點的 `data-font-size` 屬性和 CSS 變數，側邊欄的整個 UI 將根據字體大小自然縮放。
- **顯示名稱的安全截斷 (Ellipsis)**:
  - 較長的暱稱在視覺上會被省略號 (...) 截斷，不會擠壓反饋按鈕及操作，同時透過 `title` 和 `aria-label` 完整保留全名。
- **已刪除父留言的上下文保留**:
  - 如果包含活躍回覆的頂層留言被刪除，為了保留討論的上下文，會顯示「該留言已被刪除」的佔位符，並繼續顯示現有的回覆。
  - 已刪除的父留言不再顯示「回覆」按鈕，阻止建立新的回覆。
- **「我的留言」 延遲載入與快取失效**: 僅在點擊底部導航的「我的留言」標籤時才從伺服器載入資料。在撰寫/編輯/刪除留言時，快取會自動失效以反映最新狀態。
- **主題設定的持久性**: 支援系統預設 / 淺色模式 / 深色模式，並永久保存在 `chrome.storage.local` 中。
- **Public ID 提示**: 滑鼠懸停或透過鍵盤聚焦於作者姓名時，提供安全的水平唯一 ID 提示。
- **自動調整高度的 Textarea**: 根據輸入長度，文字方塊的高度會在最小 48px 到最大 140px 之間自然調整。

---

## 🏗️ 架構及目錄結構

```text
URLComments/
├── manifest.json              # Manifest V3 擴充功能清單
├── background.js              # 用於側邊欄行為及分頁切換事件的服務工作執行緒
├── popup/                     # 彈出視窗及側邊欄的前端模組
│   ├── popup.html             # 主頁、我的留言、設定標籤頁及個人資料模態框的標記語言
│   ├── popup.css              # 主題變數、佈局和元件樣式 (Vanilla CSS)
│   ├── popup.js               # 初始化、標籤路由及事件委派
│   ├── comments.js            # 留言獲取、執行緒分組、建立/編輯/刪除/回覆邏輯
│   ├── auth.js                # Google OAuth 會話檢查與登入/登出處理程序
│   ├── my_comments.js         # 我的留言的延遲載入及快取管理
│   ├── settings.js            # 主題和偏好設定的載入/保存/套用
│   ├── ui.js                  # DOM 元素快取及狀態（載入中/空白/列表等）切換
│   ├── state.js               # 全局響應式記憶體狀態儲存
│   ├── profile.js             # 顯示名稱及唯一 Public ID 管理
│   ├── votes.js               # 按讚/倒讚 投票處理程序
│   └── spa.js                 # 目前分頁 URL 規範化及 SPA 檢測
├── content/
│   ├── spaDetector.js         # 用戶端路由 (SPA) 檢測的內容腳本
│   └── config.js              # SPA 檢測設定檔
├── lib/
│   ├── config.js              # Supabase 連線設定 (URL & Anon Key)
│   ├── supabaseClient.js      # Supabase JS 用戶端包裝器及 Chrome 儲存配接器
│   ├── publicId.js            # 基於 Base62 的公開唯一 ID 產生工具
│   └── utils.js               # 純粹的通用輔助函數
├── utils/
│   └── urlHelper.js           # URL 規範化（移除查詢/雜湊）工具
├── _locales/                  # 多語言 (i18n) 翻譯資源 (ko, en, ja, zh_CN, zh_TW, es)
└── supabase/
    └── migrations/            # 資料庫 DDL、RLS 策略及觸發程序
        ├── 001_comments_baseline.sql
        ├── 002_profiles_public_identity.sql
        ├── 003_comment_votes.sql
        ├── 004_comment_moderation.sql
        ├── 005_verify_schema.sql
        ├── 006_fix_linter_warnings.sql
        └── 007_one_depth_replies.sql
```

---

## 🔑 擴充功能權限 (Permissions Audit)

`manifest.json` 中定義的所有權限都遵循最小權限原則，僅限實際使用目的：

| 權限 | 程式碼庫中的實際用途 |
| :--- | :--- |
| `sidePanel` | 點擊擴充圖示時，在不干擾瀏覽的 Chrome 原生側邊欄中打開 UI。 |
| `storage` | 將用戶主題設定、Supabase 身份驗證權杖及按分頁的 SPA 檢測標誌安全地保存在 `chrome.storage.local` 中。 |
| `identity` | 透過 `chrome.identity.launchWebAuthFlow` 進行安全的 Google OAuth 登入，而無需外部瀏覽器視窗。 |
| `tabs` | 1) 在 `background.js` 中監聽分頁的啟動/更新事件，以通知已打開的側邊欄提示手動重新整理。 2) 在「我的留言」中透過 `chrome.tabs.create` 在新分頁中打開原始 URL。 |
| `activeTab` | 僅在用戶打開彈出視窗的瞬間，允許臨時讀取活躍分頁的 URL，而無需廣泛的 `<all_urls>` 權限。 |

---

## 💻 本地開發與測試方法

### 前置條件
- Node.js 18+
- Google Chrome 瀏覽器
- Supabase 專案 (PostgreSQL + Auth)

### 1. 安裝
```bash
# 複製存放區
git clone https://github.com/s4ngwoo/URLComments.git
cd URLComments

# 安裝相依套件
npm install
```

### 2. 配置 Supabase 憑證
複製 `lib/config.example.js` 為 `lib/config.js` 並設定您的 Supabase 專案資訊：
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key"
};
```

### 3. 執行單元測試
使用 Jest 驗證所有純函數、狀態流、一層深度的回覆邏輯以及 DOM 結構的完整性：
```bash
npm test
```

### 4. 在 Chrome 中載入未封裝的擴充功能
1. 在 Chrome 網址列輸入 `chrome://extensions/` 訪問擴充功能頁面。
2. 開啟右上角的 **開發人員模式**。
3. 點擊 **載入未封裝項目**，然後選擇 `URLComments` 的根目錄。

---

## 🗄️ 套用 Supabase 遷移

請在 Supabase 儀表板的 **SQL Editor** 中按編號順序執行以下遷移檔案：

1. `001_comments_baseline.sql`: `comments` 表的基礎結構及 RLS 策略。
2. `002_profiles_public_identity.sql`: 用戶資料、顯示名稱及 Public ID 的產生。
3. `003_comment_votes.sql`: 按讚/倒讚 投票及伺服器端的計數觸發程序。
4. `004_comment_moderation.sql`: 留言舉報及審核表。
5. `005_verify_schema.sql`: 架構完整性驗證視圖及函數。
6. `006_fix_linter_warnings.sql`: 效能和索引最佳化。
7. `007_one_depth_replies.sql`: `parent_id` 外部金鑰約束、一層深度強制觸發程序 (`check_comment_one_depth()`) 以及活躍回覆檢查函數 (`comment_has_active_replies()`)。

### 📌 回覆策略及對多級嵌套的考量
- **目前策略**: 在資料庫觸發程序層級，嚴格禁止對回覆進行回覆（即深度大於 1 層）。父留言可以擁有多個一層深度的回覆。
- **未來計畫**: 目前階段有意排除了多級深度的嵌套回覆。如果未來需要支援，將需要進行資料庫遷移以修改 `007_one_depth_replies.sql` 觸發程序，並引入遞迴渲染元件。

---

## ⚠️ 已知限制 (Known Limitations)

- **不支援即時自動更新**: 出於保護隱私、降低電池消耗及減少不必要伺服器負載的考量，我們有意省略了 Supabase Realtime (WebSocket) 訂閱。請點擊頂部的手動重新整理（`↻`）按鈕以查看最新留言。
- **基於規範化 URL 的比對**: 留言是綁定到純粹的規範化 URL (`origin + pathname`)，而不是頁面內容。對於共享相同 URL 但內容完全動態變化的部分網頁應用，需要注意其留言空間會被共享。

---

## 🧪 手動驗證檢查清單

1. **隱私驗證**:
   - 打開開發人員工具 (F12) 的 Network 面板，切換分頁或瀏覽網站。
   - 驗證擴充功能沒有發送任何包含 URL 資訊的網路請求。
   - 確認只有在打開彈出視窗/側邊欄並點擊重新整理時，才會發生規範化 URL 的請求。
2. **多兄弟回覆驗證**:
   - 發佈頂層留言 P。
   - 點擊 `↳ 回覆` 按鈕發佈回覆 A。
   - 再次點擊父留言 P 的 `↳ 回覆` 按鈕發佈回覆 B。
   - 驗證回覆 A 和回覆 B 按建立時間升序顯示在父留言 P 的下方，且兩個回覆都沒有顯示「回覆」按鈕。
3. **軟刪除與上下文保留**:
   - 對包含回覆的頂層父留言進行軟刪除。
   - 驗證父留言變為「該留言已被刪除」，而其現有的回覆依然保留。
   - 確認已刪除的父留言不再顯示「回覆」按鈕，無法建立新回覆。
4. **「我的留言」驗證**:
   - 發佈留言後，導航至底部「我的留言」標籤頁，驗證留言正常列出。
   - 點擊「查看原文」，驗證頁面在新分頁中打開。
5. **主題設定持久性驗證**:
   - 在設定中更改主題（系統、淺色、深色模式）。
   - 關閉並重新打開擴充功能，確認所選主題依然保留。
6. **執行緒分頁及閱讀位置保持驗證**:
   - 在擁有 10 個以上留言執行緒的頁面上，驗證底部顯示分頁列 (`< 上一頁`, `1 / N`, `下一頁 >`)。
   - 點擊 `下一頁 >`，驗證無需網路請求即刻渲染第 2 頁，且父留言及其回覆正確組合在一起。
   - 重新整理頁面，確認停留在目前的閱讀頁面。
7. **字體大小與緊湊標題驗證**:
   - 在設定中將字體大小在 小、預設、大 之間切換，確認整個彈出視窗的字體大小立即發生縮放，且重新打開後設定保留。
   - 確認按讚/倒讚的按鈕在作者姓名的右側緊湊地內嵌排列，而較長的使用者名稱透過省略號 (...) 被清晰地截斷而不換行。

---

## 🤝 貢獻程式碼 (Contributing)

熱烈歡迎任何形式的貢獻、Bug 回報與功能建議！

- **貢獻指南**: 詳細的本地開發環境建立、程式碼規範與 PR 提交流程，請參閱 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。
- **架構概覽**: 深入了解系統設計與隱私保證原則，請參閱 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。
- **快速開始**:
  ```bash
  npm install              # 安裝開發依賴套件
  npm test                 # 執行自動化測試套件 (Jest)
  npm test test/locales    # 驗證 6 種語言本地化翻譯鍵的一致性
  ```
- **隱私第一原則**: 所有貢獻的程式碼必須嚴格遵循隱私優先原則（嚴禁背景分頁監控、僅在使用者明確開啟彈出視窗時發起請求、嚴格執行 URL 規範化）。
