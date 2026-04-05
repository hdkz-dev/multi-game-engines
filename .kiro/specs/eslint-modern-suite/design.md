# 設計書 - モダン ESLint スイートの導入

## 概要

本設計では、プロジェクトの `Zenith Tier` 品質を担保するため、複数の専門的な Lint プラグインを統合します。これらは、純粋なロジック層 (`core`) から表現層 (`ui-*`)、テスト層までを網羅します。

## アーキテクチャ

### 技術スタック

| 分類             | 選定プラグイン                          | 役割                                                                           |
| :--------------- | :-------------------------------------- | :----------------------------------------------------------------------------- |
| **全般**         | `eslint-plugin-unicorn`                 | 洗練されたコードスタイルの強制                                                 |
| **モジュール**   | `eslint-plugin-import-x`                | 循環参照防止、インポート位置の最適化                                           |
| **非同期**       | `eslint-plugin-promise`                 | Promise チェーンと async/await の安全な使用                                    |
| **テスト**       | `eslint-plugin-vitest`, `no-only-tests` | テストコードの品質と誤デバッグコードの防止                                     |
| **UI/A11y**      | `eslint-plugin-jsx-a11y`                | React/JSX コンポーネントにおけるアクセシビリティ（Lit は `eslint-plugin-lit`） |
| **ドキュメント** | `eslint-plugin-tsdoc`                   | JSDoc の構文検証                                                               |

## コンポーネントとインターフェース

### ESLint 設定の構成

`eslint.config.mjs` を大幅に強化し、各プラグインを Flat Config 形式で統合します。

#### インポート構造の設計

```javascript
import importX from "eslint-plugin-import-x";
import promise from "eslint-plugin-promise";
import unicorn from "eslint-plugin-unicorn";
import vitest from "eslint-plugin-vitest";
import tsdoc from "eslint-plugin-tsdoc";
// ... 他のプラグイン
```

#### ルールの優先順位と競合解決

- `typescript-eslint` と `eslint-plugin-import-x` の型認識を連携させる。
- Prettier と競合するルールがある場合は無効化する。

## テスト戦略

- **全体スキャン**: `pnpm lint` を全パッケージで実行。
- **循環参照テスト**: 意図的にパッケージを跨いだ循環参照を作成し、`import-x` が検知するか確認。
- **デバッグフラグテスト**: `it.only` を追加し、Lint が失敗することを確認。
