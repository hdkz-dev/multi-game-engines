# 実装タスク一覧 - eslint-modern-suite

## タスク

### 1. 依存関係のインストール

- [ ] 1.1 新規プラグインのインストール
  - `pnpm add -wD eslint-plugin-import-x eslint-plugin-promise eslint-plugin-unicorn eslint-plugin-jsx-a11y eslint-plugin-vitest eslint-plugin-tsdoc eslint-plugin-no-only-tests`
  - _Requirements: 1_

### 2. ESLint 設定の更新

- [ ] 2.1 `eslint.config.mjs` の強化
  - 各プラグインをインポート
  - Flat Config 形式で推奨設定を追加
  - _Requirements: 2, 3_

### 3. 検証と修正

- [ ] 3.1 既存コードの Lint チェック実行
  - `pnpm lint` を実行し、違反箇所を特定
  - _Requirements: 4_
- [ ] 3.2 必要に応じて既存コードの修正
  - 軽微な違反は `--fix` で対応
  - 重大な設計違反（循環参照など）がある場合は慎重に修正
  - _Requirements: 4_

### 4. 完了確認

- [ ] 4.1 `ADR-059` の作成と `DECISION_LOG.md` への追記
  - _Requirements: 1_
