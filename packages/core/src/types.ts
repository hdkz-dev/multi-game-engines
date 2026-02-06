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

  /** 現在のロード状況 */
  readonly progress: ILoadProgress;

  /** 進捗変更時のコールバックを設定 */
  onProgress(callback: (progress: ILoadProgress) => void): void;

  /** 明示的にロードを開始 */
  load(): Promise<void>;

  /** キャッシュされているか確認 */
  isCached(): Promise<boolean>;

  /** キャッシュを削除 */
  clearCache(): Promise<void>;

  /** エンジンへのコマンド送信（内部で使用） */
  sendCommand(command: string): void;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース
 */
export interface IEngine {
  readonly adapter: IEngineAdapter;
  
  /** 探索開始（未ロード時は戦略に従い自動ロード） */
  search(options: any): Promise<any>;
  
  /** 停止 */
  stop(): Promise<void>;
  
  /** 終了処理 */
  quit(): Promise<void>;
}

