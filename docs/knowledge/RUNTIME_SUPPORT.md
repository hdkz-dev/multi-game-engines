# 実行環境の Node.js 対応バージョン環境 (2026年時点)

プロジェクト全体の実行環境における Node.js 互換性およびサポート状況を以下にまとめます。

## 1. 原則 (Standard)

本プロジェクトでは、**Node.js 20 (LTS)** 以上をターゲットとします。
これは、主要なホスティングサービスのサポート終了サイクル（EOL）および最新の WASM/WebReflection 機能を考慮したものです。

- **推奨**: Node.js 22 (LTS) または 24 (LTS)
- **最小**: Node.js 20.0.0

## 2. ホスティング環境別の状況

| プラットフォーム             | 対応状況 (2026年2月)             | 指定方法                                                  |
| :--------------------------- | :------------------------------- | :-------------------------------------------------------- |
| **Cloudflare Workers/Pages** | Node.js API 互換レイヤー提供     | `wrangler.toml` の `compatibility_date` / `nodejs_compat` |
| **Vercel**                   | 20.x, 22.x, 24.x (Default: 24.x) | `package.json` の `engines` または Vercel Dashboard       |
| **Render**                   | 20.x, 22.x (Default: 22.22.0)    | `NODE_VERSION` 環境変数 or `.node-version`                |
| **Oracle Cloud (VM)**        | OS依存 (制限なし)                | `nvm`, `fnm` 等による管理を推奨                           |
| **Google Cloud Run**         | Dockerイメージに依存 (制限なし)  | `Dockerfile` で定義                                       |

## 3. 指定方法の詳細

### Root package.json

プロジェクト全体でバージョンを固定し、開発者の差異を防ぎます。

```json
"engines": {
  "node": ">=20.0.0",
  "npm": ">=10.0.0"
}
```

### Cloudflare Workers (`wrangler.toml`)

Cloudflare は独自のランタイムですが、以下のフラグで Node.js 互換機能を有効化します。

```toml
compatibility_date = "2026-01-01"
compatibility_flags = [ "nodejs_compat" ]
```

## 4. 互換性の維持

WASM モジュールや SharedArrayBuffer の動作を保証するため、以下の機能が各環境でサポートされている必要があります。

- `SharedArrayBuffer` (COOP/COEP ヘッダー依存)
- `WebAssembly` (Memory 64-bit / Threads)
- `crypto.randomUUID()` (Node.js 20+ 標準)
