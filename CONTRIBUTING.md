# 貢献ガイド / Contributing Guide

## 開発ワークフロー / Development Workflow

1.  [JP] リポジトリをフォークします。
    [EN] Fork the repository.
2.  [JP] 最新mainと既存の作業ツリー変更を確認し、フィーチャーブランチを作成します。
    [EN] Check latest main and existing working-tree changes, then create a feature branch.
3.  [JP] 変更をコミットします。
    [EN] Commit your changes.
4.  [JP] ブランチをプッシュし、プルリクエストを送信します。
    [EN] Push the branch and submit a Pull Request.

**注意 / Note**:
[JP] `main` ブランチへの直接プッシュは制限されています。すべての変更はプルリクエストを経由し、レビューを受ける必要があります。
[EN] Direct pushes to the `main` branch are restricted. All changes must be submitted via Pull Request and undergo review.

[JP] PRは `gh pr merge --merge` によるmerge commitで統合します。管理者マージには明示的な許可が必要です。無関係な個人設定変更は含めないでください。

[EN] Integrate PRs with a merge commit (`gh pr merge --merge`). Admin merge requires explicit authorization. Preserve unrelated personal settings outside the PR.

## 品質ゲート / Quality Gate

[JP] コミット時に **Husky** と **lint-staged** による自動チェックが実行されます。以下のチェックをパスしない限り、コミットは中断されます：

- セキュリティスキャン（機密情報の混入チェック）
- 自動フォーマット（Prettier）
- 静的解析（ESLint）
- 型チェック（TypeScript）
- ビルド検証
- 全ユニットテスト
- ドキュメント同期チェック（doc-sync）は別途実行します（現在のpre-commitスクリプトは自動実行しません）。

コミット前の必須ゲート: `pnpm lint && pnpm typecheck && pnpm build && pnpm test`。`pnpm run doc-sync`、依存監査、変更に応じたE2Eも確認します。lint-stagedだけでは全体lintの代替になりません。型・警告・監査の抑制で成功扱いにしないでください。日英文書と必要なADRを同期し、最新PR HEADとマージ後mainのCIを確認します。

## 構造標準化 / Structural Standardization (ADR-046)

[JP] コードの整合性を維持するため、以下のディレクトリ構造を厳守してください：

- **UI パッケージ**: 全てのコンポーネントは `src/components/` に、スタイルは `src/styles/` に配置してください。
- **アダプター**: `{Name}Adapter.ts` と `{Name}Parser.ts` の命名規則を守ってください。
- **テスト**: テストファイルは対象コードの直下の `__tests__/` フォルダに配置してください。

[EN] To maintain consistency, please strictly adhere to the following directory structures:

- **UI Packages**: All components must be placed in `src/components/`, and styles in `src/styles/`.
- **Adapters**: Follow the naming convention `{Name}Adapter.ts` and `{Name}Parser.ts`.
- **Tests**: Test files must be placed in a `__tests__/` folder adjacent to the code they test.

## 多言語化規約 / i18n Conventions (Zenith Tier)

[JP] 多言語リソースは物理的に隔離されたパッケージで管理します：

- 共有エラーやステータスは `@multi-game-engines/i18n-common` を使用してください。
- 各ゲーム固有の文言は `@multi-game-engines/i18n-{domain}` に追加してください。
- 翻訳データへの動的アクセスには、必ず `DeepRecord` 型を使用し、`any` を排除してください。

[EN] Localization resources are managed in physically isolated packages:

- Use `@multi-game-engines/i18n-common` for shared errors and status messages.
- Add game-specific vocabulary to `@multi-game-engines/i18n-{domain}`.
- Always use the `DeepRecord` type for dynamic translation access to eliminate `any`.

[EN] Automated checks are executed upon commit using **Husky** and **lint-staged**. Commits will be aborted unless the following checks pass:

- Security scan (Checking for secrets)
- Auto-formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Build verification
- All unit tests
- Run documentation sync separately (`pnpm run doc-sync`); the current pre-commit script does not run it automatically.

Before committing, pass `pnpm lint && pnpm typecheck && pnpm build && pnpm test`, plus doc-sync, dependency audits, and relevant E2E. lint-staged does not replace full-workspace lint. Synchronize bilingual documents and required ADRs, and verify CI for the latest PR HEAD and post-merge main. Do not suppress diagnostics to declare success.

## 現在の保守計画 / Current Maintenance Plan

[JP] 現在の確認結果は [PROGRESS](docs/PROGRESS.md)、優先度・前提・完了条件は [実行計画](docs/implementation_plans/20261006-maintenance-and-roadmap.md) を参照してください。

[EN] See [current progress](docs/en/PROGRESS.md) and the [execution plan](docs/en/implementation_plans/20261006-maintenance-and-roadmap.md) for verified state, prerequisites, and acceptance criteria.
