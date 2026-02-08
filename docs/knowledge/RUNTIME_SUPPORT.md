# 実行環境の Node.js 対応バージョン環境 (2026年時点)

プロジェクト全体の実行環境における Node.js 互換性およびサポート状況を以下にまとめます。

## 1. 原則 (Standard)

本プロジェクトでは、**Node.js 22 (LTS)** 以上をターゲットとします。
これは、Node.js 20 のサポート終了 (2026年4月) が間近であること、および最新の WASM 安定性を確保するためです。

- **推奨**: Node.js 24 (LTS)
- **最小**: Node.js 22.0.0

## 2. Node.js 公式サポート状況 (2026年2月時点)

| バージョン        | ステータス      | EOL (サポート終了) | 備考                                               |
| :---------------- | :-------------- | :----------------- | :------------------------------------------------- |
| **v20 (Iron)**    | Maintenance LTS | 2026年4月30日      | **まもなく終了**。新規採用は避けるべき。           |
| **v22 (Jod)**     | Maintenance LTS | 2027年4月30日      | 安定版。長期運用に適する。                         |
| **v24 (Krypton)** | Active LTS      | 2028年4月30日      | **推奨**。最新機能と長期サポートのバランスが良い。 |
| **v25**           | Current         | 2026年6月1日       | 短命なバージョン。実験目的以外では非推奨。         |

## 3. ホスティング環境別の状況

| プラットフォーム             | 対応状況 (2026年2月)             | 指定方法                                                  |
| :--------------------------- | :------------------------------- | :-------------------------------------------------------- |
| **Cloudflare Workers/Pages** | Node.js API 互換レイヤー提供     | `wrangler.toml` の `compatibility_date` / `nodejs_compat` |
| **Vercel**                   | 20.x, 22.x, 24.x (Default: 24.x) | `package.json` の `engines` または Vercel Dashboard       |
| **Render**                   | 20.x, 22.x (Default: 22.22.0)    | `NODE_VERSION` 環境変数 or `.node-version`                |
| **Oracle Cloud (VM)**        | OS依存 (制限なし)                | `nvm`, `fnm` 等による管理を推奨                           |
| **Google Cloud Run**         | Dockerイメージに依存 (制限なし)  | `Dockerfile` で定義                                       |

## 4. 指定方法の詳細

### Root package.json

プロジェクト全体でバージョンを固定し、開発者の差異を防ぎます。

```json
"engines": {
  "node": ">=22.0.0",
  "npm": ">=10.0.0"
}
```

### Cloudflare Workers (`wrangler.toml`)

Cloudflare は独自のランタイムですが、以下のフラグで Node.js 互換機能を有効化します。

```toml
compatibility_date = "2026-01-01"
compatibility_flags = [ "nodejs_compat" ]
```

## 5. 互換性の維持

WASM モジュールや SharedArrayBuffer の動作を保証するため、以下の機能が各環境でサポートされている必要があります。

- **SharedArrayBuffer**: COOP/COEP ヘッダー依存。マルチスレッド探索に必須。
- **WebAssembly**: Threads (マルチスレッド), SIMD (ベクター演算), Memory 64-bit サポート。
- **WebGPU**: NNUE (ニューラルネットワーク) の推論加速に使用。
- **WebNN API**: 機械学習ベースのエンジンのためのハードウェアアクセラレーション。
- **Origin Private File System (OPFS)**: 大容量の学習データやエンジンの永続化キャッシュ。
- **AbortSignal (Async)**: 探索のキャンセル処理における標準。
- **AsyncIterable**: エンジンからの思考状況（info）をストリーミングするための標準。
- **crypto.randomUUID()**: Node.js 20+ / Browser 標準。
