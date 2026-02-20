# [実装計画書] プロジェクト全体レビュー改善計画

## 1. 目的と概要

2026年2月19日に実施したプロジェクト全体の包括的レビュー、および2月20日のフォローアップレビューにおいて、以下の3カテゴリに分類される改善事項が発見された。
本計画は、これらを重大度に基づきフェーズ分けし、計画的に解消することを目的とする。

### レビュー結果サマリ

| カテゴリ                                | 件数 | 内訳                                                                                         |
| --------------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| 🔴 Critical（法的・セキュリティリスク） | 4件  | LICENSE欠落、CI不整合、不要ファイルの混入、`ui-react` ESLint 設定欠落                        |
| 🟠 High（品質・公開準備）               | 5件  | SRIプレースホルダー、license欠落、README欠落、workspace不整合、Dependabot未設定              |
| 🟡 Medium（整合性・保守性）             | 8件  | lint warning、コードキャスト、TODO残存、英語ドキュメント、i18n typecheck、mainフィールド欠落 |

---

## 2. フェーズ A: 即時対応 (Critical) — 法的・CI整合性

**目標**: リリース・CI の正常動作と法的整合性を最低限保証する。

### A-1. ルート LICENSE ファイルの作成

- [ ] ルートに MIT ライセンスの `LICENSE` ファイルを作成。
- [ ] 各パッケージディレクトリ（30パッケージ）に `LICENSE` ファイルをコピーし、物理的な欠落を解消。
- [ ] `package.json` に `"license": "MIT"` フィールドが明記されていないパッケージ（13件）への追加：
  - `domain-chess`, `domain-go`, `domain-mahjong`, `domain-reversi`, `domain-shogi`
  - `ui-chess-elements`, `ui-chess-react`, `ui-chess-vue`, `ui-chess`
  - `ui-shogi-elements`, `ui-shogi-react`, `ui-shogi-vue`, `ui-shogi`

### A-2. release.yml の Node.js バージョン修正

- [ ] `.github/workflows/release.yml` の `node-version` を `"22"` → `"24"` に変更。
- [ ] `package.json` の `engines.node` (`>=24.0.0`)、`.node-version`、`.nvmrc` (`24.13.0`) との一貫性を確認。

### A-3. 不要ファイルの除去と .gitignore 更新

- [ ] `.gitignore` に以下のパターンを追加：

  ```text
  review_audit_raw.md
  pr_review_comments*.json
  pr_view.json
  status.txt
  opencode_test.txt
  ```

- [ ] `git rm --cached` でこれらのファイルをGit管理から除外。

### A-4. `ui-react` ESLint 設定の修復

> 2026-02-20 フォローアップレビューで発見。

- [ ] `packages/ui-react/eslint.config.mjs` が存在せず、`pnpm run lint` が `TypeError: Cannot set properties of undefined (setting 'defaultMeta')` で失敗。
- [ ] ルートの `eslint.config.mjs` が `projectService: true` を使用しており、`ui-react` の `tsconfig.json` が `tsconfig.base.json` を extends していることで `@eslint/eslintrc` の互換性問題が発生。
- [ ] CI の lint チェック失敗の根本原因。**最優先対応**。

---

## 3. フェーズ B: リリース準備 (High) — パッケージメタデータの整備

**目標**: npm 公開に向けたパッケージのメタデータ完備。

### B-1. 全アダプター SRI ダミーハッシュの可視化

- [x] **TASKS.md を修正**: `adapter-edax` のみの記載を**全5アダプター（9箇所）**に拡張。
- [ ] SRI ハッシュ刷新を Phase 3 のブロッカーとして明記。
- **対象**:
  - `adapter-stockfish`: `sha384-StockfishMainScriptHashPlaceholder`, `sha384-StockfishWasmBinaryHashPlaceholder`（2箇所）
  - `adapter-yaneuraou`: `sha384-YaneuraouMainScriptHashPlaceholder`, `sha384-YaneuraouWasmBinaryHashPlaceholder`, `sha384-YaneuraouNNUEHashPlaceholder`（3箇所）
  - `adapter-edax`: `sha384-EdaxMainScriptHashPlaceholder`（1箇所）
  - `adapter-mortal`: `sha384-MortalMainScriptHashPlaceholder`（1箇所）
  - `adapter-katago`: `sha384-KataGoMainScriptHashPlaceholder`, `sha384-KataGoWasmBinaryHashPlaceholder`（2箇所）

### B-2. README の一括作成

- [ ] 以下の20パッケージに、パッケージ名・目的・エクスポート一覧・使用例を含む README.md を作成：
  - `adapter-gtp`, `adapter-uci`, `adapter-usi`
  - `domain-chess`, `domain-go`, `domain-mahjong`, `domain-reversi`, `domain-shogi`
  - `ui-chess-elements`, `ui-chess-react`, `ui-chess-vue`, `ui-chess`
  - `ui-shogi-elements`, `ui-shogi-react`, `ui-shogi-vue`, `ui-shogi`
  - `ui-react-core`, `ui-react-monitor`, `ui-vue-core`, `ui-vue-monitor`

### B-3. pnpm-workspace.yaml と package.json の整合

- [ ] ルート `package.json` の `workspaces` に `"examples/*"` を追加し、`pnpm-workspace.yaml` と一致させる。

### B-4. ADR 欠番の整理

- [x] DECISION_LOG.md に欠番（ADR-003〜013）の注記を追加。
  - 初期設計フェーズで採番された ADR が、リファクタリングにより統合・廃止された経緯を明記。
  - ✅ **完了** (2026-02-19)

### B-5. Dependabot 設定の追加

> 2026-02-20 フォローアップレビューで発見。

- [ ] `.github/dependabot.yml` を作成し、npm 依存関係の自動更新を有効化。
- [ ] GitHub Security Alerts に脆弱性2件（1 high, 1 moderate）が報告されている。

---

## 4. フェーズ C: 品質向上 (Medium) — コード・ドキュメント整合性

**目標**: Zenith Standard との完全一致と保守性の向上。

### C-1. lint warning の解消

- [ ] `packages/ui-vue-monitor/src/useEngineMonitor.ts` から未使用インポート `useEngineUI` を削除。

### C-2. プロダクションコードの `as unknown as` 削除

- [ ] `packages/ui-core/src/MonitorRegistry.ts` — バリデータ関数経由に置換。
- [ ] `packages/core/src/workers/ResourceInjector.ts` — 型ガード導入を検討。
- [ ] `packages/core/src/errors/EngineError.ts` — Error Cause API の型制約に対応。

### C-3. OPFSStorage の TODO 解消

- [ ] `packages/core/src/storage/OPFSStorage.ts` — `navigator.storage.getDirectory()` を用いた本実装。
  - Phase 3 の「巨大 eval-data 配信」との依存関係を考慮し、タスクとして明示化。

### C-4. PROGRESS.md の「次のステップ」同期

- [x] PROGRESS.md の「🚀 次のステップ」セクションを最新の TASKS.md のステータスと一致させる。
  - ✅ **完了** (2026-02-20)

### C-5. 英語版ドキュメントの拡充方針

- [ ] `docs/en/` ディレクトリに最低限以下のドキュメントを追加する方針を策定：
  - `DECISION_LOG.md` (ADR インデックス)
  - `ROADMAP.md`
  - `ZENITH_STANDARD.md`

### C-6. .DS_Store のGit管理除外

- [ ] `git rm --cached` で既存の `.DS_Store` ファイルを追跡から除外。

### C-7. `i18n` パッケージの typecheck スクリプト追加

> 2026-02-20 フォローアップレビューで発見。

- [ ] `packages/i18n/package.json` に `"typecheck": "tsc --noEmit"` を追加。`turbo typecheck` でスキップされる問題を解消。

### C-8. `main`/`types` フィールドの追加

> 2026-02-20 フォローアップレビューで発見。

- [ ] 7パッケージ（`domain-chess/go/mahjong/reversi/shogi`, `ui-chess`, `ui-shogi`）に `main` および `types` フィールドを追加。
- [ ] `exports` のみで ESM は問題ないが、CJS 互換性と一部ビルドツールの対応のため。

---

## 5. 影響範囲

- **破壊的変更**: なし（全てメタデータ・ドキュメント・設定の変更のみ）。
- **パフォーマンスへの影響**: なし。
- **CI への影響**: フェーズ A-2（release.yml）+ A-4（ESLint 設定）が CI に影響。いずれも現状の不整合解消であり、安定化に寄与。

## 6. テスト計画

- フェーズ A 完了後: `pnpm ai:check`（lint, typecheck, build, test）の全パス確認。
- フェーズ B 完了後: 各パッケージの `package.json` 整合性をスクリプトで自動検証。
- フェーズ C 完了後: `pnpm ai:check` 再実行 + ドキュメント同期チェック (`pnpm run doc-sync`)。

## 7. 対応履歴

- 2026-02-19 : プロジェクト全体レビュー実施。本計画書の策定。
- 2026-02-20 : PR #26 レビュー対応（パッケージ数修正: license 12→13, README 19→20）。
- 2026-02-20 : フォローアップレビュー実施。A-4, B-5, C-4(完了), C-7, C-8 を追加。SRI ハッシュ記述を実コードと統一。B-4(ADR欠番) 完了マーク。
