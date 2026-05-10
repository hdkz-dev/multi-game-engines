# Runbook: Cloudflare cdn-worker Deployment

## 目的

`infrastructure/cdn/cloudflare/worker.ts` を Cloudflare Workers + R2 にデプロイし、`engines.json` の URL を独自 CDN へ切り替える。

## 前提

- Worker コードは実装済 (`worker.ts`, `wrangler.toml`)
- ローカル `wrangler` バージョン: 4.90.0 (確認済)
- `wrangler deploy --dry-run` 成功確認済 (Total Upload 3.94 KiB / gzip 1.38 KiB, 2026-05-10 検証)
- 現状 GitHub Pages で全エンジン配信済み (HTTP 200, SRI 確定) — 移行は **必須ではなく選択肢**

## 移行を選ぶ動機

| 動機                     | 該当する場合に検討                                               |
| ------------------------ | ---------------------------------------------------------------- |
| 帯域コスト最適化         | 月間トラフィック >100 GB                                         |
| 地理的 latency           | 日本以外の利用者が多い (Cloudflare は global edge)               |
| 大規模ファイル配信       | 100 MB 超のモデル (Range request, R2 が GitHub Pages より好相性) |
| `__unsafeNoSRI` 完全排除 | 不要 (PR #134 で達成済)                                          |

### 移行を見送る場合

GitHub Pages のままで問題ない。本 runbook は「将来必要になったとき」の手順として保管。

## 手順

### 1. Cloudflare アカウント準備

```bash
# 1.1 Cloudflare アカウント作成 (無料プランで可)
#     https://dash.cloudflare.com/sign-up

# 1.2 R2 を有効化 (R2 タブ → "Enable R2")
#     ※ クレジットカード登録必要 (10 GB / 月までは無料枠)

# 1.3 API token 発行 (Account → API Tokens → Create Custom Token)
#     必要権限:
#       - Account: Workers Scripts:Edit
#       - Account: Account Settings:Read
#       - Account: Workers R2 Storage:Edit
```

### 2. wrangler 認証

```bash
cd infrastructure/cdn/cloudflare
pnpm exec wrangler login
# ブラウザで OAuth フロー → 認可完了
```

または CI 用に環境変数で:

```bash
export CLOUDFLARE_API_TOKEN="<above_token>"
export CLOUDFLARE_ACCOUNT_ID="<account_id_from_dashboard>"
```

### 3. R2 バケット作成

```bash
# 開発環境
pnpm exec wrangler r2 bucket create engine-binaries-dev

# 本番環境
pnpm exec wrangler r2 bucket create engine-binaries
```

### 4. バイナリのアップロード

GitHub Pages からダウンロードしたバイナリを R2 へ転送 (例: Stockfish):

```bash
# 個別アップロード
for variant in single threaded asm asm-threaded simd128 simd128-threaded; do
  pnpm exec wrangler r2 object put \
    "engine-binaries/stockfish/16.1/stockfish-16.1-${variant}.wasm" \
    --file="./assets/stockfish/16.1/stockfish-16.1-${variant}.wasm"
done

# あるいは bulk (rclone 等を使うのが効率的)
rclone sync ./assets r2:engine-binaries
```

**ファイル一覧 (要アップロード)**:

```
assets/stockfish/16.1/stockfish-16.1-{single,threaded,asm,asm-threaded,simd128,simd128-threaded}.wasm
assets/yaneuraou/8.0/yaneuraou-8.0.wasm
assets/yaneuraou/8.0/eval.bin
assets/edax/4.4/edax-4.4.wasm
assets/edax/4.4/edax-data.bin
assets/gnubg/1.07/gnubg-1.07.wasm
assets/gnubg/1.07/gnubg-data.bin
assets/katago/1.14/katago-b6c96.onnx
assets/mortal/1.0/mortal.js
```

### 5. デプロイ (開発環境で先に検証)

```bash
pnpm exec wrangler deploy --env development
# → https://engine-cdn-dev.<your-subdomain>.workers.dev/ で配信確認

# テスト
curl -I https://engine-cdn-dev.<your-subdomain>.workers.dev/stockfish/16.1/stockfish-16.1-single.wasm
# → 200 OK + Content-Length 一致を確認
```

### 6. カスタムドメイン (本番のみ)

```toml
# wrangler.toml の routes コメント解除
[env.production]
routes = [
  { pattern = "engines.multi-game-engines.dev/*", zone_name = "multi-game-engines.dev" }
]
```

DNS で `multi-game-engines.dev` を Cloudflare に登録 (NS レコード変更) → Workers にバインド。

### 7. 本番デプロイ

```bash
pnpm exec wrangler deploy --env production
```

### 8. `engines.json` の URL 切替

`packages/registry/data/engines.json` の各エンジン `url` フィールドを Cloudflare URL に置換し、SRI を再計算:

```bash
# URL 置換 (sed で一括)
sed -i '' 's|https://hdkz-dev.github.io/multi-game-engines|https://engines.multi-game-engines.dev|g' \
  packages/registry/data/engines.json

# SRI 再計算
pnpm sri:refresh

# テスト
cd packages/registry && pnpm test
```

### 9. 段階的切替 (推奨)

リスク軽減のため、エンジンごとに段階的に切替:

1. Stockfish のみ Cloudflare 切替 → CI 全 green 確認 → 1 週間運用
2. やねうら王・Edax・gnubg を切替
3. KataGo・Mortal (実モデル化後)

### 10. ロールバック

問題発生時:

```bash
# engines.json を git revert
git revert <切替コミット>
git push origin main

# Worker を停止 (任意)
pnpm exec wrangler delete --env production
```

GitHub Pages は影響を受けないので即時復旧可能。

## 想定工数

| 段階                                       | 工数           |
| ------------------------------------------ | -------------- |
| Cloudflare アカウント新規作成 + R2 有効化  | 30 分          |
| バイナリアップロード (~500 MB 想定)        | 30 分〜1 時間  |
| 開発環境デプロイ + 検証                    | 30 分          |
| カスタムドメイン設定 (DNS 含む)            | 1〜2 時間      |
| `engines.json` 切替 + SRI 再計算 + CI 検証 | 1 時間         |
| **合計**                                   | **半日〜1 日** |

## 検証チェックリスト

- [ ] `wrangler deploy --dry-run` 成功
- [ ] 開発環境で `curl -I` 成功 (HTTP 200 + 正しい Content-Length)
- [ ] 開発環境で SRI 検証 OK (`adapter-stockfish` の起動テスト)
- [ ] 本番デプロイ後にレジストリの SRI が一致
- [ ] CDN 経由で全エンジンが起動できる (E2E)
- [ ] Cloudflare ダッシュボードで R2 ストレージ使用量を確認 (10 GB 以下)

## コスト

- **Workers**: 月 100,000 リクエストまで無料
- **R2**: 月 10 GB ストレージ + 月 1 M クラス A オペレーション + 月 10 M クラス B オペレーション まで無料
- 本プロジェクト規模 (個人 OSS) なら **無料枠で十分**

## 関連 PR / ADR

- ADR-014: バイナリ配布の物理分離 (MIT リポジトリと別管理)
- `infrastructure/cdn/cloudflare/worker.ts`: Worker 実装本体
