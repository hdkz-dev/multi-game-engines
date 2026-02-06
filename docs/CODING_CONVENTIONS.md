# コーディング規約

## 命名規則
- パッケージ: `@multi-game-engines/<name>`
- インターフェース: `I` プレフィックス (例: `IEngine`, `IAdapterOptions`)
- クラス: PascalCase (例: `EngineBridge`)
- ファイル: kebab-case (例: `engine-bridge.ts`)

## フォルダ構造
```text
packages/<name>/
  src/
    index.ts
    types.ts
    __tests__/
  package.json
  tsconfig.json
```