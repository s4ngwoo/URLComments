# 🌐 国际化 (i18n) 架构与扩展计划

🌍 [English](../I18N_PLAN.md) | [한국어](../ko/I18N_PLAN.md) | [日本語](../ja/I18N_PLAN.md) | [中文](I18N_PLAN.md) | [Español](../es/I18N_PLAN.md)

本文档说明 URLComments 的语言匹配机制、回退策略及多语言翻译校验体系。

---

## 1. 语言判定与回退策略

- 扩展调用 `chrome.i18n.getMessage`，从 `_locales/<locale>/messages.json` 动态加载文案。
- `manifest.json` 中配置 `"default_locale": "en"`，英语为最终回退保障。
- 用户可在“设置”面板中手动切换 UI 语言。

---

## 2. 覆盖语言列表

- 🇺🇸 英语 (`en`)
- 🇰🇷 韩语 (`ko`)
- 🇯🇵 日语 (`ja`)
- 🇨🇳 简体中文 (`zh_CN`)
- 🇹🇼 繁体中文 (`zh_TW`)
- 🇪🇸 西班牙语 (`es`)

---

## 3. 翻译键一致性自动化测试

为了杜绝漏译或多余键污染生产环境，在 CI 流程中严格执行 Jest 一致性测试：

```bash
npm test test/locales.test.js
```
