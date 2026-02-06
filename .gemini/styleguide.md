# TypeScript & モノリポ スタイルガイド

## 一般原則
- すべてのソースコードにTypeScriptを使用する。
- パブリックAPIにはTypeよりもInterfaceを優先する。
- 共有型はすべて `@multi-game-engines/core` からエクスポートする。

## モノリポのルール
- `../package-name` から直接インポートしない。ワークスペース名 `@multi-game-engines/package-name` を使用する。
- `core` の依存関係は最小限に保つ。

## コメント
- コメントは**日本語**で記述する。
- パブリックメソッドやインターフェースにはJSDocを使用する。
