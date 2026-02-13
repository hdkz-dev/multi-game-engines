---
name: security-sentinel
description: アプリケーションの脆弱性を監視し、安全な実装をガイドするスキル
---

# Security Sentinel Skill

このスキルは、アプリケーションの安全性を確保するための「警備員」です。
依存関係の脆弱性、危険なコードパターン、機密情報の漏洩リスクを監視・報告します。

## 主な機能

1.  **Dependency Audit (依存関係監査)**
    - 定期的に `pnpm audit` を実行し、既知の脆弱性を持つパッケージの使用を検出します。
    - 解決策（`pnpm update` コマンド等）を具体的に提示します。

2.  **Secret Scan (機密情報スキャン)**
    - コード内に API キー、トークン、パスワード等がハードコードされていないかチェックします。
    - 正規表現を用いて、`sk-` (OpenAI), `ghp_` (GitHub) などの一般的なパターンの混入を防ぎます。
    - 環境変数 (`.env`) の使用を促します。

3.  **Secure Coding Check (セキュアコーディング)**
    - XSS (クロスサイトスクリプティング) のリスクがある実装を検出します。
      - React: `dangerouslySetInnerHTML` の安易な使用
      - JS: `eval()`, `setTimeout(string)` の使用
    - `next.config.js` におけるセキュリティヘッダー（CSP, HSTS, X-Content-Type-Options 等）の設定状況を確認します。

## 使用例

- 「セキュリティチェックをして」
- 「このコードに脆弱性はない？」
- 「ライブラリのアップデートを確認して」

## 検証コマンド例

- `pnpm audit`
- `grep -r "dangerouslySetInnerHTML" app/ components/`
- `grep -rEi "(api_key|secret|password|token)\s*[:=]\s*['\"][^'\"]+['\"]" .` (簡易スキャン)
