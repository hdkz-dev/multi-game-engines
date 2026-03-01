# 技術仕様書 (TECHNICAL_SPECS.md)

## 1. コア型定義 (Core Types)

Core パッケージは、特定のゲーム（チェス、将棋等）に依存しない抽象定義のみを提供します。

### 1-1. 抽象基盤定義

- **Brand<K, T>**: 公称型 (Branded Types) を生成するための共通ヘルパー。
- **NormalizedScore**: -1.0 〜 1.0 に正規化された評価値。
- **EngineStatus**: エンジンのライフサイクル状態 (`loading`, `ready`, `busy` 等)。
- **EngineErrorCode**: 標準化されたエラーコード。

### 1-2. 思考情報 (IBaseSearchInfo) の拡張

全エンジンのアダプターが共通で返す探索情報の構造を、より高度に標準化します。

- **`positionId`**: 局面を一意識別する ID。古い局面の情報破棄に使用（Stale Message Filter）。
- **`score` (Standardized Score)**:
  - `raw`: エンジンから返された生の数値。
  - `unit`: 評価単位 (`cp`, `mate`, `points`, `winrate`, `diff`)。
  - `normalized`: `NormalizedScore` (-1.0 to 1.0)。
- **`pv` (Structured PV)**: 文字列ではなく `Move[]` 型の配列。ドメインパッケージの `Branded Move` を使用します。
- **`depth`, `seldepth`, `nodes`, `nps`, `time`, `hashfull`**: 従来通り提供。

### 1-4. 汎用 I/O とフロー制御 (Flow Control)

- **`AbortSignal`**: 全ての `loadResource`, `search`, `analyze` メソッドで必須のオプション引数として提供。
- **`ILoadProgress`**: ロード進捗を通知するための標準オブジェクト。
  - `status`: 'connecting', 'downloading', 'verifying', 'completed', 'aborted'
  - `loadedBytes`: 現在の転送済みバイト数。
  - `totalBytes`: 合計サイズ（サーバー未返答時は `undefined`）。
- **`ProgressCallback`**: `(progress: ILoadProgress) => void` の形式。

### 1-5. 環境適応型ストレージ (IFileStorage)

- **`OPFSStorage`**: ブラウザの Origin Private File System 用（最優先）。
- **`IndexedDBStorage`**: ブラウザの汎用ストレージ用（フォールバック）。
- **`NodeFSStorage`**: Node.js/Bun 環境での `fs.promises` を用いたファイルシステム用。
- **`MemoryStorage`**: 揮発性のオンメモリストレージ。
- **カスタムストレージ注入**: `IEngineBridgeOptions.storage` を通じて、利用者が独自の `IFileStorage` 実装を注入可能。

### 1-6. ブリッジ設定 (IEngineBridgeOptions)

- **`storage?: IFileStorage`**: 自動検知をオーバーライドするカスタムストレージ。
- **`capabilities?: Partial<ICapabilities>`**: 特定の能力を強制または無効化。

### 1-7. ドメイン固有の型定義 (Domain Types)

各種ゲーム固有の型（`FEN`, `SFEN`, `GOMove` 等）は、モノレポ全体での循環参照を避け、かつ UI 層やアダプター層での一貫性を保つため、それぞれのドメインパッケージ（`@multi-game-engines/domain-*`）で提供されています。

- **`Move<T>` (Hierarchical Branding)**: `core` パッケージで定義される指し手の基底型。各ドメインで `Move<"ShogiMove">` のように階層化され、基底の `Move` 型との互換性を保ちつつ、ドメイン間の誤混同をコンパイルレベルで防止します。
- **FEN / SFEN**: 局面表記（Branded string）。`PositionString<T>` を継承し、文字種・フィールド数・手番等の厳格なバリデーションを提供。
- **create*Move / create*Board**: 各ドメインパッケージが提供する「バリデータ兼ファクトリ」。アンセーフな `as` キャストを排除し、Refuse by Exception 原則に基づき、不正な入力に対して即座に `EngineError` をスローします。

### 1-3. ロード戦略 (Loading Strategy)

- `manual`: 手動ロード。`load()` 呼び出しが必要。
- `on-demand`: 自動ロード。`search()` 時に未ロードなら開始。
- `eager`: 先行ロード。生成時に即座に開始。

## 2. エンジン Facade (IEngine)

利用者が使用するメイン API。

- **EngineRegistry による自動型推論**: `bridge.getEngine('stockfish')` のように呼ぶだけで、戻り値の型が自動的に最適なジェネリクスで推論されます。
- `load()`: SRI 検証とキャッシュロードを伴う初期化。
- `search(options)`: 非同期探索。ロード戦略に応じて自動ロードを実行。ミドルウェアをシーケンシャルに適用。**ミドルウェア絶縁**により、あるミドルウェアが投げた例外が探索プロセス全体を中断させないよう、各フックは `try-catch` で個別に保護されます。
- `onInfo(callback)`: リアルタイムな思考配信の購読。ミドルウェアによるデータ正規化（`undefined` スキップ等）を経由します。
- `loadingStrategy`: ロード戦略の動的な変更。
- `consent()`: ライセンス同意が必要な場合にロードを続行。
- `stop()`: 現在の探索を安全に中断。非同期メソッドとして定義され、エラー発生時も適切にログ出力されます。
- `dispose()`: 個別エンジンのリソース解放。アダプターへの全イベント購読（Managed Subscriptions）を自動解除。

## 3. 高度な分析機能 (Analysis APIs)

### 3-1. エンジン一括解析 (EngineBatchAnalyzer)

棋譜全体を非同期かつ効率的に解析するための上位 API です。

- **割り込み優先処理**: `analyzePriority` により、バッチ解析中にリアルタイムでの局面検討を優先実行可能。
- **フロー制御**: `pause()`, `resume()`, `abort()` をサポート。
- **進捗監視**: 解析完了ごとに `onProgress` で結果と進捗率を受け取り可能。

### 3-2. 定跡書プロバイダー (IBookProvider)

巨大な定跡データをエンジン外部で独立して管理します。

- **`loadBook(asset, options)`**: 定跡アセットをロードし、WASM 側からアクセス可能な Blob URL または物理パスを返します。
- **`IBookAsset`**: `id`, `url`, `sri`, `size`, `type` (bin/db/json) を含むデータ定義。

## 4. セキュリティとインフラ

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

### 3-4. Zenith Loader (大規模データ管理)

- **Segmented Fetch**: 100MB を超えるバイナリを分割してダウンロードし、プログレスを詳細に表示。
- **Segmented SRI**: 各セグメントのハッシュを検証し、途中での改竄を防止。
- **OPFS Promotion**: ダウンロードしたバイナリを `OPFSStorage` にマウント。次回ロード時は HTTP リクエストをスキップ。

### 3-5. Hybrid Bridge (マルチ環境対応)

- **Environment Detection**: `navigator` オブジェクトの欠如や `process` オブジェクトの存在により実行環境を判定。
- **Interface Consistency**: `WebWorkerAdapter` と `NativeCommunicator` (Node.js 用) が同一の `IEngineAdapter` インターフェースを実装。
- **Stream Buffering**: `NativeCommunicator` は、OS パイプからの受信データを内部バッファで管理します。これにより、巨大な PV（検討順）などのメッセージが複数パケットに分割されて届いても、正しく結合して 1 行としてパースすることを保証します。
- **Zero-Config Switch**: 設定ファイルなしで、環境に応じた最適なバイナリ（`.wasm` vs `.exe` / `.bin`）を選択。

## 4. プロトコル解析 (2026 Best Practice)

本プロジェクトは、多様なゲームプロトコルを共通の `IEngineAdapter` に抽象化します。

- **物理構造の標準化**: 全てのアダプターは `{Name}Adapter.ts` (ライフサイクル管理) と `{Name}Parser.ts` (解析ロジック) の分離、および `src/components/` (UI系の場合) への集約を標準とします (ADR-046)。
- **UCIParser**: チェス用。`mate` スコアの数値変換 (係数 10,000) をサポート。
- **USIParser**: 将棋用。時間制御オプション、`mate` スコア変換 (係数 100,000)、および `startpos` キーワードの特殊処理をサポート。
- **GTPParser**: 囲碁用。KataGo 拡張 JSON 出力と標準 GTP 応答の両方をサポート。`visits`, `winrate`, `scoreLead`, `pv` の詳細解析に対応。
- **XiangqiParser**: シャンチー用。UCCI (Universal Chinese Chess Interface) プロトコルのパースをサポート。
- **JanggiParser**: チャンギ用。UJCI プロトコルのパースをサポート。
- **KingsRowParser**: チェッカー用。`bestmove: 11-15 (eval: 0.12)` 形式のテキスト解析。
- **GNUBGParser**: バックギャモン用。JSON プロトコルによる `equity` および勝率（Win/Gammon/Backgammon）の解析。
- **EdaxParser**: リバーシ用。テキストベースの評価値・指し手解析。
- **MahjongJSONParser**: 麻雀用 (Mortal)。多次元配列を含む複雑な局面データの検証と JSON 通信。

### 4-1. コマンド・インジェクション防御 (Structural Defense)

全てのパーサーは、コマンド生成の最終段階で `ProtocolValidator.assertNoInjection` を呼び出します。

- **対象**: `createSearchCommand` (局面データ), `createOptionCommand` (オプション名/値)。
- **検証内容**: 改行 (`\n`), ヌル (`\0`), セミコロン (`;`) 等の制御文字。
- **循環参照保護**: `WeakSet` を用いた循環オブジェクト検知を搭載。悪意ある入力による無限再帰（スタックオーバーフロー）を物理的に防止します。
- **ポリシー**: サニタイズ（除去）ではなく拒否（例外スロー）。不正な入力によるエンジンの意図しない操作を構造的に防止します。

### 4-2. 同一ゲーム・マルチエンジン対応 (Multi-Engine Support)

`EngineBridge` は、同一のプロトコルを使用する複数のエンジンを同時に管理可能です。

- **汎用アダプター (Generic Adapters)**: `adapter-uci` 等の汎用パッケージを提供。利用者は URL と SRI を指定するだけで、Stockfish 以外の UCI エンジンも即座に利用可能。
- **ID 空間の分離**: `chess-sf-16` と `chess-sf-17` のように ID を分けることで、同一ページ内でのエンジン比較（アンサンブル分析）を実現。
- **並列 Worker 実行**: エンジンごとに独立した Web Worker を割り当て、ブラウザのマルチコア能力を最大限活用。

### 4-3. 局面・指し手解析 (Board & Move Parsers)

描画層での再利用を目的とした、軽量な局面文字列パーサーを提供します。

- **parseFEN**: チェスの FEN 文字列をパースし、8x8 の駒配置配列と手番情報を抽出します。2026 Zenith Standard として、手番 (`turn`) フィールドを必須とし、欠落時は厳格にエラーをスローします。
- **parseSFEN**: 将棋の SFEN 文字列をパースし、9x9 の駒配置配列、手番、および持ち駒の数を抽出します。成駒（+）の判定、持ち駒文字列の文法、および手数カウンターが正の整数（>= 1）であることを厳格に検証します。

## 5. ハードウェア加速と AI 推論 (Zenith Tier)

2026 年時点の最新標準に基づき、以下のハードウェア加速レイヤーを統合します。

### 5-1. WebNN (Neural Network API)

- **対象**: NNUE, CNN (AlphaZero 形式) の評価関数推論。
- **デバイス選択**: `NPU` (Neural Processing Unit) を最優先し、次に `GPU`、`CPU (SIMD)` の順でフォールバック。 W3C Candidate Recommendation (2026-01) に準拠。
- **最適化**:
  - **量子化**: 8-bit (INT8) および 4-bit (INT4) モデルのネイティブサポートによる 2-4 倍の高速化。
  - **Operator Fusion**: 推論グラフ内の連続する演算（例: Linear + ReLU）を単一のカーネルで実行。

### 5-2. WebGPU Compute

- **対象**: 並列探索アルゴリズム（MCTS 等）および汎用計算。
- **IO Binding**: CPU-GPU 間のデータ転送を最小化するため、テンソルデータを GPU メモリ上に維持したまま連続実行。
- **Multi-Pass Compute**: 依存関係グラフを用いてコマンドバッファを一括送信し、ドライバオーバーヘッドを低減。

### 5-3. Zenith Loader (大容量データ配信)

- **分割検証**: 数百 MB のデータを 5MB 単位のチャンクでフェッチ。
- **SRI Checksum**: 各チャンクおよび結合後のバイナリ全体に対して `SHA-384` / `SHA-512` による整合性検証を実施。
- **OPFS 永続化**: 整合性確認済みデータを `OPFSStorage` に保存し、次回起動時のロード時間を 0ms に短縮。

## 6. テレメトリと可観測性

- **構造化テレメトリ**: `DefaultTelemetryMiddleware` による探索パフォーマンス（ミリ秒単位）の自動計測。
- **並行探索の識別**: `telemetryId` による、同一エンジン内での並行リクエストの完全なトラッキング。
- **解決策の提示 (Remediation)**: 全てのエラーに `remediation` フィールドを設け、開発者やユーザーへの具体的なアクション（「HTTPS を使用してください」等）を提示します。

## 7. UI 層と表現基盤 (UI & Presentation Layer)

### 7-1. Reactive Engine Store (`ui-core`)

高頻度なエンジンデータ（毎秒数百回の `info`）を効率的に扱うための状態管理基盤です。

- **モジュール構造**:
  - `src/state/`: `EngineStore` (状態保持), `SearchStateTransformer` (正規化マージ), `SubscriptionManager` (購読管理)。
  - `src/monitor/`: `SearchMonitor` (監視コア), `MonitorRegistry` (インスタンス管理), `EvaluationPresenter` (表示用ロジック)。
  - `src/dispatch/`: `CommandDispatcher` (命令送出), `Middleware` (加工レイヤー)。
  - `src/validation/`: `SearchInfoSchema` (Zod による契約定義)。
  - `src/styles/`: `theme.css` (全フレームワーク共通のデザインシステム基盤)。
- **Adaptive Throttling**:
  - **RAF 同期モード**: デフォルトで `requestAnimationFrame` に同期し、ブラウザの再描画周期（通常 60fps）を超えた無駄な通知を自動的に破棄します。
  - **時間ベース Throttling**: `throttleMs` オプションにより、特定のミリ秒間隔での更新強制も可能です。
- **Generic State Management**: `SearchMonitor<T_STATE>` および `createInitialState<T>` のジェネリクス対応により、アプリケーション固有の状態（例: デバッグ用カウンタ、履歴拡張）を型安全に管理可能。`as unknown as` キャストを排除。
- **決定論的スナップショット**: React の `useSyncExternalStore` に完全対応した `getSnapshot` / `subscribe` インターフェースを実装。レンダリングの「引き裂き（Tearing）」を構造的に防止します。
- **Zod 契約バリデーション**: エンジンから UI 層へ渡される全てのメッセージは `SearchInfoSchema` で実行時に検証され、不正なデータによる UI クラッシュを未然に防ぎます。
- **プレゼンテーションロジックの分離**: `EvaluationPresenter` により、評価値の表示色やラベル生成ロジックを UI フレームワークから分離・共通化。

### 7-2. React アダプター群

- **`ui-react-core`**: React 専用の基盤（`EngineUIProvider`）。他の UI パッケージの基盤となります。
- **`ui-react-monitor`**: エンジン監視コンポーネント（`EngineMonitorPanel` 等）と専用フック（`useEngineMonitor`）。
- **`ui-chess-react`, `ui-shogi-react`**: ゲーム固有の React コンポーネント。
- **`ui-react` (Hub)**: 上記を統合して提供するパッケージ。
- **Storybook 10 対応**: 最新 of Storybook エコシステム（Vite 6, Tailwind CSS v4）に完全準拠。
- **決定論的ライフサイクル**: `useRef` によるモニターインスタンスの永続化と、`useEffect` による厳格な購読解除を徹底。React 18 以降の Strict Mode および Concurrent Rendering 下でも安全に動作します。

### 7-3. Vue アダプター群

- **`ui-vue-core`**: Vue 3 専用の基盤。
- **`ui-vue-monitor`**: エンジン監視コンポーネントと `useEngineMonitor` コンポーザブル。
- **`ui-chess-vue`, `ui-shogi-vue`**: ゲーム固有の Vue コンポーネント。
- **`ui-vue` (Hub)**: 上記を統合して提供するパッケージ。
- **Vue 3 Composition API**: `useEngineMonitor` コンポーザブルによるリアクティブな状態管理。
- **Storybook 10 対応**: Vue 3 + Vite 環境での Storybook 統合。Tailwind CSS v4 サポート。

### 7-4. Web Components アダプター (`ui-elements`)

- **Lit による実装**: 軽量で標準準拠の Web Components を提供。
- **盤面コンポーネント (`<chess-board>`, `<shogi-board>`)**:
  - **局面同期**: `fen` または `sfen` プロパティの変更を検知し、CSS Grid を用いて効率的に再描画。
  - **ハイライト**: `last-move` プロパティにより、直近の指し手やエンジンが検討中の最善手を視覚的に強調。
  - **i18n & Error Handling**: `pieceNames` による動的な駒名称注入に加え、`error-message` プロパティにより解析失敗時のオーバーレイ表示をカスタマイズ可能。
  - **アクセシビリティ**: 局面の状況（手番、駒の配置）をスクリーンリーダーが解釈可能な形式で提供。

### 7-5. Federated i18n Architecture (Zenith Tier)

多言語化リソースをドメインごとに物理隔離し、究極の型安全性を実現するアーキテクチャです。

- **物理パッケージ分離**:
  - `i18n-core`: 翻訳エンジンのコアロジック。
  - `i18n-common`: 共有エラーコード、共通ステータスの定義。
  - `i18n-{domain}`: 各ゲーム（Chess, Shogi 等）固有の翻訳データ。
- **Zero-Any 型安全性**:
  - `DeepRecord`: 複雑な階層構造を持つ翻訳データに動的にアクセスするための再帰的な型定義。`unknown` の直接レンダリングを排除。
  - `I18nKey`: `core` パッケージで定義される Branded string。アダプター層が UI 層の具体的な言語実装を知ることなく、型安全にエラーを伝播させるための抽象キー。
- **最適化 (Pay-as-you-go)**:
  - 各アダプターや UI は、自身が必要な言語リソースのみをパッケージとしてインポート。不要な言語データのダウンロードを 0 に抑えます。

## 8. 品質保証 (Testing Philosophy)

- **ユニットテスト**: 主要ロジックおよびエッジケースを網羅するテスト（Core + Adapters + UI）。
- **決定論的な時間計測テスト**: `performance.now()` をモックし、環境に依存しない正確なテレメトリ検証を実現。
- **Zero-Any Policy**: 実装およびテスト全体での `any` 使用を極力排除（Middleware の内部実装など不可避な場合を除く）。`satisfies` 演算子による厳格な型推論。
- **ライフサイクル検証**: インスタンスキャッシュ、`WeakRef` によるメモリ管理、アトミックな初期化の網羅的な検証。
