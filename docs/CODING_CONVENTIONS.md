# コーディング規約

## 命名規則

- パッケージ: `@multi-game-engines/<name>`
- インターフェース: `I` プレフィックス (例: `IEngine`, `IAdapterOptions`)
- クラス: PascalCase (例: `EngineBridge`)
- ファイル: kebab-case (例: `engine-bridge.ts`)

## TypeScript 規約

- **any の禁止**: 全てのコードにおいて `any` の使用を禁止します。型が不明な場合は `unknown` を使用し、適切に型ガードまたは型アサーションを行ってください。
- **Branded Types の使用**: `FEN` や `Move` 等のドメイン固有の文字列型には Branded Types を使用し、型レベルでの混用バグを防止します。
- **SRI (Subresource Integrity)**: 外部からスクリプトや WASM を動的にロードする場合、必ず SRI による整合性検証を組み込んでください。
- **ジェネリクスの順序**: エンジン関連のジェネリクスを使用する場合、以下の順序を厳守してください。
  1. `T_OPTIONS`: 探索設定
  2. `T_INFO`: 思考状況
  3. `T_RESULT`: 探索結果

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
