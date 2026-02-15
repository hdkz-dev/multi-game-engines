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

### 1-3. ロード戦略 (Loading Strategy)

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

## 4. プロトコル解析 (2026 Best Practice)

- **UCIParser**: チェス用。`mate` スコアの数値変換 (係数 10,000) をサポート。
- **USIParser**: 将棋用。時間制御オプション、`mate` スコア変換 (係数 100,000)、および `startpos` キーワードの特殊処理をサポート。
- **インジェクション対策 (Refuse by Exception)**: 不正な制御文字（`\r`, `\n`, `\0`, `;` 等）を検出した場合、サニタイズせず即座に `SECURITY_ERROR` をスローし、入力を拒否します。
- **再帰的オブジェクト検証**: JSON 形式のアダプター（Mahjong 等）では、オブジェクトツリーを再帰的に走査して全ての文字列値に対してインジェクション検証を適用します。
- **Strict Regex Validation (出力検証)**: エンジンからの出力（UCI 指し手など）は、正規表現によって厳格に検証し、形式に適合しないデータは `null` として破棄します。正規表現は `static readonly` として事前コンパイルし、NPS (Nodes Per Second) への影響を最小化します。
- **Exception-Safe Parsing (例外安全性)**: JSON ベースのエンジンプロトコル（Mortal 等）では、`JSON.parse` を `try-catch` でラップし、不正な JSON データを受信してもストリーム処理全体がクラッシュしないよう保護します。

## 5. テレメトリと可観測性

- **構造化テレメトリ**: `DefaultTelemetryMiddleware` による探索パフォーマンス（ミリ秒単位）の自動計測。
- **並行探索の識別**: `telemetryId` による、同一エンジン内での並行リクエストの完全なトラッキング。
- **解決策の提示 (Remediation)**: 全てのエラーに `remediation` フィールドを設け、開発者やユーザーへの具体的なアクション（「HTTPS を使用してください」等）を提示します。

## 7. UI 層と表現基盤 (UI & Presentation Layer)

### 7-1. Reactive Engine Store (`ui-core`)

高頻度なエンジンデータ（毎秒数百回の `info`）を効率的に扱うための状態管理基盤です。

- **Adaptive Throttling**:
  - **RAF 同期モード**: デフォルトで `requestAnimationFrame` に同期し、ブラウザの再描画周期（通常 60fps）を超えた無駄な通知を自動的に破棄します。
  - **時間ベース Throttling**: `throttleMs` オプションにより、特定のミリ秒間隔での更新強制も可能です。
- **決定論的スナップショット**: React の `useSyncExternalStore` に完全対応した `getSnapshot` / `subscribe` インターフェースを実装。レンダリングの「引き裂き（Tearing）」を構造的に防止します。
- **Zod 契約バリデーション**: エンジンから UI 層へ渡される全てのメッセージは `SearchInfoSchema` で実行時に検証され、不正なデータによる UI クラッシュを未然に防ぎます。

### 7-2. React アダプター (`ui-react`)

- **決定論的ライフサイクル**: `useRef` によるモニターインスタンスの永続化と、`useEffect` による厳格な購読解除を徹底。React 18 以降の Strict Mode および Concurrent Rendering 下でも安全に動作します。
- **UI 依存性注入 (EngineUIProvider)**: コンテキストを通じて i18n 文字列やデザインテーマを一括管理。
- **アクセシビリティ (WCAG 2.2 AA)**:
  - **Landmark Roles**: `EngineMonitorPanel` は `section` ランドマークとして機能。
  - **Intelligent Live Regions**: 重大な状態変化（詰みの発見、エラー等）のみを `aria-live="assertive"` で通知し、通常の更新は `polite` で処理。
  - **Focus Trap & Management**: Radix UI プリミティブによるキーボードフォーカス制御。

## 8. 品質保証 (Testing Philosophy)

- **ユニットテスト**: 主要ロジックおよびエッジケースを網羅する 117 項目のテスト（Core + Adapters）。
- **決定論的な時間計測テスト**: `performance.now()` をモックし、環境に依存しない正確なテレメトリ検証を実現。
- **Zero-Any Policy**: 実装およびテスト全体での `any` 使用を禁止。`satisfies` 演算子による厳格な型推論。
- **ライフサイクル検証**: インスタンスキャッシュ、`WeakRef` によるメモリ管理、アトミックな初期化の網羅的な検証。
