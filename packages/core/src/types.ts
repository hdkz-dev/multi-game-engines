/**
 * 究極の型定義 (The Ultimate Type Definitions)
 */

export type Brand<T, K> = T & { __brand: K };
export type FEN = Brand<string, 'FEN'>;
export type Move = Brand<string, 'Move'>;

/**
 * 実行環境の能力診断
 */
export interface ICapabilities {
  opfs: boolean;
  wasmThreads: boolean;
  wasmSimd: boolean;
  webNN: boolean;
  webGPU: boolean;    // 追加: 次世代 GPU 計算
  webTransport: boolean; // 追加: 超低遅延通信
}

/**
 * ロード進捗
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
 * 探索タスク
 */
export interface ISearchTask {
  info: AsyncIterable<any>;
  result: Promise<any>;
  stop(): Promise<void>;
}

/**
 * エンジンアダプター（WASI, WebGPU, WebTransport を包含）
 */
export interface IEngineAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly license: string;
  
  prefetch?(): Promise<void>;
  load(): Promise<void>;
  search(options: any): ISearchTask;
  dispose(): Promise<void>;
}

/**
 * エンジンブリッジ
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter): void;
  getEngine(id: string): IEngine;
  checkCapabilities(): Promise<ICapabilities>;
}

export interface IEngine extends IEngineAdapter {
  readonly adapter: IEngineAdapter;
}