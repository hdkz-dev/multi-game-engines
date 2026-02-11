# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

### 1-1. Branded Types
ドメイン固有の文字列を保護するため、Branded Types を採用しています。
```typescript
type FEN = string & { readonly __brand: "FEN" };
type Move = string & { readonly __brand: "Move" };
```

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ミドルウェアをシーケンシャルに適用。中断時は `reject` を返す。
- `onInfo(callback)`: リアルタイムな思考配信の購読。ミドルウェア適用済みデータを配信。

## 3. セキュリティとインフラ

### 3-1. EngineLoader
- **SRI 必須化**: 全てのリソースに対し、ハッシュ検証を強制。
- **動的 MIME タイプ**: リソース種別（wasm/js）に応じた適切な Content-Type 設定。

### 3-2. ファイルストレージ (2026 Best Practice)
- **接続の不変性**: `IndexedDBStorage` は、ブラウザによる接続クローズやバージョンアップを検知し、自動的に再接続を試みるライフサイクル管理を実装。
- **精密な例外分離**: `OPFSStorage` は `NotFoundError` (正常系) とそれ以外の致命的エラー（破損、制限）を厳格に区別。

### 3-3. WorkerCommunicator
- **メッセージバッファリング**: レースコンディション防止。
- **AbortSignal ネイティブ対応**: 低レイヤーでの標準的な中断制御。

## 4. エンジン・エコシステム (IEngineBridge)

- **グローバル監視**: `onGlobalStatusChange`, `onGlobalProgress`, `onGlobalTelemetry` を提供。
- **インスタンス管理**: 同一 ID のエンジンに対する Facade インスタンスのキャッシュと、ミドルウェア追加時の自動パージ。

## 5. エラーハンドリング (EngineError)

- `WASM_INIT_FAILED`, `NETWORK_ERROR`, `SRI_MISMATCH`, `SEARCH_TIMEOUT`, `INTERNAL_ERROR`.
