# [実装計画書] レビュー指摘事項の修復計画（2026-02-20）

## 1. 背景と目的

2026-02-19 の包括的プロジェクトレビューおよび 2026-02-20 のフォローアップレビューにおいて、
全17件の改善事項（Critical 4件、High 5件、Medium 8件）が特定された。

本計画は、これらの課題を優先度に基づき3フェーズに分け、段階的に解消する実行計画である。
親計画書: [project-review-improvements.md](./project-review-improvements.md)

### 対象ブランチ

- **作業ブランチ**: `chore/project-review-improvements`
- **マージ先**: `main`
- **PR**: [#26](https://github.com/hdkz-dev/multi-game-engines/pull/26)

---

## 2. フェーズ A: Critical（即時対応）— CI 修復 + 法的整合性

**目標**: CI の正常動作と法的整合性を保証する。
**見積もり**: 〜30分

### ステップ A-1: `ui-react` ESLint 修復

**問題**: `packages/ui-react/` に `eslint.config.mjs` が存在せず、`pnpm run lint` が `TypeError` で失敗。CI lint チェック失敗の根本原因。

**対応**:

1. `packages/ui-react/` の lint 実行で発生するエラーの詳細調査
2. ESLint 設定の修正（ルートの `eslint.config.mjs` との整合性確保）
3. `pnpm turbo lint` の全パス確認

**検証コマンド**:

```bash
cd packages/ui-react && pnpm run lint
pnpm turbo lint
```

**コミット**: `fix(ui-react): resolve ESLint configuration error`

---

### ステップ A-2: LICENSE ファイル整備 + license フィールド追加

**問題**: ルートに `LICENSE` ファイルが存在しない。13パッケージの `package.json` に `"license"` フィールドが欠落。

**対応**:

1. ルートに MIT ライセンスの `LICENSE` ファイルを作成
2. 以下の13パッケージの `package.json` に `"license": "MIT"` を追加:
   - `domain-chess`, `domain-go`, `domain-mahjong`, `domain-reversi`, `domain-shogi`
   - `ui-chess-elements`, `ui-chess-react`, `ui-chess-vue`, `ui-chess`
   - `ui-shogi-elements`, `ui-shogi-react`, `ui-shogi-vue`, `ui-shogi`

**検証コマンド**:

```bash
# LICENSE 存在確認
test -f LICENSE && echo OK || echo MISSING

# license フィールド確認（出力がゼロなら全パッケージに設定済み）
find packages -maxdepth 2 -name "package.json" -type f -exec sh -c \
  'grep -q "\"license\"" "$1" || echo "MISSING: $1"' _ {} \;
```

**コミット**: `chore: add MIT LICENSE and license field to 13 packages`

---

### ステップ A-3: release.yml Node.js バージョン修正

**問題**: `.github/workflows/release.yml` が Node.js `"22"` を使用。`ci.yml` (`24`)、`.node-version` (`24.13.0`)、`package.json` (`>=24.0.0`) と不一致。

**対応**:

1. `.github/workflows/release.yml` の `node-version: "22"` を `node-version: "24"` に変更
2. 全ワークフローの Node.js バージョンが統一されていることを確認

**検証コマンド**:

```bash
grep "node-version" .github/workflows/*.yml
```

**コミット**: `ci: fix Node.js version in release.yml to match ci.yml (22→24)`

---

### ステップ A-4: 不要ファイルの除去 + .gitignore 更新

**問題**: 7つの不要ファイルが Git 追跡されている。`.gitignore` にパターンが不足。

**対応**:

1. `.gitignore` に以下のパターンを追加:

   ```text
   review_audit_raw.md
   pr_review_comments*.json
   pr_review_comments*.md
   pr_view.json
   status.txt
   opencode_test.txt
   test_out.txt
   ```

2. `git rm --cached` で以下のファイルを Git 管理から除外:
   - `review_audit_raw.md`
   - `pr_review_comments.json`
   - `pr_review_comments_formatted.json`
   - `docs/reviews/pr_review_comments.md`
   - `pr_view.json`
   - `status.txt`
   - `opencode_test.txt`

**検証コマンド**:

```bash
# 追跡対象の不要ファイルがゼロであること
git ls-files | grep -E "(review_audit|pr_review|pr_view|status\.txt|opencode_test)" | wc -l
# → 0
```

**コミット**: `chore: remove tracked artifacts and update .gitignore`

---

### フェーズ A 完了チェック

```bash
pnpm ai:check  # lint, typecheck, build, test の全パス確認
```

---

## 3. フェーズ B: High（リリース準備）— ワークスペース整合 + Dependabot

**目標**: npm 公開に向けたメタデータ完備とセキュリティ自動化。
**見積もり**: 〜20分（B-1/B-2 除く）

### ステップ B-1: pnpm-workspace.yaml と package.json の整合

**問題**: `pnpm-workspace.yaml` には `"examples/*"` が含まれるが、ルート `package.json` の `workspaces` には未記載。

**対応**:

1. ルート `package.json` の `workspaces` に `"examples/*"` を追加

**検証コマンド**:

```bash
# 両方に examples/* が含まれること
grep "examples" pnpm-workspace.yaml
grep "examples" package.json
```

**コミット**: `chore: add examples/* to root package.json workspaces`

---

### ステップ B-2: Dependabot 設定

**問題**: `.github/dependabot.yml` が存在せず、依存関係の自動更新が行われていない。GitHub Security Alerts に脆弱性2件。

**対応**:

1. `.github/dependabot.yml` を作成
2. npm パッケージの自動更新を weekly で設定
3. GitHub Actions の自動更新も追加

**設定内容**:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "patch"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**コミット**: `ci: add Dependabot configuration for npm and GitHub Actions`

---

### ステップ B-3（後続）: README 一括作成

> **注**: 20パッケージ分の README 作成は大規模タスクのため、別コミットまたは別ブランチでの対応を推奨。

**対象**: adapter-gtp, adapter-uci, adapter-usi, domain-chess, domain-go, domain-mahjong, domain-reversi, domain-shogi, ui-chess, ui-chess-elements, ui-chess-react, ui-chess-vue, ui-shogi, ui-shogi-elements, ui-shogi-react, ui-shogi-vue, ui-react-core, ui-react-monitor, ui-vue-core, ui-vue-monitor

**テンプレート構成**:

```markdown
# @multi-game-engines/{package-name}

> {one-line description}

## Installation

## Usage

## API

## License

MIT
```

---

### ステップ B-4（後続）: SRI プレースホルダーハッシュ刷新

> **注**: 本番バイナリの取得とハッシュ計算が必要なため、バイナリ入手後に対応。Phase 3 のブロッカー。

**対象**: 全5アダプター、計9箇所

| アダプター        | ファイル                  | 箇所数 | 現在の値                                                                                                                        |
| ----------------- | ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| adapter-stockfish | `src/StockfishAdapter.ts` | 2      | `sha384-StockfishMainScriptHashPlaceholder`, `sha384-StockfishWasmBinaryHashPlaceholder`                                        |
| adapter-yaneuraou | `src/YaneuraouAdapter.ts` | 3      | `sha384-YaneuraouMainScriptHashPlaceholder`, `sha384-YaneuraouWasmBinaryHashPlaceholder`, `sha384-YaneuraouNNUEHashPlaceholder` |
| adapter-edax      | `src/EdaxAdapter.ts`      | 1      | `sha384-EdaxMainScriptHashPlaceholder`                                                                                          |
| adapter-mortal    | `src/MortalAdapter.ts`    | 1      | `sha384-MortalMainScriptHashPlaceholder`                                                                                        |
| adapter-katago    | `src/KataGoAdapter.ts`    | 2      | `sha384-KataGoMainScriptHashPlaceholder`, `sha384-KataGoWasmBinaryHashPlaceholder`                                              |

---

### フェーズ B 完了チェック

```bash
pnpm ai:check
# workspace 整合チェック
node -e "const r=require('./package.json'); console.log(r.workspaces)"
```

---

## 4. フェーズ C: Medium（品質改善）— 型安全性 + 保守性

**目標**: Zenith Standard との完全一致と保守性の向上。
**見積もり**: 〜30分（C-1〜C-4）、C-5以降は後続

### ステップ C-1: `i18n` typecheck スクリプト追加

**問題**: `packages/i18n/package.json` に `typecheck` スクリプトがなく、`turbo typecheck` でスキップされる。

**対応**:

1. `packages/i18n/package.json` の `scripts` に `"typecheck": "tsc --noEmit"` を追加

**コミット**: `fix(i18n): add missing typecheck script`

---

### ステップ C-2: `main`/`types` フィールド追加

**問題**: 7パッケージに `main` フィールドがない。`exports` のみで ESM は問題ないが、CJS 互換性と一部ビルドツールの対応のため追加が望ましい。

**対応**:

以下の7パッケージの `package.json` に `main` と `types` フィールドを追加:

| パッケージ     | `main`              | `types`               |
| -------------- | ------------------- | --------------------- |
| domain-chess   | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| domain-go      | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| domain-mahjong | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| domain-reversi | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| domain-shogi   | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| ui-chess       | `"./dist/index.js"` | `"./dist/index.d.ts"` |
| ui-shogi       | `"./dist/index.js"` | `"./dist/index.d.ts"` |

**コミット**: `chore: add main/types fields to 7 packages for CJS compat`

---

### ステップ C-3: Storybook `as any` 解消

**問題**: `ui-vue-monitor/stories/EngineMonitorPanel.stories.ts:16` で `as any` を使用。

**対応**:

1. 適切な型定義を作成して `as any` を削除

**コミット**: `fix(ui-vue-monitor): remove as any from Storybook stories`

---

### ステップ C-4: ローカルクリーンアップ

**問題**: `packages/ui-react/test_out.txt` が未コミットの一時ファイルとして残存。`feat/zenith-finalization-security-and-types` ブランチがローカルに残存。

**対応**:

1. `packages/ui-react/test_out.txt` を削除
2. `feat/zenith-finalization-security-and-types` ブランチを削除

**コマンド**:

```bash
rm packages/ui-react/test_out.txt
git branch -d feat/zenith-finalization-security-and-types
```

---

### ステップ C-5〜C-8（後続セッション推奨）

| #   | タスク                 | 概要                                                                           |
| --- | ---------------------- | ------------------------------------------------------------------------------ |
| C-5 | `as unknown as` 削減   | `MonitorRegistry.ts`(2), `ResourceInjector.ts`(1), `EngineError.ts`(1) の4箇所 |
| C-6 | OPFSStorage 本実装     | `navigator.storage.getDirectory()` を用いた OPFS アクセス                      |
| C-7 | 英語版ドキュメント拡充 | `docs/en/` に DECISION_LOG, ROADMAP, ZENITH_STANDARD 追加                      |
| C-8 | .DS_Store Git 除外     | `git rm --cached` で既追跡ファイルの除外                                       |

---

### フェーズ C 完了チェック

```bash
pnpm ai:check
```

---

## 5. 実行順序とコミット戦略

```text
フェーズ A（4コミット）
├── A-1. ui-react ESLint 修復 ← 最優先（CI ブロッカー）
├── A-2. LICENSE + license field
├── A-3. release.yml Node.js 24
└── A-4. .gitignore + git rm --cached

フェーズ B（2コミット + 後続2タスク）
├── B-1. workspace 整合
├── B-2. Dependabot 設定
├── B-3. README 一括作成 ← 後続
└── B-4. SRI ハッシュ刷新 ← 後続（バイナリ入手後）

フェーズ C（3コミット + 後続4タスク）
├── C-1. i18n typecheck
├── C-2. main/types フィールド
├── C-3. Storybook as any
├── C-4. ローカルクリーンアップ（コミット不要）
└── C-5〜C-8 ← 後続セッション推奨
```

## 6. リスクと注意事項

| リスク                          | 軽減策                                |
| ------------------------------- | ------------------------------------- |
| ESLint 修正が他パッケージに影響 | `pnpm turbo lint` で全パッケージ検証  |
| LICENSE 追加後の CI 変動        | `pnpm ai:check` で全パス確認          |
| workspace 変更後の依存解決変化  | `pnpm install` 実行後にクリーンビルド |
| Dependabot PR の大量生成        | `groups` 設定で PR を集約             |

## 7. 完了基準

- [ ] `pnpm ai:check` が全パス
- [ ] PR #26 のレビューコメントがすべて resolved
- [ ] 追跡対象の不要ファイルがゼロ
- [ ] 全パッケージに `license` フィールドが存在
- [ ] `release.yml` と `ci.yml` の Node.js バージョンが一致
- [ ] `.github/dependabot.yml` が存在

## 8. 対応履歴

- 2026-02-20 : 本計画書の策定。
