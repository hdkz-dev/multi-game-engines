/**
 * エンジンのライフサイクル状態
 */
export type EngineStatus =
  | 'idle'         // 初期状態
  | 'loading'      // ロード中
  | 'ready'        // 準備完了・待機中
  | 'busy'         // 思考中
  | 'error'        // エラー発生
  | 'terminated';  // 破棄済み

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
  raw?: string;
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
  info: AsyncIterable<ISearchInfo>;
  result: Promise<ISearchResult>;
  stop(): Promise<void>;
}

/**
 * ストレージ操作のインターフェース (DI用)
 */
export interface IFileStorage {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<ArrayBuffer>;
  write(path: string, data: ArrayBuffer): Promise<void>;
  delete(path: string): Promise<void>;
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
  readonly status: EngineStatus;
  readonly progress: ILoadProgress;

  onStatusChange(callback: (status: EngineStatus) => void): void;
  onProgress(callback: (progress: ILoadProgress) => void): void;
  
  load(): Promise<void>;
  search(options: any): ISearchTask;
  
  /** リソース解放 */
  dispose(): Promise<void>;
}

/**
 * エンジンブリッジ（管理者）のインターフェース
 */
export interface IEngineBridge {
  registerAdapter(adapter: IEngineAdapter): void;
  getEngine(id: string): IEngine;
  setStorage(storage: IFileStorage): void;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース
 */
export interface IEngine extends IEngineAdapter {
  readonly adapter: IEngineAdapter;
  stop(): Promise<void>;
  quit(): Promise<void>;
}
