# 🚀 未来路线图：商业化与头像构想

🌍 [English](../FUTURE_MONETIZATION_AND_AVATARS.md) | [한국어](../ko/FUTURE_MONETIZATION_AND_AVATARS.md) | [日本語](../ja/FUTURE_MONETIZATION_AND_AVATARS.md) | [中文](FUTURE_MONETIZATION_AND_AVATARS.md) | [Español](../es/FUTURE_MONETIZATION_AND_AVATARS.md)

本文档阐述 URLComments 关于未来商业化、头像系统设计及自动刷新功能的决策与隐私边界。

---

## 1. 图片上传规范

- **用户自定义图片上传**: 不提供
- **用户头像上传**: 不提供
- **评论区图片附件**: 目前不提供
- **外部图片链接渲染**: 不提供
- **Base64 存储**: 不提供

### 原因
- 避免违规、有害及侵权内容风险。
- 防止外部图片像素追踪（Web Beacons）侵犯隐私。
- 降低图片存储、审核及带宽成本。

---

## 2. 预审核静态头像方案

URLComments 不允许任意上传图片，而是考虑提供经审核的预置静态头像库：
- 数据库仅存储 `avatar_id` 字符串。
- 头像资源随扩展打包或通过可信静态 CDN 分发。
- 非法 ID 统一回退至默认头像。

---

## 3. 为什么搁置自动刷新功能

URLComments 仅在用户显式打开弹出层或点击刷新按钮（`↻`）时拉取数据：
- **保护隐私**: 后台自动轮询容易被视为在监控用户的网络浏览轨迹。
- **成本控制**: 避免在无评论的网页上产生无意义的高频 API 查询。
- **产品初衷**: 保持类似“寻宝”的主动发现体验。
