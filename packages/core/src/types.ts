/**
 * 公称型 (Branded Types)
 */
export type Brand<T, K> = T & { __brand: K };
export type FEN = Brand<string, 'FEN'>;
export type Move = Brand<string, 'Move'>;

/**
 * 実行環境のセキュリティ・診断ステータス
 */
export interface ISecurityStatus {
  isCrossOriginIsolated: boolean;
  canUseThreads: boolean;
  missingHeaders?: string[];
}

/**
 * ミドルウェアのコンテキスト
 */
export interface IMiddlewareContext {
  engineId: string;
  adapterName: string;
  timestamp: number;
}

/**
 * 探索オプションの基底
 */
export interface IBaseSearchOptions {
  fen: FEN;
  depth?: number;
  time?: number;
  nodes?: number;
  signal?: AbortSignal;
}

/**
 * 思考状況の基底
 */
export interface IBaseSearchInfo {
  depth: number;
  score: number;
  pv?: Move[];
  nps?: number;
  time?: number;
  raw?: string;
}

/**
 * 探索結果の基底
 */
export interface IBaseSearchResult {
  bestMove: Move;
  ponder?: Move;
  raw?: string;
}

/**
 * 実行中の探索タスク
 * @template T_INFO 思考状況の型
 * @template T_RESULT 最終結果の型
 */
export interface ISearchTask<T_INFO extends IBaseSearchInfo = IBaseSearchInfo, T_RESULT extends IBaseSearchResult = IBaseSearchResult> {
  /** 思考状況を非同期ストリームとして提供 */
  readonly info: AsyncIterable<T_INFO>;
  /** 最終結果を Promise として提供 */
  readonly result: Promise<T_RESULT>;
  /** 探索を停止する */
  stop(): Promise<void>;
}

/**
 * ミドルウェアの定義
 */
export interface IMiddleware<T_INFO = any, T_RESULT = any> {
  onCommand?(command: string | Uint8Array, context: IMiddlewareContext): string | Uint8Array | Promise<string | Uint8Array>;
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;
  onResult?(result: T_RESULT, context: IMiddlewareContext): T_RESULT | Promise<T_RESULT>;
}

/**
 * エンジンのロード進捗状況
 */
export interface ILoadProgress {
  phase: 'not-started' | 'downloading' | 'initializing' | 'ready' | 'error';
  percentage: number;
  i18n: {
    key: string;
    params?: Record<string, string | number>;
    defaultMessage: string;
  };
  error?: Error;
}

/**
 * エンジンライフサイクル状態
 */
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'busy' | 'error' | 'terminated';

/**
 * エンジンアダプターの共通インターフェース
 * @template T_OPTIONS 探索オプションの型
 * @template T_INFO 思考状況の型
 * @template T_RESULT 最終結果の型
 */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly status: EngineStatus;
  readonly progress: ILoadProgress;

  prefetch?(): Promise<void>;
  load(): Promise<void>;
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  dispose(): Promise<void>;
  
  onStatusChange(callback: (status: EngineStatus) => void): void;
  onProgress(callback: (progress: ILoadProgress) => void): void;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース
 */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult
> extends IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT> {
  /** アダプターへの参照 */
  readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>;
  
  stop(): Promise<void>;
  quit(): Promise<void>;
}

/**
 * エンジンブリッジ（管理者）のインターフェース
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter<any, any, any>): void;
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult
  >(id: string): IEngine<T_OPTIONS, T_INFO, T_RESULT>;
  use(middleware: IMiddleware): void;
  checkCapabilities(): Promise<ICapabilities>;
  getSecurityStatus(): ISecurityStatus;
}

/**
 * 実行環境の能力診断
 */
export interface ICapabilities {
  opfs: boolean;
  wasmThreads: boolean;
  wasmSimd: boolean;
  webNN: boolean;
  webGPU: boolean;
  webTransport: boolean;
}
