# コーディング規約 (Coding Conventions)

## 命名規則
- パッケージ: `@multi-game-engines/<name>`
- インターフェース: `I` プレフィックス (例: `IEngine`)
- 公称型 (Branded Types): `FEN`, `Move` 等、ドメイン固有の名称を使用。

## TypeScript 規約
- `any` の使用を禁止。
- 外部入出力には必ず `zod` 等による実行時バリデーションか、厳密な型定義を行う。
- 非同期処理は `AsyncIterable` または `Promise` で統一。

## フォルダ構造
```
packages/<name>/
  src/
    index.ts
    types.ts
    __tests__/
  package.json
  tsconfig.json
```
