/**
 * エンジンのロード進捗状況
 */
export interface ILoadProgress {
  phase: 'not-started' | 'downloading' | 'initializing' | 'ready' | 'error';
  percentage: number;
  message: string;
  error?: Error;
}

/**
 * 探索中の思考状況（info）
 */
export interface ISearchInfo {
  depth: number;
  seldepth?: number;
  score: number;
  nodes?: number;
  nps?: number;
  pv?: string[];
  time?: number;
  raw?: string; // エンジンからの生メッセージ（UCI/USI等）
}

/**
 * 最終的な探索結果（bestmove）
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
  /** 思考状況を非同期ストリームとして提供 */
  info: AsyncIterable<ISearchInfo>;
  /** 最終結果を Promise として提供 */
  result: Promise<ISearchResult>;
  /** 探索を停止する */
  stop(): Promise<void>;
}

/**
 * ロード戦略
 */
export type LoadingStrategy = 'manual' | 'on-demand' | 'eager';

/**
 * エンジンアダプターの共通インターフェース
 */
export interface IEngineAdapter {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly progress: ILoadProgress;

  onProgress(callback: (progress: ILoadProgress) => void): void;
  load(): Promise<void>;
  isCached(): Promise<boolean>;
  clearCache(): Promise<void>;
  
  /** 探索の実行 */
  search(options: any): ISearchTask;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース
 */
export interface IEngine extends IEngineAdapter {
  /** アダプターへの参照 */
  readonly adapter: IEngineAdapter;
  
  /** 探索開始（未ロード時は戦略に従い自動ロードされる場合がある） */
  search(options: any): ISearchTask;
  
  /** 停止 */
  stop(): Promise<void>;
  
  /** 終了処理 */
  quit(): Promise<void>;
}