# TypeScript & モノリポ スタイルガイド

## 一般原則
- すべてのソースコードに TypeScript を使用。
- **any は禁止**。代わりに `unknown` を使用。
- 共有型はすべて `@multi-game-engines/core` からエクスポート。

## 設計パターン
- **Facade パターン**: 公開 API (`IEngine`) と実装 API (`IEngineAdapter`) を分離。
- **Branded Types**: 局面や指し手の型安全性を確保。
- **DI (Dependency Injection)**: ストレージやロガーを外部から注入可能にする。

## モノリポのルール
- パッケージ間インポートは、ワークスペース名 `@multi-game-engines/package-name` を通じて行う。

## コメント
- コメントは **日本語** で記述。
- パブリック API には必ず JSDoc を付与し、ジェネリクスの意味を明記する。