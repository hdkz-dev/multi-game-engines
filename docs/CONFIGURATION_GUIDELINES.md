# Configuration & Integration ガイドライン

このドキュメントは `multi-game-engines` リポジトリ向けの環境・設定・CI・運用方針をまとめたものです。

## 目的

- エンジン（ネイティブバイナリ、WASM、Nodeモジュール等）を複数含むモノレポでの一貫した開発体験を確保する。
- CI/CD と配布の安定化、ローカル開発者オンボーディングの簡素化。

## 重要方針（要点）

- Node バージョン: `>=24` を標準とする。ルートに `.nvmrc`（`24`）を置くこと。
- パッケージマネージャ: `pnpm` を公式に採用。ルートに `pnpm-workspace.yaml` を配置し、`packageManager` を `pnpm@<major>` として `package.json` に明記する。
- ルート共通設定: `eslint.config.mjs`, `tsconfig.base.json`, `prettier.config.cjs` を設置し、各パッケージはこれを継承する。
- CI: GitHub Actions を採用。ジョブは `install` → `lint` → `test` → `build` → `publish`（バイナリ/WASMがある場合） の順序で実行。Node のマトリクス（Linux/macOS，Node 24）を用意する。
- プリコミットQA: `./scripts/pre_commit_qa.sh` を必須化し、CI が PR 単位で実行する。
- i18n: ハードコード文字列禁止。新規 UI やエラーメッセージの追加時は、対応する i18n パッケージ（`packages/i18n-{domain}/locales/`）にキーを追加する方針。
  - 共通語彙（Status, OK等）は `i18n-common` へ。
  - ドメイン固有（駒名, FENエラー等）はそれぞれのドメインパッケージへ。
  - 動的アクセスが必要な場合は、`DeepRecord` 型を使用して型安全性を維持すること。

## エンジン統合ポリシー

- ビルドアーティファクトは `artifacts/` に集約し、バージョン化してリリースプロセスで配布する。
- WASM の場合は `wasm/` 配下にビルドスクリプトと最小ユニットテストを用意する。
- ネイティブバイナリは CI 上でクロスビルドまたはマトリクスでビルドし、各プラットフォームのアセットを個別に配布する。

## 開発フロー（推奨）

1. 新機能は `feature/...` ブランチで作業。
2. 変更はルートの Lint/Build が通ることを確認する。
3. `./scripts/pre_commit_qa.sh` を実行して問題がないことを確認。
4. PR 作成後、CI による自動検証（lint/test/build）を待つ。

## CI / GitHub Actions の要件（概要）

- Node 24 の使用を固定し、`pnpm` をキャッシュする。
- PR の `check` ワークフローに `pre_commit_qa.sh` 実行を組み込む。
- バイナリ/WASM の場合、`upload-artifact` と `release` ワークフローを分離する。

## リリースと依存管理

- 依存更新: `dependabot` を有効化。
- リリース: `semantic-release` または `release-please` を検討。Conventional Commits を推奨し、`commitlint` を導入する。

## セキュリティとシークレット管理

- シークレットは GitHub Secrets に保存。ローカル同期やMCPトークン更新時は `node scripts/sync-mcp-tokens.js` を実行する運用手順を定義する。

## テスト方針

- ロジック単体: `*.test.ts`
- UI: `*.test.tsx`（必要に応じて Storybook snapshot を併用）
- E2E: Playwright を CI のオプションジョブとして実行。

## ドキュメントとQA

- ルート `docs/` にこのファイルを置き、変更時は必ず更新する。
- 変更提案は PR に設計ノートを添えて行う。

## 物理的制約とストレージ構成 (Storage & Environment)

`multi-game-engines` は、ブラウザ、Node.js、ハイブリッドアプリの各環境で動作します。

- **ブラウザ (Web)**:
  - デフォルトで **OPFS (Origin Private File System)** を使用し、巨大な WASM/NNUE バイナリを高速に永続化します。
  - OPFS が利用不可、または COOP/COEP ヘッダーが未設定の場合は、自動的に **IndexedDB** へフォールバックします。
- **Node.js / CLI**:
  - `NodeFSStorage` を使用し、ローカルの `.cache/multi-game-engines/` 等にバイナリをキャッシュします。
- **カスタム注入**:
  - `EngineBridge` のコンストラクタで `IFileStorage` インターフェースを実装した独自のストレージクラスを注入可能です（例: Capacitor 用 SQLite ストレージ等）。

## パッケージ作成の要件 (Package Standards)

新規パッケージ（adapter, domain, ui等）を追加する際は、以下の Zenith Tier 基準を遵守してください。

1. **Zero-Any Policy**: プロダクションコードにおける `any` は厳禁です。
2. **License**: ルートの MIT LICENSE ファイルをコピーし、`package.json` の `license` フィールドを適切に設定してください。
3. **Types**: `dist/` 配下に型定義ファイルを生成するよう `tsup` または `tsc` を設定してください。
4. **Coverage**: `core` パッケージについては **98% 以上のラインカバレッジ**を維持してください。他のパッケージも、主要な正常系および異常系（ネットワークエラー等）の物理的実証を含めることが義務付けられます。

---

更新履歴:

- 2026-02-28: Zenith Tier (Storage, Coverage, Zero-Any) の基準を追記
- 2026-02-07: 初版作成
