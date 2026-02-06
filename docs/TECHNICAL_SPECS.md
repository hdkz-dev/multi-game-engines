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

### 5.4 標準的なキャンセル制御 (AbortSignal)
探索の中断には、独自の実装ではなく標準の `AbortSignal` を使用します。これにより、上位レイヤーでのタイムアウト処理や、複数の非同期処理の一括キャンセルとの統合が容易になります。

### 5.5 テレメトリと観測可能性 (Observability)
`performance.mark()` および `performance.measure()` を活用し、エンジンのライフサイクルにおける各フェーズの所要時間を可視化します。これらのデータは開発者ツールで分析可能です。

### 5.6 セキュリティとサブリソース完全性 (SRI)
外部リソース（WASM/JS）を動的にロードする際、期待されるハッシュ値を検証する機能を備えます。これにより、サプライチェーン攻撃からアプリケーションを保護します。

### 5.7 次世代 AI アクセラレーション (WebNN)
WASM だけでなく、ブラウザ標準の Web Neural Network API (WebNN) を活用した推論加速をサポートします。アダプターはハードウェア（GPU/NPU）の利用可否を判断し、最適なバックエンドを選択できます。

### 5.8 プラグ＆プレイ・ダイナミックロード
外部 URL からアダプターを直接ロードする際、そのアダプターが信頼できるか、および `IEngineAdapter` インターフェースを正しく実装しているかを、メタデータ検証によって実行時に担保します。

### 5.10 国際化 (i18n) 対応
ライブラリが発するメッセージ（進捗、エラー等）は直接的な文字列ではなく、`I18nKey` を用いて管理されます。これにより、利用者のアプリケーションの言語設定に合わせた翻訳が可能です。

### 5.11 機能検知とレジリエンス (Capability Detection)
実行環境の Web 標準 API サポート状況（OPFS, WebAssembly Threads, WebNN 等）を起動時に診断します。最適な機能が利用できない場合でも、スムーズに代替手段（IndexedDB, Single-thread WASM 等）へ切り替えるレジリエンスを備えます。

### 5.13 自己修復 (Self-Healing)
エンジンのプロセス（Worker）が異常終了した場合、直前の局面（FEN等）を保持し、自動的にプロセスを再起動して状態を復元するレジリエンス機能を備えます。

### 5.14 ミドルウェア・パイプライン
エンジンとの通信（Command/Info/Result）の間に、任意のミドルウェアを挿入可能にします。これにより、ログ収集、メトリクス送信、メッセージの動的変換などをコアを修正することなく実現できます。

### 5.15 グローバル・リソース管理 (Concurrency Control)
デバイスの論理コア数を検知し、複数エンジンが稼働する場合でもシステム全体の CPU 負荷が適切に分散されるよう、スレッド割り当てを統治（Orchestration）します。

### 5.17 セキュリティ診断とマルチスレッド統治 (COOP/COEP)
WASM マルチスレッドを有効にするためのブラウザ制限（Cross-Origin Isolation）を自動診断します。設定が不足している場合、開発者に対して必要な HTTP ヘッダー（COOP/COEP）の設定ガイドをプログラム経由で提供します。

### 5.18 投機的プリフェッチ (Predictive Prefetching)
利用者の行動（マウスホバー、メニュー選択等）をシグナルとして、エンジンのダウンロードを投機的に開始する `prefetch()` API を提供します。これにより、実際の使用時点での待ち時間をゼロに近づけます。

### 5.19 バイナリ・ファースト・通信
大量のデータを扱う場合、文字列ベースのプロトコルをバイナリ（Uint8Array）でラップし、`Transferable Objects` を活用したゼロコピー通信を優先します。これにより、高 NPS (Nodes Per Second) 環境でのメインスレッドの負荷を最小化します。

### 8.1 Changesets による自動バージョニング
モノリポ内のパッケージ間の依存関係を考慮し、[Changesets](https://github.com/changesets/changesets) を用いた自動バージョニングと Changelog 生成を行います。

### 8.2 クロスブラウザ・テスト
GitHub Actions 上で、Playwright を用いた複数ブラウザ環境での Worker/WASM 動作検証を自動化します。
