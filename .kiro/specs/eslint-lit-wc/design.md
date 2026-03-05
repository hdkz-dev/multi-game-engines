# 設計書 - ESLint Lit/WC プラグインの導入

## 概要

本設計では、`eslint-plugin-lit` および `eslint-plugin-wc` をプロジェクト全体の ESLint 設定に統合します。
これにより、Lit テンプレート内の HTML 構文チェック、プロパティの不適切な使用、Web Components のアクセシビリティ要件などを自動的に検証します。

### ゴール

- Lit および Web Components 用の ESLint ルールを適用する。
- 既存の Flat Config (`eslint.config.mjs`) とシームレスに統合する。
- 開発者が Lit テンプレート内でミスをした際に即座にフィードバックを得られるようにする。

## アーキテクチャ

既存の ESLint 設定 (`eslint.config.mjs`) に新しいプラグインを追加します。

### 技術スタック

| レイヤー      | 選択肢 / バージョン      | 特徴                                    |
| :------------ | :----------------------- | :-------------------------------------- |
| Linting       | `eslint-plugin-lit`      | Lit テンプレートリテラル内のチェック    |
| Linting       | `eslint-plugin-wc`       | Web Components 一般のベストプラクティス |
| Configuration | ESLint Flat Config (v10) | プロジェクト標準の設定方式              |

## コンポーネントとインターフェース

### ESLint 設定の統合

ルートの `eslint.config.mjs` に以下の変更を加えます。

1. プラグインのインポート:

   ```javascript
   import lit from "eslint-plugin-lit";
   import wc from "eslint-plugin-wc";
   ```

2. 設定の追加:
   各プラグインの推奨設定を追加します。
   ```javascript
   lit.configs["flat/recommended"],
   wc.configs["flat/recommended"],
   ```

## テスト戦略

- **検証テスト**: `pnpm lint` を実行し、既存コードでの違反を確認する。
- **動作確認**: `packages/ui-elements` 内のコンポーネントにおいて、意図的に Lit の構文エラー（閉じタグ忘れなど）を導入し、Lint がエラーを出すことを確認する。
