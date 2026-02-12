/**
 * エンジンブリッジ全体の共通型定義。
 * 2026年の Web 標準（OPFS, WebGPU, Async Iterator）に準拠。
 */

/** 
 * ブラント型 (Branded Types) によるドメイン知識の保護。
 */
/** チェス用の局面表記 (Forsyth-Edwards Notation) */
export type FEN = string & { readonly __brand: "FEN" };
/** 将棋用の局面表記 (Shogi Forsyth-Edwards Notation) */
export type SFEN = string & { readonly __brand: "SFEN" };
/** 指し手表記 (例: e2e4, 7g7f) */
export type Move = string & { readonly __brand: "Move" };

/** エンジンの動作状態 */
export type EngineStatus = "uninitialized" | "loading" | "ready" | "busy" | "error" | "terminated";

/** エンジンのロード戦略 */
export type EngineLoadingStrategy = "manual" | "on-demand" | "eager";

/** ライセンス情報 */
export interface ILicenseInfo {
  readonly name: string;
  readonly url: string;
}

/** ロードの進捗状況 */
export interface ILoadProgress {
  /** 現在のフェーズ */
  phase: "downloading" | "initializing" | "ready";
  /** 進捗率 (0-100) */
  percentage: number;
  /** 国際化対応が必要な場合のメッセージ情報 */
  i18n?: { key: string; defaultMessage: string };
}

/** 統計・分析用のテレメトリイベント */
export interface ITelemetryEvent {
  /** イベント名 */
  event: string;
  /** 発生時刻 (UNIX タイムスタンプ) */
  timestamp: number;
  /** 属性情報 */
  attributes: Record<string, unknown>;
}

/** 実行環境の能力診断結果 */
export interface ICapabilities {
  /** OPFS (Origin Private File System) のサポート状況 */
  readonly opfs: boolean;
  /** WebWorker での SharedArrayBuffer サポート状況 */
  readonly wasmThreads: boolean;
  /** WASM SIMD 命令のサポート状況 */
  readonly wasmSimd: boolean;
  /** WebNN (Neural Network API) のサポート状況 */
  readonly webNN: boolean;
  /** WebGPU のサポート状況 */
  readonly webGPU: boolean;
  /** WebTransport のサポート状況 */
  readonly webTransport: boolean;
  /** 個別診断の詳細 */
  readonly details?: Record<string, boolean>;
}

/** セキュリティ診断状況 */
export interface ISecurityStatus {
  /** crossOriginIsolated 状態か否か (Threads 使用に必須) */
  readonly isCrossOriginIsolated: boolean;
  /** マルチスレッドが利用可能か */
  readonly canUseThreads: boolean;
  /** SRI (Subresource Integrity) がブラウザでサポートされているか */
  readonly sriSupported: boolean;
  /** 不足しているレスポンスヘッダーのリスト */
  readonly missingHeaders?: string[];
  /** 推奨される改善アクション */
  readonly recommendedActions?: string[];
}

/** 探索の基本オプション */
export interface IBaseSearchOptions {
  /** 局面表記 (FEN) ※チェス用。将棋の場合は SFEN を使用。 */
  fen?: FEN;
  /** 探索深さの制限 */
  depth?: number;
  /** 思考時間の制限 (ミリ秒) */
  time?: number;
  /** 探索ノード数の制限 */
  nodes?: number;
  /** 中断制御用のシグナル */
  signal?: AbortSignal;
}

/** 将棋用の探索オプション拡張 */
export interface ISHOGISearchOptions extends IBaseSearchOptions {
  /** 局面表記 (SFEN) */
  sfen: SFEN;
  /** 先手の持ち時間 (ミリ秒) */
  btime?: number;
  /** 後手の持ち時間 (ミリ秒) */
  wtime?: number;
  /** 秒読み (ミリ秒) */
  byoyomi?: number;
}

/** 思考状況の基本情報 */
export interface IBaseSearchInfo {
  /** 現在の探索深さ */
  depth: number;
  /** 評価値 (単位: cp = centipawns / 将棋の場合は 1歩 = 100程度) */
  score: number;
  /** 読み筋 (Principal Variation) */
  pv?: Move[];
  /** 1秒あたりの探索ノード数 (Nodes Per Second) */
  nps?: number;
  /** 思考経過時間 (ミリ秒) */
  time?: number;
  /** エンジンからの生のメッセージ */
  raw?: string;
}

/** 探索の最終結果 */
export interface IBaseSearchResult {
  /** 最善手 */
  bestMove: Move;
  /** エンジンが予想する相手の次手 */
  ponder?: Move;
  /** エンジンからの最終メッセージ */
  raw?: string;
}

/** ミドルウェアの実行優先度 */
export enum MiddlewarePriority {
  /** 低優先度 (ログ記録など) */
  LOW = 0,
  /** 標準 */
  NORMAL = 100,
  /** 高優先度 (コマンド変換など) */
  HIGH = 200,
  /** 必須・最優先 (セキュリティフィルタなど) */
  CRITICAL = 1000,
}

/** ミドルウェアがアクセスできるコンテキスト情報 */
export interface IMiddlewareContext<T_OPTIONS = IBaseSearchOptions> {
  /** 対象エンジンの識別子 */
  readonly engineId: string;
  /** 実行時の探索オプション */
  readonly options: T_OPTIONS;
}

/** ミドルウェアの定義。コマンドの送信前や結果の受信後に介入できます。 */
export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  /** 実行優先度 */
  priority?: MiddlewarePriority;
  /** エンジンへのコマンド送信時に呼び出されます */
  onCommand?(command: string | string[] | Uint8Array, context: IMiddlewareContext): string | string[] | Uint8Array | Promise<string | string[] | Uint8Array>;
  /** 思考状況の受信時に呼び出されます */
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;
  /** 探索結果の受信時に呼び出されます */
  onResult?(result: T_RESULT, context: IMiddlewareContext): T_RESULT | Promise<T_RESULT>;
}

/** 探索タスクの抽象化。ストリームと結果 Promise を提供します。 */
export interface ISearchTask<T_INFO, T_RESULT> {
  /** リアルタイムな思考状況のストリーム */
  readonly info: AsyncIterable<T_INFO>;
  /** 最終結果を待機する Promise */
  readonly result: Promise<T_RESULT>;
  /** 探索を強制停止します */
  stop(): Promise<void>;
}

/** 利用者がエンジンを操作するためのメインインターフェース */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  /** エンジンの識別子 */
  readonly id: string;
  /** 表示名 */
  readonly name: string;
  /** バージョン */
  readonly version: string;
  /** 現在の状態 */
  readonly status: EngineStatus;
  /** 現在のロード戦略 */
  loadingStrategy: EngineLoadingStrategy;

  /** エンジンをロード（ダウンロード・初期化）します。 */
  load(): Promise<void>;
  /** 探索を開始します。 */
  search(options: T_OPTIONS): Promise<T_RESULT>;
  /** 思考状況の通知を購読します。 */
  onInfo(callback: (info: T_INFO) => void): () => void;
  /** 状態変化を購読します。 */
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  /** ロード進捗を購読します。 */
  onProgress(callback: (progress: ILoadProgress) => void): () => void;
  /** テレメトリイベントを購読します。 */
  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void;
  /** 現在実行中の探索を停止します。 */
  stop(): Promise<void>;
  /** リソースを解放し、破棄します。 */
  dispose(): Promise<void>;
}

/** エンジン固有の実装（アダプター）用インターフェース */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: EngineStatus;
  readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;

  load(loader?: IEngineLoader): Promise<void>;
  searchRaw(command: string | string[] | Uint8Array): ISearchTask<T_INFO, T_RESULT>;
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  onProgress(callback: (progress: ILoadProgress) => void): () => void;
  onTelemetry?(callback: (event: ITelemetryEvent) => void): () => void;
  dispose(): Promise<void>;
}

/** プロトコルパーサーの抽象化（UCI, USI 等） */
export interface IProtocolParser<T_OPTIONS, T_INFO, T_RESULT> {
  /** エンジンからの info 行を解析します */
  parseInfo(line: string): T_INFO | null;
  /** エンジンからの結果行を解析します */
  parseResult(line: string): T_RESULT | null;
  /** 探索開始コマンドを生成します */
  createSearchCommand(options: T_OPTIONS): string | string[] | Uint8Array;
  /** 探索停止コマンドを生成します */
  createStopCommand(): string | Uint8Array;
}

/** リソースローダー。バイナリの取得とキャッシュを管理します。 */
export interface IEngineLoader {
  /** 指定されたリソースをロードし、利用可能な Blob URL を返します。 */
  loadResource(engineId: string, config: IEngineSourceConfig): Promise<string>;
  /** 生成された URL を解放します。 */
  revoke(url: string): void;
}

/** エンジンバイナリのリソース設定 */
export interface IEngineSourceConfig {
  /** 取得先 URL */
  readonly url: string;
  /** SRI (Subresource Integrity) ハッシュ */
  readonly sri: string;
  /** ファイルサイズ (バイト) */
  readonly size: number;
  /** リソースのタイプ */
  readonly type?: "wasm" | "worker-js" | "native" | "webgpu-compute" | "eval-data";
}

/** ファイルストレージ (OPFS / IndexedDB) */
export interface IFileStorage {
  /** データを保存します */
  set(key: string, data: ArrayBuffer | Blob): Promise<void>;
  /** データを取得します */
  get(key: string): Promise<ArrayBuffer | null>;
  /** データの存在確認 */
  has(key: string): Promise<boolean>;
  /** データを削除します */
  delete(key: string): Promise<void>;
  /** 全データを消去します */
  clear(): Promise<void>;
}

/** エンジンブリッジのメインインターフェース */
export interface IEngineBridge {
  /** アダプターを登録します */
  registerAdapter<T_O extends IBaseSearchOptions, T_I extends IBaseSearchInfo, T_R extends IBaseSearchResult>(adapter: IEngineAdapter<T_O, T_I, T_R>): void;
  /** アダプターの登録を解除します */
  unregisterAdapter(id: string): void;
  /** 指定されたエンジンの Facade インスタンスを取得します */
  getEngine<T_O extends IBaseSearchOptions, T_I extends IBaseSearchInfo, T_R extends IBaseSearchResult>(
    id: string, 
    strategy?: EngineLoadingStrategy
  ): IEngine<T_O, T_I, T_R>;
  /** グローバルミドルウェアを追加します */
  use<T_I = unknown, T_R = unknown>(middleware: IMiddleware<T_I, T_R>): void;
  /** リソースローダーを取得します */
  getLoader(): Promise<IEngineLoader>;
  /** 全エンジンのステータス変化をグローバルに購読します */
  onGlobalStatusChange(callback: (id: string, status: EngineStatus) => void): () => void;
  /** 全エンジンのロード進捗をグローバルに購読します */
  onGlobalProgress(callback: (id: string, progress: ILoadProgress) => void): () => void;
  /** 全エンジンのテレメトリをグローバルに購読します */
  onGlobalTelemetry(callback: (id: string, event: ITelemetryEvent) => void): () => void;
  /** ブリッジ全体を破棄し、全アダプターを解放します */
  dispose(): Promise<void>;
}

/** エラーコード */
export enum EngineErrorCode {
  /** WASM の初期化失敗 */
  WASM_INIT_FAILED = "WASM_INIT_FAILED",
  /** ネットワークエラー */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** SRI 検証の不一致 */
  SRI_MISMATCH = "SRI_MISMATCH",
  /** 探索タイムアウト */
  SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
  /** ブリッジ内部の不整合 */
  INTERNAL_ERROR = "INTERNAL_ERROR",
  /** 未知のエラー */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
