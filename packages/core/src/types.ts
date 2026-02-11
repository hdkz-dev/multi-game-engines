/**
 * エンジンブリッジ全体の共通型定義。
 * 2026年の Web 標準（OPFS, WebGPU, Async Iterator）に準拠。
 */

/** 
 * ブラント型 (Branded Types) によるドメイン知識の保護。
 */
export type FEN = string & { readonly __brand: "FEN" };
export type Move = string & { readonly __brand: "Move" };

/** エンジンの動作状態 */
export type EngineStatus = "uninitialized" | "loading" | "ready" | "busy" | "error" | "terminated";

/** ライセンス情報 */
export interface ILicenseInfo {
  readonly name: string;
  readonly url: string;
}

/** ロードの進捗状況 */
export interface ILoadProgress {
  phase: "downloading" | "initializing" | "ready";
  percentage: number;
  i18n?: { key: string; defaultMessage: string };
}

/** 統計・分析用のテレメトリイベント */
export interface ITelemetryEvent {
  event: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

/** 実行環境の能力診断結果 */
export interface ICapabilities {
  readonly opfs: boolean;
  readonly wasmThreads: boolean;
  readonly wasmSimd: boolean;
  readonly webNN: boolean;
  readonly webGPU: boolean;
  readonly webTransport: boolean;
  readonly details?: Record<string, boolean>; // 個別診断の詳細
}

/** セキュリティ診断状況 */
export interface ISecurityStatus {
  readonly isCrossOriginIsolated: boolean;
  readonly canUseThreads: boolean;
  readonly sriSupported: boolean;
  readonly missingHeaders?: string[];
  readonly recommendedActions?: string[];
}

/** 探索の基本オプション */
export interface IBaseSearchOptions {
  fen: FEN;
  depth?: number;
  time?: number;
  nodes?: number;
  signal?: AbortSignal;
}

/** 思考状況の基本情報 */
export interface IBaseSearchInfo {
  depth: number;
  score: number;
  pv?: Move[];
  nps?: number;
  time?: number;
  raw?: string;
}

/** 探索の最終結果 */
export interface IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
  raw?: string;
}

/** ミドルウェアの実行優先度 */
export enum MiddlewarePriority {
  LOW = 0,
  NORMAL = 100,
  HIGH = 200,
  CRITICAL = 1000,
}

/** ミドルウェアがアクセスできるコンテキスト情報 */
export interface IMiddlewareContext<T_OPTIONS = IBaseSearchOptions> {
  readonly engineId: string;
  readonly options: T_OPTIONS;
}

/** ミドルウェアの定義 */
export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  priority?: MiddlewarePriority;
  onCommand?(command: string | string[] | Uint8Array, context: IMiddlewareContext): string | string[] | Uint8Array | Promise<string | string[] | Uint8Array>;
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;
  onResult?(result: T_RESULT, context: IMiddlewareContext): T_RESULT | Promise<T_RESULT>;
}

/** 探索タスクの抽象化 */
export interface ISearchTask<T_INFO, T_RESULT> {
  readonly info: AsyncIterable<T_INFO>;
  readonly result: Promise<T_RESULT>;
  stop(): Promise<void>;
}

/** 利用者がエンジンを操作するためのメインインターフェース */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: EngineStatus;

  load(): Promise<void>;
  search(options: T_OPTIONS): Promise<T_RESULT>;
  onInfo(callback: (info: T_INFO) => void): () => void;
  stop(): Promise<void>;
  dispose(): Promise<void>;
}

/** エンジン固有の実装（アダプター） */
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

/** プロトコルパーサーの抽象化 */
export interface IProtocolParser<T_OPTIONS, T_INFO, T_RESULT> {
  parseInfo(line: string): T_INFO | null;
  parseResult(line: string): T_RESULT | null;
  createSearchCommand(options: T_OPTIONS): string | string[] | Uint8Array;
  createStopCommand(): string | Uint8Array;
}

/** リソースローダー */
export interface IEngineLoader {
  loadResource(engineId: string, config: IEngineSourceConfig): Promise<string>;
  revoke(url: string): void;
}

/** エンジンバイナリのリソース設定 */
export interface IEngineSourceConfig {
  readonly url: string;
  readonly sri: string;
  readonly size: number;
  readonly type?: "wasm" | "worker-js" | "native" | "webgpu-compute" | "eval-data";
}

/** ファイルストレージ (OPFS / IndexedDB) */
export interface IFileStorage {
  set(key: string, data: ArrayBuffer | Blob): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** エンジンブリッジの管理 */
export interface IEngineBridge {
  registerAdapter<T_O extends IBaseSearchOptions, T_I extends IBaseSearchInfo, T_R extends IBaseSearchResult>(adapter: IEngineAdapter<T_O, T_I, T_R>): void;
  getEngine<T_O extends IBaseSearchOptions, T_I extends IBaseSearchInfo, T_R extends IBaseSearchResult>(id: string): IEngine<T_O, T_I, T_R>;
  use<T_I = unknown, T_R = unknown>(middleware: IMiddleware<T_I, T_R>): void;
  getLoader(): Promise<IEngineLoader>;
  onGlobalStatusChange(callback: (id: string, status: EngineStatus) => void): () => void;
  onGlobalProgress(callback: (id: string, progress: ILoadProgress) => void): () => void;
  onGlobalTelemetry(callback: (id: string, event: ITelemetryEvent) => void): () => void;
}

/** エラーコード */
export enum EngineErrorCode {
  WASM_INIT_FAILED = "WASM_INIT_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  SRI_MISMATCH = "SRI_MISMATCH",
  SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
