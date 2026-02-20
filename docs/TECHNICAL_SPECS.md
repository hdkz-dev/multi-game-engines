# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

Core パッケージは、特定のゲーム（チェス、将棋等）に依存しない抽象定義のみを提供します。

### 1-1. 抽象基盤定義

- **Brand<K, T>**: 公称型 (Branded Types) を生成するための共通ヘルパー。
- **EngineStatus**: エンジンのライフサイクル状態 (`loading`, `ready`, `busy` 等)。
- **EngineErrorCode**: 標準化されたエラーコード。

### 1-2. ドメイン固有の型定義 (Domain Types)

各種ゲーム固有の型（`FEN`, `SFEN`, `GOMove` 等）は、モノレポ全体での循環参照を避け、かつ UI 層やアダプター層での一貫性を保つため、それぞれのドメインパッケージ（`@multi-game-engines/domain-*`）で提供されています。

- **FEN**: チェス局面表記（Branded string）。`@multi-game-engines/domain-chess` の `createFEN` ファクトリによる、文字種・フィールド数・手番等の厳格なバリデーション。
- **SFEN**: 将棋局面表記（Branded string）。`@multi-game-engines/domain-shogi` の `createSFEN` ファクトリによる、駒配置、持ち駒、および手数カウンター（整数値 >= 1）の厳格なバリデーション。
- **GOMove**: 囲碁の指し手（Branded string）。GTP 形式（A1-Z25, pass, resign）をサポート。
- **PositionString**: `core` パッケージで提供される、ゲームに依存しない汎用局面表記の基底型。

```typescript
import { createFEN } from "@multi-game-engines/domain-chess";

const pos = createFEN(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);
```

### 1-3. ロード戦略 (Loading Strategy)

- `manual`: 手動ロード。`load()` 呼び出しが必要。
- `on-demand`: 自動ロード。`search()` 時に未ロードなら開始。
- `eager`: 先行ロード。生成時に即座に開始。

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。

- **EngineRegistry による自動型推論**: `bridge.getEngine('stockfish')` のように呼ぶだけで、戻り値の型が自動的に最適なジェネリクスで推論されます。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ロード戦略に応じて自動ロードを実行。ミドルウェアをシーケンシャルに適用。新しい探索が開始されると前のタスクは自動停止します。
- `onInfo(callback)`: リアルタイムな思考配信の購読。ミドルウェアによるデータ正規化（`undefined` スキップ等）を経由します。
- `loadingStrategy`: ロード戦略の動的な変更。
- `stop()`: 現在の探索を安全に中断。非同期メソッドとして定義され、エラー発生時も適切にログ出力されます。
- `dispose()`: 個別エンジンのリソース解放。アダプターへの全イベント購読（Managed Subscriptions）を自動解除。

## 3. セキュリティとインフラ

### 3-1. EngineLoader (Modern Security)

- **SRI 必須化**: 全てのリソースに対し、ハッシュ検証を強制。`sri` プロパティは必須であり、空の場合は明示的な `__unsafeNoSRI` フラグが必要です。W3C 標準のマルチハッシュ（スペース区切り）に対応。
- **アトミック・マルチロード**: `loadResources()`により、WASM 本体と重みファイルなどの複数リソースを一括で検証・取得し、依存関係の一貫性を保証。
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

## 4. プロトコル解析 (2026 Best Practice)

本プロジェクトは、多様なゲームプロトコルを共通の `IEngineAdapter` に抽象化します。

- **UCIParser**: チェス用。`mate` スコアの数値変換 (係数 10,000) をサポート。
- **USIParser**: 将棋用。時間制御オプション、`mate` スコア変換 (係数 100,000)、および `startpos` キーワードの特殊処理をサポート。
- **GTPParser**: 囲碁用。`genmove` や `loadboard` などのコマンド生成、および `visits` や `winrate` の解析に対応。
- **UCCIParser**: 中国将棋（Xiangqi）用。UCI ベースだが XQFEN 局面形式に対応。
- **JSONParser (Mahjong)**: 麻雀用。構造化された JSON メッセージのパースと、再帰的なインジェクション検証。
- **Generic Text Parsers**: Edax, gnubg, KingsRow 等の独自テキストプロトコルに対応するための柔軟な正規表現ベースのパーサー。リバーシやバックギャモン等のゲームをサポートします。

### 4-1. 同一ゲーム・マルチエンジン対応 (Multi-Engine Support)

`EngineBridge` は、同一のプロトコルを使用する複数のエンジンを同時に管理可能です。

- **汎用アダプター (Generic Adapters)**: `adapter-uci` 等の汎用パッケージを提供。利用者は URL と SRI を指定するだけで、Stockfish 以外の UCI エンジンも即座に利用可能。
- **ID 空間の分離**: `chess-sf-16` と `chess-sf-17` のように ID を分けることで、同一ページ内でのエンジン比較（アンサンブル分析）を実現。
- **並列 Worker 実行**: エンジンごとに独立した Web Worker を割り当て、ブラウザのマルチコア能力を最大限活用。

### 4-2. 局面・指し手解析 (Board & Move Parsers)

描画層での再利用を目的とした、軽量な局面文字列パーサーを提供します。

- **parseFEN**: チェスの FEN 文字列をパースし、8x8 の駒配置配列と手番情報を抽出します。2026 Zenith Standard として、手番 (`turn`) フィールドを必須とし、欠落時は厳格にエラーをスローします。
- **parseSFEN**: 将棋の SFEN 文字列をパースし、9x9 の駒配置配列、手番、および持ち駒の数を抽出します。成駒（+）の判定、持ち駒文字列の文法、および手数カウンターが正の整数（>= 1）であることを厳格に検証します。

## 5. テレメトリと可観測性

- **構造化テレメトリ**: `DefaultTelemetryMiddleware` による探索パフォーマンス（ミリ秒単位）の自動計測。
- **並行探索の識別**: `telemetryId` による、同一エンジン内での並行リクエストの完全なトラッキング。
- **解決策の提示 (Remediation)**: 全てのエラーに `remediation` フィールドを設け、開発者やユーザーへの具体的なアクション（「HTTPS を使用してください」等）を提示します。

## 6. UI 層と表現基盤 (UI & Presentation Layer)

### 6-1. Reactive Engine Store (`ui-core`)

高頻度なエンジンデータ（毎秒数百回の `info`）を効率的に扱うための状態管理基盤です。

- **Adaptive Throttling**:
  - **RAF 同期モード**: デフォルトで `requestAnimationFrame` に同期し、ブラウザの再描画周期（通常 60fps）を超えた無駄な通知を自動的に破棄します。
  - **時間ベース Throttling**: `throttleMs` オプションにより、特定のミリ秒間隔での更新強制も可能です。
- **Generic State Management**: `SearchMonitor<T_STATE>` および `createInitialState<T>` のジェネリクス対応により、アプリケーション固有の状態（例: デバッグ用カウンタ、履歴拡張）を型安全に管理可能。`as unknown as` キャストを排除。
- **決定論的スナップショット**: React の `useSyncExternalStore` に完全対応した `getSnapshot` / `subscribe` インターフェースを実装。レンダリングの「引き裂き（Tearing）」を構造的に防止します。
- **Zod 契約バリデーション**: エンジンから UI 層へ渡される全てのメッセージは `SearchInfoSchema` で実行時に検証され、不正なデータによる UI クラッシュを未然に防ぎます。
- **プレゼンテーションロジックの分離**: `EvaluationPresenter` により、評価値の表示色やラベル生成ロジックを UI フレームワークから分離・共通化。

### 6-2. React アダプター群

- **`ui-react-core`**: React 専用の基盤（`EngineUIProvider`）。他の UI パッケージの基盤となります。
- **`ui-react-monitor`**: エンジン監視コンポーネント（`EngineMonitorPanel` 等）と専用フック（`useEngineMonitor`）。
- **`ui-chess-react`, `ui-shogi-react`**: ゲーム固有の React コンポーネント。
- **`ui-react` (Hub)**: 上記を統合して提供するパッケージ。
- **Storybook 10 対応**: 最新 of Storybook エコシステム（Vite 6, Tailwind CSS v4）に完全準拠。
- **決定論的ライフサイクル**: `useRef` によるモニターインスタンスの永続化と、`useEffect` による厳格な購読解除を徹底。React 18 以降の Strict Mode および Concurrent Rendering 下でも安全に動作します。

### 6-3. Vue アダプター群

- **`ui-vue-core`**: Vue 3 専用の基盤。
- **`ui-vue-monitor`**: エンジン監視コンポーネントと `useEngineMonitor` コンポーザブル。
- **`ui-chess-vue`, `ui-shogi-vue`**: ゲーム固有の Vue コンポーネント。
- **`ui-vue` (Hub)**: 上記を統合して提供するパッケージ。
- **Vue 3 Composition API**: `useEngineMonitor` コンポーザブルによるリアクティブな状態管理。
- **Storybook 10 対応**: Vue 3 + Vite 環境での Storybook 統合。Tailwind CSS v4 サポート。

### 6-4. Web Components アダプター (`ui-elements`)

- **Lit による実装**: 軽量で標準準拠の Web Components を提供。
- **盤面コンポーネント (`<chess-board>`, `<shogi-board>`)**:
  - **局面同期**: `fen` または `sfen` プロパティの変更を検知し、CSS Grid を用いて効率的に再描画。
  - **ハイライト**: `last-move` プロパティにより、直近の指し手やエンジンが検討中の最善手を視覚的に強調。
  - **i18n & Error Handling**: `pieceNames` による動的な駒名称注入に加え、`error-message` プロパティにより解析失敗時のオーバーレイ表示をカスタマイズ可能。
  - **アクセシビリティ**: 局面の状況（手番、駒の配置）をスクリーンリーダーが解釈可能な形式で提供。

## 7. 品質保証 (Testing Philosophy)

- **ユニットテスト**: 主要ロジックおよびエッジケースを網羅するテスト（Core + Adapters + UI）。
- **決定論的な時間計測テスト**: `performance.now()` をモックし、環境に依存しない正確なテレメトリ検証を実現。
- **Zero-Any Policy**: 実装およびテスト全体での `any` 使用を極力排除（Middleware の内部実装など不可避な場合を除く）。`satisfies` 演算子による厳格な型推論。
- **ライフサイクル検証**: インスタンスキャッシュ、`WeakRef` によるメモリ管理、アトミックな初期化の網羅的な検証。
