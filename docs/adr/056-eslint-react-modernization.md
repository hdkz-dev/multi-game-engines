# ADR-056: ESLint React 設定の近代化と eslint-config-next 脱却

## ステータス

承認済み (ADR-044 を後継)

## 日付

2026-03-04

## コンテキスト

### 問題 1: 設定の重複

プロジェクト内の 7 つの React パッケージ (`ui-react-core`, `ui-react`, `ui-react-monitor`, `ui-chess-react`, `ui-chess`, `ui-shogi-react`, `ui-shogi`) が、同一の `eslint-plugin-react-hooks` 設定を個別にコピーしている。この重複は CodeRabbit レビューでも指摘されている。

### 問題 2: eslint-plugin-react の ESLint v10 非互換

`eslint-plugin-react` v7.37.x は、ESLint v10 で削除された `context.getFilename()` API を使用しており、実行時にクラッシュする ([vercel/next.js#89764](https://github.com/vercel/next.js/issues/89764))。`eslint-config-next` v16.1.6 が内部でこのプラグインに依存しているため、`zenith-dashboard-react` は ESLint v10 へアップグレードできない状態にある。

### 問題 3: パフォーマンスと最新性

`eslint-plugin-react` は旧来のアーキテクチャであり、React 19 / RSC に対応した専用ルールを持たない。`@eslint-react/eslint-plugin` は TypeScript ファーストの設計で 4〜7 倍高速であり、React 19 / RSC 固有のルールも提供する。

## 決定

1. **共有 ESLint React 設定パッケージの導入**: `@multi-game-engines/eslint-config-react` を新設し、`@eslint-react/eslint-plugin` と `eslint-plugin-react-hooks` の設定を集約する。全 React パッケージはこの共有設定を使用する。

2. **`zenith-dashboard-react` の `eslint-config-next` 脱却**: `eslint-config-next` を削除し、`@next/eslint-plugin-next` (recommended + core-web-vitals) + `@eslint-react/eslint-plugin` + `eslint-plugin-jsx-a11y` の独自構成に切り替える。

3. **ADR-044 の後継**: ADR-044 で決定した ESLint v9 ピン留めは維持しつつ、ESLint v10 移行の準備を整える。実際の v10 アップグレードは次の ADR で判断する。

## 結果

- 7 パッケージの ESLint 設定重複が解消され、ルール変更が 1 箇所で完結する。
- `eslint-plugin-react` への依存が排除され、ESLint v10 移行のブロッカーが消滅する。
- lint パフォーマンスが 4〜7 倍向上する見込み。
- React 19 / RSC 固有のリンティングルールが利用可能になる。
