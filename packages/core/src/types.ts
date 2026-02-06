/**
 * 公称型 (Branded Types) の定義
 */
export type Brand<T, K> = T & { __brand: K };

export type FEN = Brand<string, 'FEN'>;
export type Move = Brand<string, 'Move'>;

/**
 * ミドルウェアの定義
 */
export interface IMiddlewareContext {
  engineId: string;
  adapterName: string;
  timestamp: number;
}

export interface IMiddleware {
  onCommand?(command: string, context: IMiddlewareContext): string | Promise<string>;
  onInfo?(info: any, context: IMiddlewareContext): any | Promise<any>;
  onResult?(result: any, context: IMiddlewareContext): any | Promise<any>;
}

/**
 * エンジンのライフサイクル状態
 */
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'busy' | 'error' | 'terminated';

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
 * 探索オプション
 */
export interface ISearchOptions {
  fen: FEN;
  depth?: number;
  time?: number;
  nodes?: number;
  signal?: AbortSignal;
  extra?: Record<string, unknown>;
}

/**
 * 探索結果
 */
export interface ISearchResult {
  bestMove: Move;
  ponder?: Move;
  raw?: string;
}

/**
 * エンジンアダプターの共通インターフェース
 */
export interface IEngineAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly status: EngineStatus;
  readonly progress: ILoadProgress;

  load(): Promise<void>;
  search(options: ISearchOptions): ISearchTask;
  dispose(): Promise<void>;
  
  /** 自己修復のための状態復旧 */
  recover?(lastFen: FEN): Promise<void>;
}

/**
 * エンジンブリッジのインターフェース
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter): void;
  getEngine(id: string): IEngine;
  use(middleware: IMiddleware): void;
  
  /** 全体での CPU リソース制限 */
  setMaxThreads(count: number): void;
}

export interface ISearchTask {
  info: AsyncIterable<any>;
  result: Promise<ISearchResult>;
  stop(): Promise<void>;
}

export interface IEngine extends IEngineAdapter {
  readonly adapter: IEngineAdapter;
  stop(): Promise<void>;
  quit(): Promise<void>;
}