# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

### 1-1. Branded Types
ドメイン固有の文字列を保護するため、Branded Types を採用しています。
```typescript
/** チェス用の局面表記 */
type FEN = string & { readonly __brand: "FEN" };
/** 将棋用の局面表記 */
type SFEN = string & { readonly __brand: "SFEN" };
/** 指し手表記 (e2e4, 7g7f 等) */
type Move = string & { readonly __brand: "Move" };
```

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ミドルウェアをシーケンシャルに適用。新しい探索が開始されると前のタスクは自動停止します。
- `onInfo(callback)`: リアルタイムな思考配信の購読。ミドルウェア適用済みデータを配信。
- `stop()`: 現在の探索を安全に中断。
- `dispose()`: 個別エンジンのリソース解放。

## 3. セキュリティとインフラ

### 3-1. EngineLoader (Modern Security)
- **SRI 必須化**: 全てのリソースに対し、ハッシュ検証を強制。空の SRI はエラーとなります。
- **動的 MIME タイプ**: WASM (`application/wasm`) や JS (`application/javascript`) を適切に識別。
- **30秒タイムアウト**: ネットワークフェッチのハングを防止。

### 3-2. ファイルストレージ (2026 Best Practice)
- **環境適応**: `OPFSStorage` (高速) と `IndexedDBStorage` (汎用) を自動切り替え。
- **堅牢な接続**: `IndexedDBStorage` は、ブラウザによる切断やバージョン更新を検知し自動復旧するライフサイクル管理を実装。
- **例外分離**: `OPFSStorage` は `NotFoundError` を正常な「キャッシュミス」として扱い、他の I/O エラーと区別。

### 3-3. WorkerCommunicator (Race-condition Free)
- **メッセージバッファリング**: `expectMessage` の呼び出し前に届いたメッセージも逃さず処理。
- **例外伝播**: Worker 内部のエラーをメインスレッドの Promise Reject として正確に伝送。

## 4. プロトコル解析

- **UCIParser**: チェス用。`mate` スコアの数値変換 (係数 10,000) をサポート。
- **USIParser**: 将棋用。`btime`, `wtime`, `byoyomi` の時間制御オプションをサポート。`mate` スコア変換 (係数 100,000)。
- **インジェクション対策**: FEN/SFEN に含まれる不正な文字（改行、セミコロン等）を自動除去。

## 5. 品質保証 (Testing Philosophy)

- **70項目のユニットテスト**: カバレッジ 100% (主要ロジック)。
- **Zero-Any Policy**: 実装およびテストコード全体での `any` 使用を禁止。
- **ライフサイクル検証**: ロードから破棄まで、実際の WebWorker 通信をシミュレートして検証。
