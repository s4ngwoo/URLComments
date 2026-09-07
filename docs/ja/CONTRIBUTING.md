# 🤝 URLComments コントリビューションガイド

🌍 [English](../CONTRIBUTING.md) | [한국어](../ko/CONTRIBUTING.md) | [日本語](CONTRIBUTING.md) | [中文](../zh/CONTRIBUTING.md) | [Español](../es/CONTRIBUTING.md)

URLCommentsプロジェクトへの貢献をご検討いただき、ありがとうございます！このガイドでは、ローカル開発環境のセットアップ、テストの実行、コーディング規約、およびPRの提出方法について説明します。

---

## 📋 前提条件

- **Node.js**: v18.x 以上
- **npm**: v9.x 以上
- **Google Chrome** (またはManifest V3対応のChromiumブラウザ)
- テスト用の **Supabase** アカウント

---

## 🚀 開発環境のセットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/URLComments.git
cd URLComments
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. Supabase接続設定
`lib/config.js` を作成します（セキュリティのため `.gitignore` に含まれています）：

```javascript
// lib/config.js
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

> [!CAUTION]
> **`SERVICE_ROLE_KEY` は絶対に入力しないでください。** クライアント側では公開用 `ANON_KEY` のみを使用します。

### 4. Chromeへの読み込み
1. Chromeで `chrome://extensions` を開きます。
2. 画面右上の **デベロッパーモード** を有効にします。
3. **パッケージ化されていない拡張機能を読み込む** をクリックし、`URLComments` フォルダを選択します。

---

## 🧪 テストの実行

Jestを使用して自動テストを実行します。

```bash
# 全テスト実行
npm test

# 多言語翻訳キーの整合性テスト
npm test test/locales.test.js
```

---

## 🛡️ 設計原則

1. **プライバシー最優先**: バックグラウンドでのタブ監視を行わず、明示的な操作時のみURLを取得・正規化します。
2. **Vanilla JSのモジュール化**: 外部フレームワークを導入せず、軽量で高速な拡張機能を維持します。
3. **BigInt安全なID比較**: Supabase IDは常に `String(a) === String(b)` で比較します。
4. **時系列昇順ソート**: コメントおよび返信は古い順（`created_at ASC`）を厳格に保持します。
