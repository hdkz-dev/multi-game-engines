# 実装タスク一覧 - eslint-lit-wc

## タスク

### 1. 依存関係のインストール

- [x] 1.1 root の `package.json` に公式のプラグインをインストールする
  - `pnpm add -wD eslint-plugin-lit eslint-plugin-wc`
  - _Requirements: 1_

### 2. ESLint 設定の更新

- [x] 2.1 `eslint.config.mjs` にプラグインの設定を追加する
  - `eslint-plugin-lit` と `eslint-plugin-wc` をインポート
  - `recommended` 設定を統合
  - _Requirements: 1, 2_

### 3. 検証と修正

- [x] 3.1 既存コードの Lint チェック実行
  - `pnpm lint` を実行
  - _Requirements: 3_
- [x] 3.2 必要に応じて既存コードの修正
  - 違反がある場合、プロジェクトの規約に沿って修正（今回は違反なしを確認）
  - _Requirements: 3_

### 4. 完了確認

- [x] 4.1 `DECISION_LOG.md` への記録（技術選定の記録）
  - _Requirements: 1_
