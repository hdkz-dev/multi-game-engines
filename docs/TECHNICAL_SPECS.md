# 技術仕様書 (Technical Specifications)

本ドキュメントは、`multi-game-engines` プロジェクトにおける技術的基盤、設計原則、および実装の詳細を定義します。

---

## 1. アーキテクチャ原則

### 1.1 Facade パターンによる I/O 分離

エンジンの具象的な実装（Adapter）と、利用者向けの API（Engine）を完全に分離します。

- **IEngine (Facade)**: 利用者が直接操作するインターフェース。探索の開始/停止、結果の受け取りを担当し、ミドルウェアやタスクの排他制御（自動停止）を提供します。
- **IEngineAdapter**: ロード、通信、セキュリティ検証を担当。`searchRaw` メソッドを通じて、加工済みのプロトコルコマンドをエンジンへ送信します。

### 1.2 コマンドとストリーミングの統合

- **searchRaw(command)**: ミドルウェア適用後の生のコマンドを受け取り、実行します。
- **AsyncIterable**: エンジンの思考状況（info）は `AsyncIterable` を用いて配信されます。これにより、`for await...of` ループを用いたリアルタイム更新が可能です。

### 1.3 Branded Types (公称型) によるドメイン保護

`string` や `number` などの基本型への依存を排除し、意味的な安全性を担保します。

- **FEN**: `string & { readonly __brand: "FEN" }`
- **Move**: `string & { readonly __brand: "Move" }`

---

## 2. インフラ層の責務

### 2.1 EngineLoader (リソース管理)

外部 CDN からバイナリをロードする際、以下のステップを透過的に行います。
1. **SRI 検証**: `manifest.json` に基づくハッシュ検証。
2. **永続キャッシュ**: OPFS (Origin Private File System) または IndexedDB への保存。
3. **Blob URL 生成**: Worker 起動用の安全な一時 URL の提供と解放（revoke）。

### 2.2 WorkerCommunicator (通信抽象化)

WebWorker との通信をカプセル化し、型安全なメッセージ送受信を提供します。Worker クラッシュ時には待機中の Promise を適切に reject し、アプリケーションのハングアップを防止します。

---

## 3. ストレージと実行環境の診断

### 3.1 CapabilityDetector

実行環境の機能を `globalThis` を通じてユニバーサルに診断します。
- **OPFS**: 大容量データの永続化に優先使用。
- **WASM SIMD/Threads**: CPU 命令の可用性に基づくバイナリ選択。
- **WebNN / WebGPU**: 機械学習アクセラレーションの検出。

---

## 4. セキュリティと隔離環境

### 4.1 サンドボックス化

GPL/AGPL 等のライセンス感染を防ぐため、エンジン実行体は常にメインスレッドから分離された WebWorker 内で実行されます。アダプターは MIT ライセンスで提供され、エンジン本体を含みません。

---

## 5. 運用とエコシステム

- **CI/CD**: GitHub Actions により、PR ごとに Lint, Build, Test を自動実行。
- **テレメトリ**: `search_start`, `search_complete`, `load_time` 等の統計を `EngineBridge` で一括監視可能。
