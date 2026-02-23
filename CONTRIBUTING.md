# 貢献ガイド / Contributing Guide

## 開発ワークフロー / Development Workflow

1.  [JP] リポジトリをフォークします。  
    [EN] Fork the repository.
2.  [JP] フィーチャーブランチを作成します。  
    [EN] Create a feature branch.
3.  [JP] 変更をコミットします。  
    [EN] Commit your changes.
4.  [JP] ブランチをプッシュし、プルリクエストを送信します。  
    [EN] Push the branch and submit a Pull Request.

**注意 / Note**:  
[JP] `main` ブランチへの直接プッシュは制限されています。すべての変更はプルリクエストを経由し、レビューを受ける必要があります。  
[EN] Direct pushes to the `main` branch are restricted. All changes must be submitted via Pull Request and undergo review.

## 品質ゲート / Quality Gate

[JP] コミット時に **Husky** と **lint-staged** による自動チェックが実行されます。以下のチェックをパスしない限り、コミットは中断されます：

- セキュリティスキャン（機密情報の混入チェック）
- 自動フォーマット（Prettier）
- 静的解析（ESLint）
- 型チェック（TypeScript）
- ビルド検証
- 全ユニットテスト
- ドキュメント同期チェック（doc-sync）

## 構造標準化 / Structural Standardization (ADR-046)

[JP] コードの整合性を維持するため、以下のディレクトリ構造を厳守してください：

- **UI パッケージ**: 全てのコンポーネントは `src/components/` に、スタイルは `src/styles/` に配置してください。
- **アダプター**: `{Name}Adapter.ts` と `{Name}Parser.ts` の命名規則を守ってください。
- **テスト**: テストファイルは対象コードの直下の `__tests__/` フォルダに配置してください。

[EN] To maintain consistency, please strictly adhere to the following directory structures:

- **UI Packages**: All components must be placed in `src/components/`, and styles in `src/styles/`.
- **Adapters**: Follow the naming convention `{Name}Adapter.ts` and `{Name}Parser.ts`.
- **Tests**: Test files must be placed in a `__tests__/` folder adjacent to the code they test.

[EN] Automated checks are executed upon commit using **Husky** and **lint-staged**. Commits will be aborted unless the following checks pass:

- Security scan (Checking for secrets)
- Auto-formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Build verification
- All unit tests
- Documentation sync check (doc-sync)
