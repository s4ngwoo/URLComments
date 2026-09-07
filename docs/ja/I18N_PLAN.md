# 🌐 国際化 (i18n) アーキテクチャと拡張計画

🌍 [English](../I18N_PLAN.md) | [한국어](../ko/I18N_PLAN.md) | [日本語](I18N_PLAN.md) | [中文](../zh/I18N_PLAN.md) | [Español](../es/I18N_PLAN.md)

このドキュメントでは、URLCommentsの言語解決メカニズム、フォールバック戦略、および多言語サポート計画について説明します。

---

## 1. 言語解決とフォールバック

URLCommentsは、Chromeネイティブの国際化API（`chrome.i18n`）を使用し、`_locales/<locale>/messages.json` からUI文字列を動的に適用します。
- `manifest.json` の `default_locale` は `en`（英語）に設定されており、未翻訳キーの最終フォールバックとして機能します。
- 設定画面では、ユーザーが明示的にUI言語を切り替えることも可能です。

---

## 2. 対応言語

- 🇺🇸 英語 (`en`)
- 🇰🇷 韓国語 (`ko`)
- 🇯🇵 日本語 (`ja`)
- 🇨🇳 簡体字中国語 (`zh_CN`)
- 🇹🇼 繁体字中国語 (`zh_TW`)
- 🇪🇸 スペイン語 (`es`)

---

## 3. 翻訳の整合性検証

キーの欠落を防ぐため、Jestによる自動パリティテストがCIで実行されます：

```bash
npm test test/locales.test.js
```
