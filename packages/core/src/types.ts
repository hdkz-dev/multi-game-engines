/**
 * ログレベル
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 外部から注入可能なロガー
 */
export interface ILogger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
}

/**
 * 国際化対応のメッセージ情報
 */
export interface II18nMessage {
  key: string;
  params?: Record<string, string | number>;
  defaultMessage: string; // 日本語等のデフォルトメッセージ
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
  i18n: II18nMessage; // 文字列の代わりに構造化されたメッセージを返す
  error?: Error;
}

/**
 * 実行環境の機能サポート状況
 */
export interface ICapabilities {
  opfs: boolean;
  wasmThreads: boolean;
  wasmSimd: boolean;
  webNN: boolean;
}

/**
 * 探索オプション
 */
export interface ISearchOptions {
  fen: string;
  depth?: number;
  time?: number;
  nodes?: number;
  signal?: AbortSignal;
  extra?: Record<string, unknown>;
}

/**
 * 探索中の思考状況
 */
export interface ISearchInfo {
  depth: number;
  score: number;
  pv?: string[];
  nps?: number;
  time?: number;
  raw?: string;
}

/**
 * 最終的な探索結果
 */
export interface ISearchResult {
  bestMove: string;
  ponder?: string;
  raw?: string;
}

/**
 * 実行中の探索タスク
 */
export interface ISearchTask {
  info: AsyncIterable<ISearchInfo>;
  result: Promise<ISearchResult>;
  stop(): Promise<void>;
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

  onStatusChange(callback: (status: EngineStatus) => void): void;
  onProgress(callback: (progress: ILoadProgress) => void): void;
  
  load(): Promise<void>;
  search(options: ISearchOptions): ISearchTask;
  dispose(): Promise<void>;
}

/**
 * エンジンブリッジ（管理者）のインターフェース
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter): void;
  getEngine(id: string): IEngine;
  setLogger(logger: ILogger): void;
  checkCapabilities(): Promise<ICapabilities>;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース
 */
export interface IEngine extends IEngineAdapter {
  readonly adapter: IEngineAdapter;
  stop(): Promise<void>;
  quit(): Promise<void>;
}
