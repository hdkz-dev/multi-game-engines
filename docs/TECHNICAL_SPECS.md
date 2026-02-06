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

## 4. パッケージ間の依存関係

- `core` -> (依存なし)
- `adapter-*` -> `core` (Peer Dependency)
- `ui-wrappers/*` (将来) -> `core`
