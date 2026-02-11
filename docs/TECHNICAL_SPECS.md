# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

### 1-1. Branded Types
ドメイン固有の文字列を保護するため、Branded Types を採用しています。
```typescript
type FEN = string & { readonly __brand: "FEN" };
type Move = string & { readonly __brand: "Move" };
```

### 1-2. 思考状況 (Search Info)
```typescript
interface IBaseSearchInfo {
  depth: number;
  score: number; // cp または mate (10000倍)
  pv?: Move[];
  nps?: number;
  time?: number;
}
```

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ミドルウェアを**シーケンシャルに適用**。中断時は `reject` を返す。
- `onInfo(callback)`: リアルタイムな思考配信の購読。ミドルウェア適用済みデータを配信。

## 3. セキュリティとインフラ

### 3-1. EngineLoader
- **SRI 必須化**: 全てのリソースに対し、`sha256-` または `sha384-` で始まるハッシュ検証を強制。
- **動的 MIME タイプ**: `config.type` に応じ `application/wasm` 等を適切に設定し、ロード互換性を確保。
- **OPFS キャッシュ**: `navigator.storage.getDirectory()` を使用した高速なバイナリ保存。

### 3-2. WorkerCommunicator
- **メッセージバッファリング**: 未処理のメッセージを一時保持し、期待されるレスポンスの先行到着（レースコンディション）を防止。
- **タイムアウト**: プロトコル初期化時のハングを防ぐための自動中断。
- **例外伝播**: Worker 内部のクラッシュをメインスレッドの `EngineError` としてキャッチ。

## 4. ミドルウェアパイプライン (ADR-020, ADR-023)

`onCommand`, `onInfo`, `onResult` の各フェーズでデータを加工可能。
- **逐次実行保証**: `for...of` ループにより、前のミドルウェアの出力を確実に次の入力として受け渡すシーケンシャル実行を保証。
- **優先度順**: `MiddlewarePriority` に基づき実行。

## 5. エラーハンドリング (EngineError)

- `WASM_INIT_FAILED`: WASM の読み込みまたはインスタンス化失敗。
- `SRI_MISMATCH`: リソースの整合性チェック失敗。
- `SEARCH_TIMEOUT`: 中断またはタイムアウト。
- `NETWORK_ERROR`: ダウンロード障害（HTTP ステータスを含む）。
