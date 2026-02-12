/**
 * エンジンブリッジ全体の共通型定義。
 * Core パッケージは、特定のゲーム（チェス、将棋、囲碁等）や
 * プロトコル（UCI, USI 等）に対する知識を一切持ちません。
 */

/** ブラント型 (Branded Types) の基底定義 */
export type Brand<T, K> = T & { readonly __brand: K };

/** 
 * 指し手表記の基底。
 * 多くのエンジンで共通して文字列が使用されるため、共通定義として保持します。
 */
export type Move = string & { readonly __brand: "Move" };

/** エンジンの動作状態 */
export type EngineStatus = "uninitialized" | "loading" | "ready" | "busy" | "error" | "terminated";

/** エラーコードの定義 */
export enum EngineErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  SRI_MISMATCH = "SRI_MISMATCH",
  SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NOT_READY = "NOT_READY",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

/** エンジンのロード戦略 */
export type EngineLoadingStrategy = "manual" | "on-demand" | "eager";

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

/** テレメトリイベント */
export interface ITelemetryEvent {
  event: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

/** 実行環境の能力診断 */
export interface ICapabilities {
  readonly opfs: boolean;
  readonly wasmThreads: boolean;
  readonly wasmSimd: boolean;
  readonly webNN: boolean;
  readonly webGPU: boolean;
  readonly webTransport: boolean;
  readonly details?: Record<string, boolean>;
}

/** セキュリティ診断状況 */
export interface ISecurityStatus {
  readonly isCrossOriginIsolated: boolean;
  readonly canUseThreads: boolean;
  readonly sriSupported: boolean;
  readonly missingHeaders?: string[];
}

/** 探索の基本オプション (全ゲーム共通) */
export interface IBaseSearchOptions {
  /** 探索深さの制限 */
  depth?: number;
  /** 思考時間の制限 (ミリ秒) */
  time?: number;
  /** 探索ノード数の制限 */
  nodes?: number;
  /** 中断制御用のシグナル */
  signal?: AbortSignal;
}

/** 思考状況の基本情報 (全ゲーム共通) */
export interface IBaseSearchInfo {
  depth: number;
  score: number;
  pv?: Move[];
  nps?: number;
  time?: number;
  raw?: string;
}

/** 探索の最終結果 (全ゲーム共通) */
export interface IBaseSearchResult {
  /** 最善手 */
  bestMove: Move;
  /** 次手の予想 */
  ponder?: Move;
  /** 生の出力 */
  raw?: string;
}

/** エンジンと型のマッピング定義 (Declaration Merging 用) */
export interface EngineRegistry {}

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
  loadingStrategy: EngineLoadingStrategy;

  load(): Promise<void>;
  search(options: T_OPTIONS): Promise<T_RESULT>;
  onInfo(callback: (info: T_INFO) => void): () => void;
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  onProgress(callback: (progress: ILoadProgress) => void): () => void;
  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void;
  stop(): Promise<void>;
  setOption(name: string, value: string | number | boolean): Promise<void>;
  dispose(): Promise<void>;
}

/** ブリッジ全体のインターフェース */
export interface IEngineBridge {
  registerAdapter<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(adapter: IEngineAdapter<O, I, R>): void;
  unregisterAdapter(id: string): void;
  getEngine<K extends keyof EngineRegistry>(id: K, strategy?: EngineLoadingStrategy): IEngine<any, any, any>;
  getEngine<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(id: string, strategy?: EngineLoadingStrategy): IEngine<O, I, R>;
  use<I, R>(middleware: IMiddleware<I, R>): void;
  checkCapabilities(): Promise<ICapabilities>;
  getLoader(): Promise<IEngineLoader>;
  dispose(): Promise<void>;
}

/** アダプター用インターフェース */
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
  setOption(name: string, value: string | number | boolean): Promise<void>;
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  onProgress(callback: (progress: ILoadProgress) => void): () => void;
  onTelemetry?(callback: (event: ITelemetryEvent) => void): () => void;
  dispose(): Promise<void>;
}

/** パーサーインターフェース */
export interface IProtocolParser<T_OPTIONS, T_INFO, T_RESULT> {
  parseInfo(data: string | Uint8Array | unknown): T_INFO | null;
  parseResult(data: string | Uint8Array | unknown): T_RESULT | null;
  createSearchCommand(options: T_OPTIONS): string | string[] | Uint8Array;
  createStopCommand(): string | Uint8Array;
  createOptionCommand(name: string, value: string | number | boolean): string | Uint8Array;
}

/** 探索タスク */
export interface ISearchTask<T_INFO, T_RESULT> {
  readonly info: AsyncIterable<T_INFO>;
  readonly result: Promise<T_RESULT>;
  stop(): Promise<void>;
}

/** リソースローダー */
export interface IEngineLoader {
  loadResource(engineId: string, config: IEngineSourceConfig): Promise<string>;
  loadResources(engineId: string, configs: Record<string, IEngineSourceConfig>): Promise<Record<string, string>>;
  revoke(url: string): void;
}

/** リソース設定 */
export interface IEngineSourceConfig {
  readonly url: string;
  readonly sri: string;
  readonly size: number;
  readonly type?: "wasm" | "worker-js" | "native" | "webgpu-compute" | "eval-data";
}

/** ストレージ */
export interface IFileStorage {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/** ミドルウェアコンテキスト */
export interface IMiddlewareContext<T_OPTIONS = IBaseSearchOptions> {
  readonly engineId: string;
  readonly options: T_OPTIONS;
}

export enum MiddlewarePriority {
  LOW = 0,
  NORMAL = 100,
  HIGH = 200,
  CRITICAL = 1000,
}

export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  priority?: MiddlewarePriority;
  onCommand?(command: string | string[] | Uint8Array, context: IMiddlewareContext): string | string[] | Uint8Array | Promise<string | string[] | Uint8Array>;
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;
  onResult?(result: T_RESULT, context: IMiddlewareContext): T_RESULT | Promise<T_RESULT>;
}
