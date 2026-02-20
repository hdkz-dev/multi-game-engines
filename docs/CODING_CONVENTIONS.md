# コーディング規約

## 命名規則

- パッケージ: `@multi-game-engines/<name>`
- インターフェース: `I` プレフィックス (例: `IEngine`, `IAdapterOptions`)
- クラス: PascalCase (例: `EngineBridge`)
- ファイル: kebab-case (例: `engine-bridge.ts`)

## TypeScript 規約

- **any の禁止**: 全てのコードにおいて `any` の使用を禁止します。型が不明な場合は `unknown` を使用し、適切に型ガードまたは型アサーションを行ってください。
- **Branded Types の使用**: `FEN` や `Move` 等のドメイン固有の文字列型には Branded Types を使用し、型レベルでの混用バグを防止します。
- **ジェネリクスの順序**: エンジン関連のジェネリクスを使用する場合、以下の順序を厳守してください。
  1. `T_OPTIONS`: 探索設定
  2. `T_INFO`: 思考状況
  3. `T_RESULT`: 探索結果

## セキュリティ規約

- **SRI (Subresource Integrity)**: 外部からスクリプトや WASM を動的にロードする場合、必ず SRI による整合性検証を組み込んでください。openssl コマンド等でハッシュを生成し、スクリプト内で照合します。
- **Secure Headers**: Web Worker や CDN からのリスポンスには、適切なセキュリティヘッダー (`Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Resource-Policy`) を付与し、`SharedArrayBuffer` の安全な使用を保証してください。
- **CORS**: エラーレスポンスを含め、全てのレスポンスに適切な CORS ヘッダーを付与してください。
- **Refuse by Exception (入力拒否)**: ユーザー入力やプロトコルデータに基づく処理を行う場合、サニタイズ（置換して実行）ではなく、不正な文字を検知した時点で即座に例外をスローして処理を拒否してください。特にプロトコル解析やパストラバーサル防止においては、ブラックリスト方式の置換を避け、ホワイトリストまたは厳格な構造チェックを行ってください。

## ドキュメンテーション規約

- **言語**: ドキュメントおよびコード内のコメントは、原則として**日本語**を使用します。
- **コードとの同期**: ドキュメント内のインターフェース定義や設計記述は、実装 (`types.ts` 等) と常に同期させてください。PR レビュー時に不一致がないか確認します。
- **リンク**: ドキュメント間のリンクは相対パスを使用し、リンク切れがないように動作確認を行ってください。

## インフラ・スクリプト規約

- **Shell Scripts**: シェルスクリプトは `set -euo pipefail` を使用し、エラー時に直ちに停止するようにしてください。外部コマンド (curl 等) にはタイムアウトを設定してください。
- **Docker**: ビルドコンテキストを意識し、必要な設定ファイル (`nginx.conf` 等) が正しくコピーされる記述にしてください。

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
