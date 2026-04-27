# [実装計画書] npm 初回リリースへの道筋 (v0.1.0)

> 作成日: 2026-04-27
> ステータス: **Phase A 完了** / Phase B 計画中

---

## 1. 目的と概要

フレームワークとして完成した `@multi-game-engines/*` パッケージ群を npm に初回公開（v0.1.0）するための
残作業を整理し、優先度と依存関係を明確にする。

---

## 2. ライセンス分離の絶対要件 (ADR-014 準拠)

> **⚠️ すべての判断はこの制約を最優先とすること**

| 区分                                 | ライセンス | 取り扱い                                                              |
| ------------------------------------ | ---------- | --------------------------------------------------------------------- |
| `@multi-game-engines/*` 全パッケージ | **MIT**    | npm 公開対象                                                          |
| Stockfish バイナリ (`.wasm`, `.js`)  | GPL-3.0    | **絶対に npm パッケージに含めない** → jsDelivr 等から実行時動的ロード |
| やねうら王 バイナリ                  | GPL-2.0+   | **絶対に npm パッケージに含めない** → 自社 CDN / ユーザー提供         |
| KataGo バイナリ                      | Apache-2.0 | **絶対に npm パッケージに含めない** → 自社 CDN / ユーザー提供         |
| Edax / gnubg / KingsRow / Mortal     | GPL/各種   | **絶対に npm パッケージに含めない** → 自社 CDN / ユーザー提供         |

### ライセンス汚染の防止チェックリスト

すべてのリリース作業において以下を確認すること:

- [ ] `packages/adapter-*/src/` に WASM バイナリや JS バイナリが含まれていないこと
- [ ] `packages/registry/data/engines.json` は URL とメタデータのみで、バイナリは含まないこと
- [ ] npm publish 後に `npm pack --dry-run` でバイナリが含まれていないことを検証
- [ ] README にランタイムローディング方式である旨を明記し、ユーザーが誤解しないようにすること

---

## 3. フェーズ構成

```
Phase A: npm リリース準備   ← 今すぐ着手可能
    │
    ├─ A1: Stockfish variant SRI 算出（バイナリデプロイ不要）
    ├─ A2: Changesets リリース自動化
    ├─ A3: TypeDoc API リファレンス
    └─ A4: E2E テスト基盤整備

Phase B: 自社バイナリ配信インフラ   ← A完了後
    │
    ├─ B1: Cloudflare R2 / GitHub Pages 配信設定
    ├─ B2: やねうら王 WASM ビルドパイプライン
    ├─ B3: KataGo・その他 WASM ビルド
    └─ B4: SRI 自動算出 CI の整備

Phase C: 高度機能 (将来)
    ├─ C1: WebNN / WebGPU 統合
    ├─ C2: Swarm Expert Mapping
    └─ C3: Mobile Native Bridge
```

---

## 4. Phase A: npm リリース準備（今すぐ着手可能）

### A1: Stockfish SIMD/ST variant SRI 算出

**目的**: `engines.json` 内の Stockfish SIMD/ST 用 WASM の `__unsafeNoSRI: true` を実ハッシュへ置換する。

**ライセンス確認**: jsDelivr 上の Stockfish WASM は GPL-3.0。npm パッケージへの同梱ではなく
あくまで「参照 URL の記録」のため、registry パッケージ自体の MIT ライセンスは維持される。

**対象 URL**:

```
https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-simd-mt.wasm
https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-st.wasm
```

**作業手順**:

1. `scripts/compute-sri.mjs` を作成（`fetch → ArrayBuffer → crypto.subtle.digest('SHA-384') → base64`）
2. 上記 URL の SHA-384 を算出
3. `engines.json` の `__unsafeNoSRI: true` を `"sri": "sha384-..."` に置換
4. `scripts/refresh-engine-sris.mjs` と統合して `pnpm sri:refresh` に組み込む

**完了条件**: `pnpm sri:refresh` 実行後、Stockfish 全バリアントの `__unsafeNoSRI` がゼロになること

---

### A2: Changesets リリース自動化

**目的**: `pnpm run ai:release` → PR → マージ → npm 自動公開 のパイプラインを確立する。

**注意**: `@multi-game-engines/*` パッケージのみ公開。エンジンバイナリは含まれないため
ライセンス上の問題はない。

**作業手順**:

1. `.changeset/config.json` の `baseBranch`, `access: "public"` を確認
2. `release.yml` の `npm publish` ステップが MIT パッケージのみ対象であることを確認
3. Changeset ドキュメントを作成し、`pnpm changeset` で v0.1.0 エントリを追加
4. GitHub Actions の `NPM_TOKEN` シークレット設定

**完了条件**: main マージ後に GitHub Actions が自動で npm publish を完了すること

---

### A3: TypeDoc API リファレンス

**目的**: 全パッケージの公開 API を TypeDoc で HTML 生成し、GitHub Pages で公開する。

**作業手順**:

1. `typedoc.json` をルートに作成（entryPointStrategy: `packages`）
2. `pnpm -r exec typedoc` で全パッケージのドキュメントを一括生成
3. `docs` サイトとして GitHub Pages にデプロイする GitHub Actions ワークフローを追加
4. CI (`ci.yml`) に TypeDoc の警告ゼロチェックを追加

**完了条件**: PR ごとに API ドキュメントが自動更新されること

---

### A4: E2E テスト基盤整備

**目的**: UI Monitor 等の各 UI パッケージに Playwright E2E テストを追加する。

**ライセンス確認**: テストでは `MockAdapter` または `__unsafeNoSRI` で GPL バイナリをロードしないこと。
本番エンジンを使う E2E テストは CI 環境では実行しない（SRI バイパスを本番モードで使えないため）。

**作業手順**:

1. `packages/ui-react-monitor` に Playwright テストを追加
2. `packages/ui-vue-monitor` に同様のテストを追加
3. E2E 専用の `playwright.config.ts` をルートに整備
4. CI に `test:e2e` ジョブを追加（MockAdapter 使用）

---

## 5. Phase B: 自社バイナリ配信インフラ（中期）

### B1: バイナリ配信設計

**ライセンス上の必須対応**:

```
自社 CDN (Cloudflare R2 / GitHub Pages)
├── /assets/yaneuraou/7.5/yaneuraou.js     ← GPL-2.0+ バイナリ
│   └── LICENSE.txt  ← GPL 全文を必ず同梱
├── /assets/katago/1.14/katago.js           ← Apache-2.0 バイナリ
│   └── LICENSE.txt
└── /assets/.../LICENSE.txt  ← 各バイナリ必須
```

**重要**: GitHub Pages リポジトリまたは Cloudflare R2 バケットは
`@multi-game-engines` npm パッケージとは**物理的に分離**すること。
MIT の npm パッケージリポジトリに GPL バイナリを混在させない。

**推奨構成**:

- `hdkz-dev/multi-game-engines-assets` として独立リポジトリを作成
- 各エンジンのバイナリとその LICENSE ファイルを配置
- GitHub Pages で `https://hdkz-dev.github.io/multi-game-engines-assets/` として公開

---

### B2: やねうら王 WASM ビルドパイプライン

**前提確認**: やねうら王は GPL-2.0+ のため、ビルドスクリプト・CI は
`multi-game-engines-assets` リポジトリで管理する（MIT の本リポジトリには含めない）。

**作業手順**:

1. Emscripten SDK を使ったやねうら王の WASM ビルドスクリプトを作成
2. GitHub Actions でビルド自動化
3. ビルド成果物を GitHub Releases または R2 にデプロイ
4. デプロイ後 `pnpm sri:refresh` で SRI を算出し、`engines.json` を更新

---

### B3: その他エンジン WASM ビルド

B2 と同様の手順を KataGo (Apache-2.0)、Edax (GPL-3.0)、
gnubg (GPL-2.0)、KingsRow (各種)、Mortal (各種) に適用する。

---

### B4: SRI 自動再計算 CI

**目的**: バイナリデプロイのたびに `engines.json` の SRI が自動更新されるパイプラインを構築。

**作業手順**:

1. `scripts/refresh-engine-sris.mjs` を全エンジン URL に対応させる
2. `refresh-sri.yml` に自動 PR 作成ステップを追加
3. SRI 更新 PR を自動でマージするルールを設定

---

## 6. Phase C: 高度機能（将来）

| 項目                 | 概要                         | ライセンス注意点              |
| -------------------- | ---------------------------- | ----------------------------- |
| WebNN / WebGPU 統合  | NPU/GPU 活用 NNUE 推論       | W3C API (MIT 互換)            |
| Swarm Expert Mapping | アンサンブル序盤・終盤特化   | なし（純粋ロジック）          |
| Observability (OTel) | 実行時パフォーマンス可視化   | OpenTelemetry (Apache-2.0)    |
| Mobile Native Bridge | Capacitor/Cordova プラグイン | バイナリは MIT アプリから分離 |

---

## 7. Phase A の優先順位と工数見積もり

| タスク                    | 工数目安 | 前提条件    | 独立実施可否 |
| ------------------------- | -------- | ----------- | ------------ |
| A1: Stockfish variant SRI | 1〜2h    | なし        | ✅ 独立      |
| A2: Changesets 設定       | 2〜4h    | なし        | ✅ 独立      |
| A3: TypeDoc 設定          | 4〜8h    | なし        | ✅ 独立      |
| A4: E2E 基盤              | 8〜16h   | A1 完了推奨 | △ 並行可     |

**推奨着手順序**: A1 → A2 → A3 と A4 並行

---

## 8. 対応履歴

- 2026-04-27: 計画書作成（現状分析・フェーズ設計・ライセンス制約整理）
- 2026-04-27: **Phase A 全完了** (A1–A4)
  - A1: Stockfish 全 6 アセット SRI 確定 (commit `5f74f679`)
  - A2: Changesets 自動化・`release.yml` 整備 (commit `aabf8c4e`)
  - A3: TypeDoc + GitHub Pages ワークフロー追加 (commit `d91974d3`)
  - A4: `ui-react-monitor` Playwright CT 基盤 + E2E CI (commit `6ed55131`)
  - ⚠️ 手動作業残: `NPM_TOKEN` シークレット登録・GitHub Pages 有効化
