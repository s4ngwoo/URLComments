# 🤝 URLComments 贡献指南

🌍 [English](../CONTRIBUTING.md) | [한국어](../ko/CONTRIBUTING.md) | [日本語](../ja/CONTRIBUTING.md) | [中文](CONTRIBUTING.md) | [Español](../es/CONTRIBUTING.md)

感谢关注并愿意为 URLComments 项目贡献力量！本指南将协助您搭建本地开发环境、运行测试用例及遵循核心代码规范。

---

## 📋 准备工作

- **Node.js**: v18.x 或更高
- **npm**: v9.x 或更高
- **Google Chrome** 或兼容 Manifest V3 的 Chromium 浏览器
- 用于测试的 **Supabase** 账号

---

## 🚀 本地开发搭建

### 1. 克隆代码仓库
```bash
git clone https://github.com/your-username/URLComments.git
cd URLComments
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 Supabase 凭据
创建 `lib/config.js`（此文件已被 `.gitignore` 忽略以防泄露）：

```javascript
// lib/config.js
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

> [!CAUTION]
> **绝对不要包含 `SERVICE_ROLE_KEY`。** 客户端扩展只能且必须使用公开的 `ANON_KEY`。

### 4. 在 Chrome 中加载扩展
1. 打开 Chrome 访问 `chrome://extensions`。
2. 开启右上角的 **开发者模式 (Developer mode)**。
3. 点击 **加载已解压的扩展程序 (Load unpacked)**，选择 `URLComments` 项目根目录。

---

## 🧪 运行测试

使用 Jest 运行全部单元与集成测试：

```bash
# 执行全部测试
npm test

# 执行多语言一致性测试
npm test test/locales.test.js
```

---

## 🛡️ 开发守则

1. **隐私优先（不可妥协）**: 严禁后台追踪标签页浏览历史，仅在用户主动打开扩展时发起网络请求。
2. **纯原生模块化**: 保持轻量高效，杜绝引入重型前端框架。
3. **BigInt 安全对比**: 数据库 ID 必须通过 `String(a) === String(b)` 进行安全比较。
4. **时间顺序排列**: 评论与回复严格遵循最早在前（`created_at ASC`）。
