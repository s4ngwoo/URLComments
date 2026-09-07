# 💬 URLComments (随处留下您的观点)

🌍 [🇺🇸 English](README.md) | [🇰🇷 한국어](README.ko.md) | [🇯🇵 日本語](README.ja.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇪🇸 Español](README.es.md)

**URLComments** 是一款隐私优先 (Privacy-First) 的 Chrome 扩展程序，它将网络上所有规范化的 URL 转变为公共的讨论空间。无论在文章、博客、文档还是购物网站，只要有 URL 存在，您都可以与他人留下简短的公开评论并进行交流。

---

## 🛡️ 隐私优先原则

URLComments 严格保护您的浏览历史和隐私：

- **页面跳转时无自动 URL 传输**: 当您浏览网页或切换标签页时，当前的 URL 绝对不会被自动发送到 Supabase 或任何外部服务器。
- **仅在明确操作时请求**: 只有当用户明确打开扩展程序的弹出窗口（或侧边栏）并请求刷新时，才会读取当前活动标签页的 URL 并获取该页面的评论。
- **严格的 URL 规范化**: 查询参数 (`?query=...`) 和哈希片段 (`#section`) 会被完全剔除，评论仅严格绑定到 `origin + pathname`。这从根本上防止了个人跟踪标识符（如 UTM、会话令牌等）的泄露。
- **无后台监控和遥测**: 不包含任何后台轮询、数据分析 (Analytics)、遥测或远程代码执行。

---

## ✨ 核心功能

- **Google 快捷登录**: 通过 Supabase Auth 和 Chrome Identity `launchWebAuthFlow` 提供安全快速的登录/登出。
- **基于规范化 URL 的公开评论**: 在剥离了查询字符串和哈希的规范化 URL 上发表最多 1000 个字符的公开评论。
- **紧凑的内联评论反馈 (点赞/踩)**: 紧凑、不换行的内联反馈组直接放置在作者昵称旁边，节省空间并完全保证键盘可访问性。
- **评论编辑与软删除**: 支持编辑您自己的评论或进行软删除 (`is_deleted = true`)。
- **一层深度的多兄弟回复 (1-Depth Multi-Sibling Replies)**:
  - 活跃的顶层父评论可以接收多个兄弟回复。
  - 回复将按创建时间的升序 (`created_at ASC`) 渲染在父评论下方。
  - 活跃的顶层评论提供一致的 `↳ 回复` 按钮；回复本身不提供额外的回复按钮（严格限制为一层深度）。
- **基于线程的内存分页**:
  - 顶层评论线程以每页 10 个 (`THREADS_PER_PAGE = 10`) 为单位进行分页渲染，父评论及其所有回复将被作为一个完整的线程进行分组。
  - 切换页面时，无需额外的 Supabase 网络请求，即可直接从当前内存缓存的数据中进行渲染。
  - 刷新或撰写回复时会保留阅读位置，保持当前所在的页面不变。
- **严格的时间升序排序 (Chronological ASC)**:
  - 所有顶层评论和回复始终按创建时间升序 (`created_at ASC`) 进行排序；对于同一时间的评论，使用 bigint 安全的字符串 ID 进行稳定的打平比较。（旧的排序选项及 UI 已被完全移除）
- **独立的语言 (Language) 设置**:
  - 支持简体中文、繁体中文、英语、韩语、日语、西班牙语以及系统默认。
  - 克服了 `chrome.i18n` 依赖于浏览器的局限性，通过自定义 i18n 模块，允许用户在扩展程序内即时覆盖语言设置。
- **独立的字体大小 (Font Size) 首选项**:
  - 提供小 (Small)、默认 (Default)、大 (Large) 选项，并独立于主题永久保存在 `chrome.storage.local` 中。
  - 通过根节点的 `data-font-size` 属性和 CSS 变量，侧边栏的整个 UI 将根据字体大小自然缩放。
- **显示名称的安全截断 (Ellipsis)**:
  - 较长的昵称在视觉上会被省略号 (...) 截断，不会挤压反馈按钮及操作，同时通过 `title` 和 `aria-label` 完整保留全名。
- **已删除父评论的上下文保留**:
  - 如果包含活跃回复的顶层评论被删除，为了保留讨论的上下文，会显示“该评论已被删除”的占位符，并继续显示现有的回复。
  - 已删除的父评论不再显示“回复”按钮，阻止创建新的回复。
- **“我的评论” 延迟加载与缓存失效**: 仅在点击底部导航的“我的评论”标签时才从服务器加载数据。在撰写/编辑/删除评论时，缓存会自动失效以反映最新状态。
- **主题设置的持久性**: 支持系统默认 / 浅色模式 / 深色模式，并永久保存在 `chrome.storage.local` 中。
- **Public ID 提示**: 鼠标悬停或通过键盘聚焦于作者姓名时，提供安全的水平唯一 ID 提示。
- **自动调整高度的 Textarea**: 根据输入长度，文本框的高度会在最小 48px 到最大 140px 之间自然调整。

---

## 🏗️ 架构及目录结构

```text
URLComments/
├── manifest.json              # Manifest V3 扩展程序清单
├── background.js              # 用于侧边栏行为及标签页切换事件的服务工作线程
├── popup/                     # 弹出窗口及侧边栏的前端模块
│   ├── popup.html             # 主页、我的评论、设置标签页及个人资料模态框的标记语言
│   ├── popup.css              # 主题变量、布局和组件样式 (Vanilla CSS)
│   ├── popup.js               # 初始化、标签路由及事件委托
│   ├── comments.js            # 评论获取、线程分组、创建/编辑/删除/回复逻辑
│   ├── auth.js                # Google OAuth 会话检查与登录/登出处理程序
│   ├── my_comments.js         # 我的评论的延迟加载及缓存管理
│   ├── settings.js            # 主题和偏好设置的加载/保存/应用
│   ├── ui.js                  # DOM 元素缓存及状态（加载中/空白/列表等）切换
│   ├── state.js               # 全局响应式内存状态存储
│   ├── profile.js             # 显示名称及唯一 Public ID 管理
│   ├── votes.js               # 顶/踩 投票处理程序
│   └── spa.js                 # 当前标签页 URL 规范化及 SPA 检测
├── content/
│   ├── spaDetector.js         # 客户端路由 (SPA) 检测的内容脚本
│   └── config.js              # SPA 检测配置文件
├── lib/
│   ├── config.js              # Supabase 连接配置 (URL & Anon Key)
│   ├── supabaseClient.js      # Supabase JS 客户端包装器及 Chrome 存储适配器
│   ├── publicId.js            # 基于 Base62 的公开唯一 ID 生成工具
│   └── utils.js               # 纯粹的通用辅助函数
├── utils/
│   └── urlHelper.js           # URL 规范化（移除查询/哈希）工具
├── _locales/                  # 多语言 (i18n) 翻译资源 (ko, en, ja, zh_CN, zh_TW, es)
└── supabase/
    └── migrations/            # 数据库 DDL、RLS 策略及触发器
        ├── 001_comments_baseline.sql
        ├── 002_profiles_public_identity.sql
        ├── 003_comment_votes.sql
        ├── 004_comment_moderation.sql
        ├── 005_verify_schema.sql
        ├── 006_fix_linter_warnings.sql
        └── 007_one_depth_replies.sql
```

---

## 🔑 扩展程序权限 (Permissions Audit)

`manifest.json` 中定义的所有权限都遵循最小权限原则，仅限实际使用目的：

| 权限 | 代码库中的实际用途 |
| :--- | :--- |
| `sidePanel` | 点击扩展图标时，在不干扰浏览的 Chrome 原生侧边栏中打开 UI。 |
| `storage` | 将用户主题设置、Supabase 身份验证令牌及按标签页的 SPA 检测标志安全地保存在 `chrome.storage.local` 中。 |
| `identity` | 通过 `chrome.identity.launchWebAuthFlow` 进行安全的 Google OAuth 登录，而无需外部浏览器窗口。 |
| `tabs` | 1) 在 `background.js` 中监听标签页的激活/更新事件，以通知已打开的侧边栏提示手动刷新。 2) 在“我的评论”中通过 `chrome.tabs.create` 在新标签页中打开原始 URL。 |
| `activeTab` | 仅在用户打开弹出窗口的瞬间，允许临时读取活动标签页的 URL，而无需广泛的 `<all_urls>` 权限。 |

---

## 💻 本地开发与测试方法

### 前置条件
- Node.js 18+
- Google Chrome 浏览器
- Supabase 项目 (PostgreSQL + Auth)

### 1. 安装
```bash
# 克隆仓库
git clone https://github.com/s4ngwoo/URLComments.git
cd URLComments

# 安装依赖项
npm install
```

### 2. 配置 Supabase 凭据
复制 `lib/config.example.js` 为 `lib/config.js` 并设置您的 Supabase 项目信息：
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key"
};
```

### 3. 运行单元测试
使用 Jest 验证所有纯函数、状态流、一层深度的回复逻辑以及 DOM 结构的完整性：
```bash
npm test
```

### 4. 在 Chrome 中加载已解压的扩展程序
1. 在 Chrome 地址栏输入 `chrome://extensions/` 访问扩展程序页面。
2. 开启右上角的 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，然后选择 `URLComments` 的根目录。

---

## 🗄️ 应用 Supabase 迁移

请在 Supabase 仪表板的 **SQL Editor** 中按编号顺序执行以下迁移文件：

1. `001_comments_baseline.sql`: `comments` 表的基础结构及 RLS 策略。
2. `002_profiles_public_identity.sql`: 用户资料、显示名称及 Public ID 的生成。
3. `003_comment_votes.sql`: 顶/踩 投票及服务器端的计数触发器。
4. `004_comment_moderation.sql`: 评论举报及审核表。
5. `005_verify_schema.sql`: 架构完整性验证视图及函数。
6. `006_fix_linter_warnings.sql`: 性能和索引优化。
7. `007_one_depth_replies.sql`: `parent_id` 外键约束、一层深度强制触发器 (`check_comment_one_depth()`) 以及活跃回复检查函数 (`comment_has_active_replies()`)。

### 📌 回复策略及对多级嵌套的考量
- **当前策略**: 在数据库触发器级别，严格禁止对回复进行回复（即深度大于 1 层）。父评论可以拥有多个一层深度的回复。
- **未来计划**: 目前阶段有意排除了多级深度的嵌套回复。如果未来需要支持，将需要进行数据库迁移以修改 `007_one_depth_replies.sql` 触发器，并引入递归渲染组件。

---

## ⚠️ 已知限制 (Known Limitations)

- **不支持实时自动更新**: 出于保护隐私、降低电池消耗及减少不必要服务器负载的考量，我们有意省略了 Supabase Realtime (WebSocket) 订阅。请点击顶部的手动刷新（`↻`）按钮以查看最新评论。
- **基于规范化 URL 的匹配**: 评论是绑定到纯粹的规范化 URL (`origin + pathname`)，而不是页面内容。对于共享相同 URL 但内容完全动态变化的部分网页应用，需要注意其评论空间会被共享。

---

## 🧪 手动验证检查清单

1. **隐私验证**:
   - 打开开发者工具 (F12) 的 Network 面板，切换标签页或浏览网站。
   - 验证扩展程序没有发送任何包含 URL 信息的网络请求。
   - 确认只有在打开弹出窗口/侧边栏并点击刷新时，才会发生规范化 URL 的请求。
2. **多兄弟回复验证**:
   - 发布顶层评论 P。
   - 点击 `↳ 回复` 按钮发布回复 A。
   - 再次点击父评论 P 的 `↳ 回复` 按钮发布回复 B。
   - 验证回复 A 和回复 B 按创建时间升序显示在父评论 P 的下方，且两个回复都没有显示“回复”按钮。
3. **软删除与上下文保留**:
   - 对包含回复的顶层父评论进行软删除。
   - 验证父评论变为“该评论已被删除”，而其现有的回复依然保留。
   - 确认已删除的父评论不再显示“回复”按钮，无法创建新回复。
4. **“我的评论”验证**:
   - 发布评论后，导航至底部“我的评论”标签页，验证评论正常列出。
   - 点击“查看原文”，验证页面在新标签页中打开。
5. **主题设置持久性验证**:
   - 在设置中更改主题（系统、浅色、深色模式）。
   - 关闭并重新打开扩展程序，确认所选主题依然保留。
6. **线程分页及阅读位置保持验证**:
   - 在拥有 10 个以上评论线程的页面上，验证底部显示分页栏 (`< 上一页`, `1 / N`, `下一页 >`)。
   - 点击 `下一页 >`，验证无需网络请求即刻渲染第 2 页，且父评论及其回复正确组合在一起。
   - 刷新页面，确认停留在当前的阅读页面。
7. **字体大小与紧凑标题验证**:
   - 在设置中将字体大小在 小、默认、大 之间切换，确认整个弹出窗口的字体大小立即发生缩放，且重新打开后设置保留。
   - 确认点赞/踩的按钮在作者姓名的右侧紧凑地内联排列，而较长的用户名通过省略号 (...) 被清晰地截断而不换行。
