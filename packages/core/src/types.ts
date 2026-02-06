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
  isCrossOriginIsolated: boolean; // SharedArrayBuffer が利用可能か
  canUseThreads: boolean;
  missingHeaders?: string[]; // 不足している HTTP ヘッダーのリスト
}

/**
 * ミドルウェア
 */
export interface IMiddlewareContext {
  engineId: string;
  adapterName: string;
  timestamp: number;
}

export interface IMiddleware {
  onCommand?(command: string | Uint8Array, context: IMiddlewareContext): string | Uint8Array | Promise<string | Uint8Array>;
  onInfo?(info: any, context: IMiddlewareContext): any | Promise<any>;
  onResult?(result: any, context: IMiddlewareContext): any | Promise<any>;
}

/**
 * エンジンアダプター
 */
export interface IEngineAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly license: string;
  
  /** 投機的ロード（低優先度でのダウンロード開始） */
  prefetch?(): Promise<void>;
  
  load(): Promise<void>;
  search(options: ISearchOptions): ISearchTask;
  dispose(): Promise<void>;
}

/**
 * エンジンブリッジ
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter): void;
  getEngine(id: string): IEngine;
  use(middleware: IMiddleware): void;
  
  /** 環境診断 */
  getSecurityStatus(): ISecurityStatus;
}

export interface ISearchOptions {
  fen: FEN;
  depth?: number;
  time?: number;
  signal?: AbortSignal;
}

export interface ISearchTask {
  info: AsyncIterable<any>;
  result: Promise<any>;
  stop(): Promise<void>;
}

export interface IEngine extends IEngineAdapter {
  readonly adapter: IEngineAdapter;
}
