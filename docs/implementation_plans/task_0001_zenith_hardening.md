# 実装計画: task_0001 Zenith Hardening & 多ゲーム統合基盤の構築 (最終確定版)

## 1. 概要

`multi-game-engines` を、Webブラウザ、CLI、サーバーサイドのあらゆる環境で動作し、外部プロジェクトからの高度な要求（やねうらお/Stockfish 統合等）に完璧に応えるための「究極の思考エンジン・プラットフォーム」へと進化させます。

## 2. 優先実装項目と詳細設計

### ① 評価値・思考情報の標準化 (Standardization)

- **Score Normalization**: 異種ゲームの評価値を `-1.0 〜 1.0` (NormalizedScore) に統一する `ScoreNormalizer` の実装。
- **Structured PV**: 文字列ベースの読み筋を `Move[]` (Branded Types) の配列としてパース。
- **Stale Message Filter**: `positionId` を用いた、過去の局面に対する不要な解析情報の自動破棄。

### ② セキュリティ・ハードニング (Zenith Security)

- **Command Injection Defense**: 全アダプターのコマンド生成パスに対する `ProtocolValidator.assertNoInjection` の全数監査と適用。
- **Deep SRI Verification**: WASM だけでなく、NNUE 評価関数や定跡バイナリを含む全アセットへの SRI 強制。
- **Consent-Aware Lifecycle**: GPL ライセンス等の同意が必要なエンジンのための「同意ハンドシェイク」ステートマシンの導入。

### ③ 汎用 I/O とフロー制御 (Flow Control & Resilience)

- **Abortable API**: 全てのロード・解析処理における `AbortSignal` による中断サポート。
- **Granular Progress API**: 環境非依存（UI/CLI 両対応）の `onProgress` コールバックによるバイト単位の進捗通知。
- **Resilient Fetching**: 指数バックオフ付きの自動リトライ (`fetchWithRetry`) と、巨大ファイルの `Range` リクエストによる再開可能ダウンロード。
- **Graceful Shutdown**: `terminate()` 前にエンジン固有の終了コマンド (`quit`) を送信するクリーンな終了プロセス。

### ④ 環境適応型リソース・ストレージ管理 (Resource & Storage Guard)

- **EnvironmentDetector**: COOP/COEP, RAM, CPU コア数、実行環境（Browser/Node/Bun）の動的検知。
- **Environment-Agnostic Storage**: ブラウザ向けの OPFS/IndexedDB に加え、CLI/Node 用の `NodeFSStorage` (OSファイルシステムキャッシュ) および `MemoryStorage` の実装。
- **Pluggable Storage Architecture**: `EngineBridge` へのカスタム `IFileStorage` 注入をサポート。Cordova や Capacitor 等のプラグインを介したネイティブ領域への保存を可能にします。
- **ResourceGovernor**: 検知した環境に基づく `Threads`, `Hash` の自動推奨値算出。
- **EngineConcurrencyController**: モバイル環境等での「同時アクティブエンジン数」の制限とメモリ保護。
- **BackgroundThrottle**: タブ非表示時（Page Visibility API）のリソース自動節約。

### ⑤ 運用・UXの高度化 (UX & Intelligence)

- **Binary Variant Selection**: 環境（SIMD/Multi-thread 支持状況）に応じた最適な WASM バイナリの自動ロード。
- **Engine Batch Analyzer**: 優先度制御（割り込み優先）と制御（`pause`/`resume`/`abort`）が可能な非同期一括解析キュー。
- **Engine Message Translator**: エンジン独自のテキストエラーを型安全な i18n キーへ変換。
- **Isolation Helper**: 統合先プロジェクトでのセキュリティヘッダー設定を支援する診断・アドバイスツール。

## 3. マイルストーンとタスク詳細

### マイルストーン 1: Core 基盤の強化 (Phase 1) - [完了]

- [x] `packages/core/src/types.ts` の型定義拡張。
- [x] `ScoreNormalizer`, `ProtocolValidator`, `EnvironmentDetector` の実装。
- [x] `Environment-Agnostic Storage` (`NodeFSStorage`) の追加。

### マイルストーン 2: フロー制御とアセット管理の刷新 (Phase 2) - [完了]

- [x] `AssetLoader` への `onProgress`, `AbortSignal`, `fetchWithRetry` の組み込み。
- [x] `EngineConcurrencyController` および `BackgroundThrottle` の実装。

### マイルストーン 3: アダプターの Zenith 準拠化 (Phase 3) - [完了]

- [x] `adapter-usi`, `adapter-uci`, `adapter-gtp` 等の全数監査とリファクタリング。
- [x] `EngineBatchAnalyzer` および `Consent-Aware Lifecycle` の統合。

## 4. 完了条件 - [全て達成]

- [x] UI、CLI、サーバーサイドのいずれの環境でも、同一のコードベースでエンジンを安全かつ効率的に管理できること。
- [x] 全ての思考エンジンにおいて、標準化された評価値 (-1.0 〜 1.0) と構造化された読み筋が得られること。
- [x] 低スペック端末や隔離環境下でも、クラッシュせずに最適なリソース設定で動作すること。

---

**完了日**: 2026-02-27
**成果物**: `@multi-game-engines/core` v0.1.0 (Hardened), 各プロトコルアダプターの Zenith 準拠アップデート。
