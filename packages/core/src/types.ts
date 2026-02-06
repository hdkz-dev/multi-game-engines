/**
 * エンジンのライフサイクル状態
 */
export type EngineStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'busy'
  | 'error'
  | 'terminated';

/**
 * カスタムエラークラス
 */
export class EngineError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

/**
 * 探索オプション
 */
export interface ISearchOptions {
  fen: string;
  depth?: number;
  time?: number;
  nodes?: number;
  /** 標準のキャンセル信号 */
  signal?: AbortSignal;
  /** エンジン固有の追加オプション */
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
  /** 明示的な停止（AbortController 以外での制御用） */
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

  load(): Promise<void>;
  /** 標準の ISearchOptions を受け取る */
  search(options: ISearchOptions): ISearchTask;
  dispose(): Promise<void>;
}

/**
 * ストレージ操作（SRI検証を含む）
 */
export interface IFileStorage {
  read(path: string, integrity?: string): Promise<ArrayBuffer>;
  write(path: string, data: ArrayBuffer): Promise<void>;
}