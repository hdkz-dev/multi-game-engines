# ADR-058: Lit と Web Components 用の ESLint プラグインの導入 (Introduction of ESLint plugins for Lit and Web Components)

## ステータス

- **対象フェーズ**: 開発環境・静的解析
- **ステータス**: Accepted
- **日付**: 2026-03-05

## 背景と課題

`multi-game-engines` プロジェクトでは、フレームワーク非依存の UI コンポーネント開発において [Lit](https://lit.dev/) を採用しています。
しかし、これまで Lit 独自の HTML テンプレート構文（`html` タグ）や、Web Components 一般のベストプラクティスを強制する静的解析ツールが導入されていませんでした。

これにより、テンプレート内での閉じタグの忘れ、プロパティと属性の混同、不適切なイベントハンドリングなど、実行時にしか発見できない問題が発生するリスクがありました。

## 決定事項

1. **`eslint-plugin-lit` の導入**: Lit のテンプレートリテラル内の HTML 構文チェック、属性値のエンティティ、バインディング位置の検証などを自動化する。
2. **`eslint-plugin-wc` の導入**: Web Components のカスタム要素名の命名規則（ハイフンの必須化）、コンストラクタ内での属性操作の禁止など、標準仕様に準拠した実装を強制する。
3. **Flat Config への統合**: エコシステム全体で ESLint v10 が導入されていることに合わせ、`eslint.config.mjs` にて各プラグインの `flat/recommended` 設定を統合する。

## トレードオフ

- **メリット**:
  - Lit テンプレート内のタイポや構文エラーをエディタ上で即座に検知できる。
  - Web Components の標準仕様から外れた実装（不正なタグ名など）を防ぎ、相互運用性を高める。
  - 開発者が Lit 固有の注意点に習熟していなくても、安全にコードを変更できる。
- **デメリット**:
  - わずかだが Lint 実行時のオーバーヘッドが増加する。
  - 既存のコードに対して厳格なチェックが走り、修正が必要になる場合がある。

## 実装

- `pnpm add -wD eslint-plugin-lit eslint-plugin-wc` による依存関係の追加。
- `eslint.config.mjs` にて `import lit from "eslint-plugin-lit"` および `import wc from "eslint-plugin-wc"` を追加。
- `lit.configs["flat/recommended"]` と `wc.configs["flat/recommended"]` を設定配列にマージ。
- `pnpm lint` を通じて全パッケージの安全性を検証。
