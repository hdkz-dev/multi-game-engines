# エンジンバイナリ配布インフラ戦略

> 作成日: 2026-02-06
> ステータス: 検討中

## 1. 背景

全アダプターを MIT ライセンス化するため、エンジンバイナリ (WASM 等) はアダプターに含めず、実行時に外部から動的ロードする設計を採用しました。

このドキュメントでは、エンジンバイナリを配布するためのインフラオプションを検討します。

---

## 2. 配布モデル

### 2.1 三層構造

```text
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: 公式 CDN (推奨)                                    │
│  - プロジェクトが運営する CDN                               │
│  - デフォルトのバイナリソース                               │
└──────────────┬──────────────────────────────────────────────┘
               │ フォールバック
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: ミラー CDN                                         │
│  - コミュニティ運営のミラー                                 │
│  - 地理的分散                                               │
└──────────────┬──────────────────────────────────────────────┘
               │ オプション
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: 自己ホスト                                         │
│  - ユーザーが自サーバーに配置                               │
│  - エンタープライズ向け                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CDN オプション比較

### 3.1 無料/低コスト CDN

| サービス            | 月間転送量 | 特徴                   | 適用シナリオ     |
| ------------------- | ---------- | ---------------------- | ---------------- |
| **Cloudflare R2**   | 10GB 無料  | S3 互換、エグレス無料  | 推奨: プライマリ |
| **jsDelivr**        | 無制限     | npm/GitHub 統合        | OSS ライブラリ   |
| **unpkg**           | 無制限     | npm パッケージ直接配信 | 軽量バイナリ     |
| **GitHub Releases** | 無制限     | GitHub 統合            | バージョン管理   |
| **Vercel Edge**     | 100GB 無料 | グローバル分散         | 補助             |

### 3.2 有料 CDN (大規模向け)

| サービス       | 特徴                     | 用途             |
| -------------- | ------------------------ | ---------------- |
| AWS CloudFront | 高信頼性、カスタマイズ性 | エンタープライズ |
| Fastly         | リアルタイム更新         | 高頻度更新       |
| Bunny CDN      | 低コスト ($0.01/GB)      | コスト最適化     |

---

## 4. 推奨アーキテクチャ

### 4.1 Cloudflare R2 + Workers 構成

```text
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare R2 (ストレージ)                                  │
│  ├── /stockfish/                                            │
│  │   ├── 16.1/                                              │
│  │   │   ├── stockfish.wasm                                │
│  │   │   ├── stockfish.worker.js                           │
│  │   │   └── manifest.json                                 │
│  │   └── latest -> 16.1/                                   │
│  ├── /yaneuraou/                                            │
│  │   └── ...                                                │
│  └── /fairy-stockfish/                                      │
│       └── ...                                               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Workers (API)                                    │
│  - キャッシュ制御                                           │
│  - SRI ハッシュ検証                                         │
│  - アクセス統計                                             │
│  - Geo-based ルーティング                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 URL 設計

```text
https://engines.multi-game-engines.dev/
├── v1/
│   ├── stockfish/
│   │   ├── latest/                  # 最新安定版へのエイリアス
│   │   │   ├── stockfish.wasm
│   │   │   ├── stockfish.worker.js
│   │   │   └── manifest.json
│   │   └── 16.1/                    # 特定バージョン
│   │       └── ...
│   ├── yaneuraou/
│   │   └── ...
│   └── fairy-stockfish/
│       └── ...
└── manifest.json                    # 全エンジン一覧
```

### 4.3 manifest.json 例

```json
{
  "version": "1.0",
  "engines": {
    "stockfish": {
      "name": "Stockfish",
      "license": "GPL-3.0",
      "licenseUrl": "https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt",
      "versions": {
        "16.1": {
          "released": "2024-01-01",
          "files": {
            "wasm": {
              "url": "stockfish.wasm",
              "size": 5242880,
              "sri": "sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
            },
            "worker": {
              "url": "stockfish.worker.js",
              "size": 10240,
              "sri": "sha384-xxx..."
            }
          },
          "capabilities": {
            "threads": true,
            "simd": true,
            "nnue": true
          }
        }
      },
      "latest": "16.1"
    }
  }
}
```

---

## 5. コスト試算

### 5.1 前提条件

- Stockfish WASM: ~5MB
- 月間ダウンロード: 10,000 回
- 月間転送量: ~50GB

### 5.2 コスト比較

| プラン                 | 月額コスト | 備考                      |
| ---------------------- | ---------- | ------------------------- |
| **Cloudflare R2 Free** | $0         | 10GB 無料、超過 $0.015/GB |
| Cloudflare R2 (50GB)   | $0.60      | エグレス無料              |
| AWS S3 + CloudFront    | $5-10      | リクエスト課金あり        |
| Bunny CDN              | $0.50      | $0.01/GB                  |
| 自己ホスト (VPS)       | $5-20      | 管理コスト含む            |

### 5.3 推奨

**初期運用**: Cloudflare R2 Free Tier + jsDelivr ミラー  
**成長後**: Cloudflare R2 Pro またはスポンサーシップ

---

## 6. 自己ホスト向けガイド

### 6.1 Docker イメージ

```dockerfile
FROM nginx:alpine

# エンジンバイナリをコピー
COPY engines/ /usr/share/nginx/html/engines/

# CORS と SRI ヘッダー設定
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 6.2 nginx 設定例

```nginx
server {
    listen 80;

    location /engines/ {
        root /usr/share/nginx/html;

        # CORS
        add_header Access-Control-Allow-Origin *;

        # キャッシュ (1年)
        add_header Cache-Control "public, max-age=31536000, immutable";

        # Content-Type
        types {
            application/wasm wasm;
            application/javascript js;
        }
    }
}
```

### 6.3 バイナリ取得スクリプト (download-engine.sh)

```bash
#!/bin/bash
set -euo pipefail

# 引数
readonly ENGINE="${1:-}"
readonly VERSION="${2:-latest}"
readonly OUTPUT_DIR="${3:-./engines}"

CDN_BASE_URL="https://engines.multi-game-engines.dev"

# manifest.json からファイル一覧と SRI を取得してダウンロード
# (詳細な実装は infrastructure/scripts/download-engine.sh を参照)
```

---

## 7. セキュリティ考慮事項

### 7.1 SRI (Subresource Integrity)

- 全バイナリに SHA-384 ハッシュを付与
- アダプターがロード時に検証
- manifest.json に SRI 情報を格納

### 7.2 HTTPS 強制

- CDN は HTTPS のみ
- HTTP リダイレクトを設定

### 7.3 バージョン固定

- ユーザーはバージョンを明示的に指定可能
- `latest` エイリアスは便利だが、本番環境では固定バージョン推奨

### 7.4 ライセンス表示

- manifest.json にライセンス情報を含める
- CDN のルートにライセンス説明ページを設置

### 7.5 Client-side Loading Example (with SRI)

以下は、ブラウザ上で SRI を検証しながらエンジンをロードするクライアントサイドコードの例です。

```javascript
/**
 * SRI付きでエンジンバイナリをロードする関数
 * @param {string} url - バイナリのURL
 * @param {string} sri - "sha384-..." 形式のハッシュ
 */
async function loadEngineBinary(url, sri) {
  try {
    const response = await fetch(url, {
      integrity: sri,
      cache: "force-cache", // SRI検証にはCORSキャッシュが重要
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch engine: ${response.status} ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();
    console.log("SRI verification passed, binary loaded.");
    return buffer;
  } catch (error) {
    console.error("Engine load failed:", error);
    if (error instanceof TypeError) {
      console.error("Potential SRI mismatch or CORS error.");
    }
    throw error;
  }
}
```

---

## 8. 配布ロードマップ: 3段階リリース計画

### Stage 1: クイックスタート (第1段階リリース)

**目的**: 既存の資産を最大限活用し、早期リリースを実現。

1. **パブリック CDN 活用**: `stockfish` 等の既存 npm パッケージや、jsDelivr 経由で公開されている WASM バイナリを活用。
2. **Adapter 実装**: 外部リソースを動的にロードする `IEngineAdapter` の完成。

### Stage 2: 究極のパワーと制御 (第2段階・ベストプラクティス)

**目的**: 自前ビルドによる最高性能の達成と、独自インフラによる安定供給。

1. **ビルド環境構築**: `/infrastructure/cdn/docker` に Emscripten 環境を構築し、最適ビルドを自動化。
2. **自前 CDN 運用**: Cloudflare R2 + Workers による独自配信。SRI 検証を統合したマニフェストによる配信。

### Stage 3: Hybrid/Native Integration (将来の拡張)

**目的**: モバイルアプリ等におけるネイティブ性能の極限追求。

1. **Native Bridge**: ネイティブプラグインを介して、OS ネイティブでビルドされたエンジンを接続。
2. **メリット**: WASM を超える生の CPU 性能とバックグラウンド実行の実現。

---

## 9. 代替案: jsDelivr + GitHub Releases

### 9.1 構成

```text
GitHub Releases
  └── stockfish-wasm-binaries (GPL-3.0 repo)
      └── v16.1/
          ├── stockfish.wasm
          └── stockfish.worker.js
              │
              ▼
jsDelivr CDN (自動ミラー)
  https://cdn.jsdelivr.net/gh/user/stockfish-wasm-binaries@v16.1/stockfish.wasm
```

### 9.2 メリット

- インフラ管理不要
- GitHub の信頼性
- jsDelivr のグローバル分散

### 9.3 デメリット

- カスタム API なし
- アクセス統計なし
- URL が長い

---

## 10. 結論

### 推奨構成

| 用途               | 推奨サービス                    |
| ------------------ | ------------------------------- |
| **プライマリ CDN** | Cloudflare R2 + Workers         |
| **ミラー**         | jsDelivr (GitHub Releases 経由) |
| **自己ホスト**     | Docker イメージ + nginx         |

### 次のアクション

1. Cloudflare アカウント設定
2. R2 バケット作成 (`engines.multi-game-engines.dev`)
3. Stockfish WASM ビルド・アップロード
4. manifest.json 生成
5. adapter-stockfish にデフォルト URL 設定
