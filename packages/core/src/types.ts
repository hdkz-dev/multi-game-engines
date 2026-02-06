/**
 * 公称型 (Branded Types)
 */
export type Brand<T, K> = T & { __brand: K };
export type FEN = Brand<string, "FEN">;
export type Move = Brand<string, "Move">;

/**
 * 実行環境のセキュリティ・診断ステータス
 */
export interface ISecurityStatus {
  /** SharedArrayBuffer が利用可能か */
  isCrossOriginIsolated: boolean;
  /** マルチスレッドが利用可能か */
  canUseThreads: boolean;
  /** 不足している HTTP ヘッダー */
  missingHeaders?: string[];
  /** SRI (Subresource Integrity) がサポートされているか */
  sriSupported: boolean;
  /** ロードされたリソースが SRI で検証されたか */
  sriVerified?: boolean;
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
 */
export interface ISearchTask<
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  readonly info: AsyncIterable<T_INFO>;
  readonly result: Promise<T_RESULT>;
  stop(): Promise<void>;
}

/**
 * ミドルウェアの定義
 */
export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  onCommand?(
    command: string | Uint8Array,
    context: IMiddlewareContext,
  ): string | Uint8Array | Promise<string | Uint8Array>;
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;
  onResult?(
    result: T_RESULT,
    context: IMiddlewareContext,
  ): T_RESULT | Promise<T_RESULT>;
}

/**
 * エンジンバイナリの供給元定義
 */
export interface IEngineSourceConfig {
  url: string;
  sri?: string; // Subresource Integrity
  size?: number;
  /**
   * 実行タイプ。
   * WASMに加え、2026年の主流である WebGPU (NNUE加速) や
   * ハイブリッドアプリ用の Native ブリッジをサポート。
   */
  type: "wasm" | "worker-js" | "native" | "webgpu-compute" | "eval-data";
}

/**
 * ライセンス詳細メタデータ
 */
export interface ILicenseInfo {
  name: string; // "GPL-3.0", "MIT", etc.
  url: string;
  sourceCodeUrl?: string; // GPL等の場合、ソース公開義務に応えるためのリンク
}

/**
 * 観測可能性 (Observability) のためのテレメトリデータ
 */
export interface ITelemetryEvent {
  type:
    | "load_time"
    | "nps_peak"
    | "memory_usage"
    | "error_rate"
    | "initialization_latency";
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * エンジンのロード進捗状況
 */
export interface ILoadProgress {
  phase: "not-started" | "downloading" | "initializing" | "ready" | "error";
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
export type EngineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "busy"
  | "error"
  | "terminated";

/**
 * エンジンアダプターの共通インターフェース
 */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  /** エンジン自体のライセンス情報 (例: GPL-3.0) */
  readonly engineLicense: ILicenseInfo;
  /** アダプターパッケージ自体のライセンス情報 (例: MIT) */
  readonly adapterLicense: ILicenseInfo;

  /** ロードに使用するリソースの設定 */
  readonly sources?: Record<string, IEngineSourceConfig>;

  readonly status: EngineStatus;
  readonly progress: ILoadProgress;

  prefetch?(): Promise<void>;
  load(): Promise<void>;
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  dispose(): Promise<void>;

  onStatusChange(callback: (status: EngineStatus) => void): void;
  onProgress(callback: (progress: ILoadProgress) => void): void;
  /** テレメトリデータの購読 */
  onTelemetry?(callback: (event: ITelemetryEvent) => void): void;
}

/**
 * アプリケーションが直接触れるエンジン操作インターフェース (Facade)
 */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  /** アダプターの情報と状態への参照 */
  readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>;

  /** 探索開始 */
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  /** 明示的なロード */
  load(): Promise<void>;
  /** 停止 */
  stop(): Promise<void>;
  /** 終了処理・破棄 */
  quit(): Promise<void>;

  /** UI表示用のライセンス・クレジット情報の一括取得 (アトリビューション自動化) */
  getCredits(): {
    engine: ILicenseInfo;
    adapter: ILicenseInfo;
  };
}

/**
 * エンジンブリッジ（管理者）のインターフェース
 */
export interface IEngineBridge {
  /** アダプターの登録 */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(
    adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
  ): void;

  /** エンジンの取得 */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(
    id: string,
  ): IEngine<T_OPTIONS, T_INFO, T_RESULT>;

  /** ミドルウェアの登録 */
  use<T_INFO = unknown, T_RESULT = unknown>(
    middleware: IMiddleware<T_INFO, T_RESULT>,
  ): void;

  /** 環境診断 */
  checkCapabilities(): Promise<ICapabilities>;
  getSecurityStatus(): ISecurityStatus;
}

/**
 * 実行環境の能力診断 (2026年最新基準)
 */
export interface ICapabilities {
  opfs: boolean;
  wasmThreads: boolean;
  wasmSimd: boolean;
  webNN: boolean; // Web Neural Network API
  webGPU: boolean; // WebGPU (AI/Compute加速)
  webTransport: boolean;
}
