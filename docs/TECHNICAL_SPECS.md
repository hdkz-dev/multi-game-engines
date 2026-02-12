# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

Core パッケージは、特定のゲーム（チェス、将棋等）に依存しない抽象定義のみを提供します。

### 1-1. 抽象基盤定義
- **Brand<T, K>**: 公称型 (Branded Types) を生成するための共通ヘルパー。
- **EngineStatus**: エンジンのライフサイクル状態。
- **EngineErrorCode**: 標準化されたエラーコード。

### 1-2. アダプターによるドメイン拡張
各ゲーム固有の型（`FEN`, `SFEN`, `Move` 等）は、各アダプターパッケージで個別に定義されます。これにより Core の純粋性が保たれます。
```typescript
/** 各アダプターで定義される例 */
type FEN = Brand<string, "FEN">;
type SFEN = Brand<string, "SFEN">;
```

### 1-2. ロード戦略 (Loading Strategy)
- `manual`: 手動ロード。`load()` 呼び出しが必要。
- `on-demand`: 自動ロード。`search()` 時に未ロードなら開始。
- `eager`: 先行ロード。生成時に即座に開始。

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。
- **EngineRegistry による自動型推論**: `bridge.getEngine('stockfish')` のように呼ぶだけで、戻り値の型が自動的に最適なジェネリクスで推論されます。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ロード戦略に応じて自動ロードを実行。ミドルウェアをシーケンシャルに適用。新しい探索が開始されると前のタスクは自動停止します。
- `onInfo(callback)`: リアルタイムな思考配信の購読。
- `loadingStrategy`: ロード戦略の動的な変更。
- `stop()`: 現在の探索を安全に中断。
- `dispose()`: 個別エンジンのリソース解放。アダプターへの全イベント購読（Managed Subscriptions）を自動解除。

## 3. セキュリティとインフラ

### 3-1. EngineLoader (Modern Security)
- **SRI 必須化**: 全てのリソースに対し、ハッシュ検証を強制。空の SRI はエラーとなります。W3C 標準のマルチハッシュ（スペース区切り）に対応。
- **アトミック・マルチロード**: `loadResources()` により、WASM 本体と重みファイルなどの複数リソースを一括で検証・取得し、依存関係の一貫性を保証。
- **動的 MIME タイプ**: WASM (`application/wasm`) や JS (`application/javascript`) を適切に識別。
- **Auto-Revocation**: メモリリーク防止のため、リロード時に古い Blob URL を自動的に `revoke`。
- **30秒タイムアウト**: ネットワークフェッチのハングを防止。`Error Cause API` による詳細なエラー追跡。

### 3-2. ファイルストレージ (2026 Best Practice)
- **環境適応**: `OPFSStorage` (高速) と `IndexedDBStorage` (汎用) を自動切り替え。
- **接続の堅牢性**: `IndexedDBStorage` は接続遮断を検知し自動復旧する仕組みを実装。
- **例外分離**: `OPFSStorage` は `NotFoundError` を正常系として扱い、他の I/O エラーと区別。

### 3-3. WorkerCommunicator (Race-condition Free)
- **メッセージバッファリング**: `expectMessage` の呼び出し前に届いたメッセージも逃さず処理。
- **例外伝播**: Worker 内部のエラーや強制終了（terminate）時の保留タスクを正確に伝送。

## 4. プロトコル解析

- **UCIParser**: チェス用。`mate` スコアの数値変換 (係数 10,000) をサポート。
- **USIParser**: 将棋用。時間制御オプション、`mate` スコア変換 (係数 100,000)、および `startpos` キーワードの特殊処理をサポート。
- **インジェクション対策**: FEN/SFEN に含まれる不正な文字を自動除去。

## 5. 品質保証 (Testing Philosophy)

- **82項目のユニットテスト**: 主要ロジックおよびエッジケースのカバレッジ 100%。
- **Zero-Any Policy**: 実装およびテスト全体での `any` 使用を禁止。
- **ライフサイクル検証**: 各ロード戦略や、実際の通信をシミュレートした網羅的な検証。
