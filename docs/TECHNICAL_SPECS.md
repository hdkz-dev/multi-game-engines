# 技術仕様書 (Technical Specifications)

このドキュメントでは、`multi-game-engines` の内部実装における詳細な技術仕様を定義します。

## 1. エンジン通信フロー (Search I/O)

エンジンの探索（Search）は、思考状況のストリームと、最終結果の Promise を組み合わせた構造を持ちます。

### 探索 API インターフェース
```typescript
interface ISearchTask {
  /** 思考状況（info）の非同期イテレータ */
  info: AsyncIterable<ISearchInfo>;
  /** 最終結果（bestmove）の Promise */
  result: Promise<ISearchResult>;
  /** 探索の中断 */
  stop(): Promise<void>;
}
```

### 利用イメージ
```typescript
const task = engine.search({ depth: 20 });

// 思考状況の購読（フレームワークを問わず動作）
(async () => {
  for await (const info of task.info) {
    updateUI(info);
  }
})();

// 最終結果の待機
const bestMove = await task.result;
```

## 2. ストレージ抽象化 (File Storage)

エンジンのバイナリ（WASM）や評価関数（NNUE）を効率的に管理するための抽象化レイヤーです。

- **優先順位**: 
  1. **OPFS (Origin Private File System)**: 高速なアクセスが必要な場合。
  2. **Cache Storage API**: HTTP キャッシュのセマンティクスを利用する場合。
  3. **IndexedDB**: 汎用的なフォールバック。

## 3. Web Worker 抽象化

メインスレッドのブロッキングを防ぐため、各アダプターは Web Worker 内でエンジンを動作させます。
`core` は、Worker との通信を Promise ベースの RPC として扱える `WorkerHost` クラスを提供します。

## 5. 高度な設計パターン

### 5.1 I/O 層のプラグイン化 (Dependency Injection)
`core` は具体的なストレージ実装を持ちません。代わりに `IFileStorage` インターフェースを定義し、利用者が環境に合わせて最適な実装（OPFS, IndexedDB, S3, Node.js FS 等）を注入できるようにします。

### 5.2 厳密な状態管理 (State Machine)
エンジンのライフサイクルを以下の状態で定義し、各状態でのみ許容されるアクションを制限します。
- `IDLE`: 初期状態
- `LOADING`: リソース取得・初期化中
- `READY`: 待機中（コマンド受付可能）
- `BUSY`: 探索・思考中
- `ERROR`: 異常発生
- `TERMINATED`: 破棄済み

### 5.3 ゼロコピー通信の追求
巨大な評価関数ファイルや思考データのやり取りにおいて、`Transferable Objects` (ArrayBuffer 等) を活用し、メインスレッドと Worker 間のコピーコストをゼロに近づけます。

## 6. エラーハンドリングと回復戦略

エンジンのロード失敗や Worker のクラッシュに対して、以下の回復戦略を提供します。
1. **リトライメカニズム**: ネットワークエラー時の自動再試行。
2. **クリーンアップ**: クラッシュした Worker の確実な破棄とリソース解放。
3. **詳細なエラー報告**: エラーコードと日本語メッセージの提供。
