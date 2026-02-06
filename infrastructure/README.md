# インフラストラクチャ

エンジンバイナリ配布のためのインフラ関連ドキュメントと設定ファイルを格納します。

## 📁 ディレクトリ構成

```text
infrastructure/
├── README.md              # このファイル
├── cdn/
│   ├── CDN_COMPARISON.md  # CDN サービス詳細比較
│   ├── cloudflare/        # Cloudflare R2/Workers 設定
│   ├── nginx/             # 自己ホスト用 nginx 設定
│   └── docker/            # Docker イメージ
└── scripts/
    └── download-engine.sh # エンジンダウンロードスクリプト
```

## 📚 ドキュメント

| ファイル                                                                                                           | 内容                               |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| [cdn/CDN_COMPARISON.md](./cdn/CDN_COMPARISON.md)                                                                   | CDN サービスのコスト・機能詳細比較 |
| [cdn/EXISTING_PACKAGES.md](./cdn/EXISTING_PACKAGES.md)                                                             | 既存 Stockfish WASM パッケージ調査 |
| [../docs/implementation_plans/stockfish-wasm-strategy.md](../docs/implementation_plans/stockfish-wasm-strategy.md) | ベストプラクティス設計・実装計画   |

## 🏆 推奨戦略 (ADR-015)

### 推奨 npm パッケージ

| パッケージ      | バージョン | SF版 | 週間DL | 理由                             |
| --------------- | ---------- | ---- | ------ | -------------------------------- |
| **`stockfish`** | 17.1.0     | 17.1 | 7,883  | Chess.com協力、11年実績、GPL-3.0 |

### 推奨 CDN 構成

| 役割              | サービス      | URL 例                                      | コスト |
| ----------------- | ------------- | ------------------------------------------- | ------ |
| **🥇 Primary**    | jsDelivr      | `cdn.jsdelivr.net/npm/stockfish@17.1.0/...` | **$0** |
| **🥈 Fallback**   | unpkg         | `unpkg.com/stockfish@17.1.0/...`            | **$0** |
| 🥉 将来オプション | Cloudflare R2 | カスタムドメイン                            | **$0** |

## 🚀 クイックスタート

### Cloudflare R2 セットアップ

1. Cloudflare アカウント作成
2. R2 バケット作成 (`engine-binaries`)
3. Workers でカスタムドメイン設定
4. バイナリアップロード

### 自己ホスト

```bash
# Docker イメージビルド
docker build -t engine-cdn ./cdn/docker

# 起動
docker run -p 8080:80 engine-cdn
```

## 📊 コスト概要

| 月間ダウンロード | 転送量 | Cloudflare R2 | jsDelivr | unpkg  | GitHub Releases | Bunny CDN | AWS CloudFront |
| ---------------- | ------ | ------------- | -------- | ------ | --------------- | --------- | -------------- |
| 10,000           | 50 GB  | **$0**        | **$0**   | **$0** | **$0**          | $1        | $4.38          |
| 100,000          | 500 GB | **$0**        | **$0**   | **$0** | **$0**          | $6        | $43            |
| 1,000,000        | 5 TB   | **$0**        | **$0**   | **$0** | ⚠️ 制限         | $60       | $425           |

### 無料 CDN 比較

| サービス            | 転送量上限 | ファイルサイズ上限 | カスタム API | カスタムドメイン |
| ------------------- | ---------- | ------------------ | ------------ | ---------------- |
| **Cloudflare R2**   | 無制限     | 無制限             | ✅ (Workers) | ✅               |
| **jsDelivr**        | 無制限     | 50 MB              | ❌           | ❌               |
| **GitHub Releases** | 無制限\*   | 2 GB               | ❌           | ❌               |
| **unpkg**           | 無制限     | 制限なし           | ❌           | ❌               |

\*GitHub Releases は大規模利用時にレート制限の可能性あり
