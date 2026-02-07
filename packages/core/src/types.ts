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
  /** SharedArrayBuffer が利用可能か (マルチスレッド対応に必須) */
  isCrossOriginIsolated: boolean;
  /**
   * マルチスレッドが実際に利用可能か。
   * SharedArrayBuffer があっても、ブラウザのポリシーで制限されている場合があります。
   */
  canUseThreads: boolean;
  /**
   * 不足している HTTP ヘッダー (COOP/COEP など)。
   * これらが不足していると WebWorker 間のメモリ共有ができません。
   */
  missingHeaders?: string[];
  /** ブラウザが Fetch API の integrity 属性をサポートしているか */
  sriSupported: boolean;
  /** 実際にロードされたすべてのバイナリが SRI 検証を通過したか */
  sriVerified?: boolean;
  /** 安全に実行するために必要な推奨アクション (例: "適切にヘッダーを設定してください") */
  recommendedActions?: string[];
}

/**
 * ミドルウェアのコンテキスト
 */
export interface IMiddlewareContext {
  engineId: string;
  adapterName: string;
  timestamp: number;
  /**
   * ゼロコピー通信のための Transferable オブジェクトのリスト。
   * 大容量の ArrayBuffer をスレッド間で転送する際に使用します。
   */
  transfer?: Transferable[];
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
 * ミドルウェアの優先度
 */
export enum MiddlewarePriority {
  LOW = 0,
  NORMAL = 100,
  HIGH = 200,
  MONITOR = 1000, // 変更を加えず監視のみを行う
}

/**
 * ミドルウェアの定義
 */
export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  /** 実行優先度 */
  priority?: MiddlewarePriority;

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
 * 独自 CDN (R2) のルートマニフェスト構造 (Index)
 */
export interface IEngineManifestIndex {
  version: string; // API バージョン (例: "v1")
  updatedAt: string;
  engines: Record<
    string,
    {
      description: string;
      latestVersion: string;
      versions: string[]; // 利用可能な全バージョン
    }
  >;
}

/**
 * 独自 CDN (R2) の各バージョンごとのマニフェスト構造
 * パス: /v1/{engine}/{version}/manifest.json
 */
export interface IEngineVersionManifest {
  engineId: string;
  version: string;
  files: Record<
    string,
    {
      url: string; // CDN オリジンからの相対パス、または絶対URL
      sri: string; // サブリソース整合性ハッシュ
      size: number;
      type: IEngineSourceConfig["type"];
    }
  >;
}

/**
 * 標準化されたエラーコード
 */
export enum EngineErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR", // ダウンロード失敗
  SRI_VERIFICATION_FAILED = "SRI_FAILED", // 改竄検知
  WASM_NOT_SUPPORTED = "WASM_NOT_SUPPORTED", // WASM実行不可
  INITIALIZATION_FAILED = "INIT_FAILED", // 起動時エラー
  SEARCH_TIMEOUT = "TIMEOUT", // 探索中タイムアウト
  MEMORY_LIMIT_EXCEEDED = "OUT_OF_MEMORY", // メモリ不足
  INTERNAL_ENGINE_ERROR = "ENGINE_ERROR", // エンジン内部エラー (UCI/USIプロトコル外)
  SECURITY_VIOLATION = "SECURITY_VIOLATION", // セキュリティ制限による停止
}

export interface IEngineError extends Error {
  code: EngineErrorCode;
  engineId?: string;
  originalError?: unknown;
}

/**
 * ライセンス詳細メタデータ (SPDX-準拠推奨)
 */
export interface ILicenseInfo {
  /**
   * ライセンス名。可能な限り SPDX License Identifier (例: "MIT", "GPL-3.0-only", "Apache-2.0") を使用してください。
   * 参考: https://spdx.org/licenses/
   */
  name: string;
  /** ライセンス文の全文または公式サイトへのリンク */
  url: string;
  /** GPL/LGPL等の場合、ソース公開義務に応えるためのリポジトリリンク */
  sourceCodeUrl?: string;
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
  unit: "ms" | "nodes/s" | "nodes" | "bytes" | "ratio" | "percentage" | "ply";
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
 * エンジンアダプターの静的メタデータ
 */
export interface IEngineAdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;

  /** エンジン自体のライセンス情報 (例: GPL-3.0) */
  readonly engineLicense: ILicenseInfo;
  /** アダプターパッケージ自体のライセンス情報 (例: MIT) */
  readonly adapterLicense: ILicenseInfo;

  /** ロードに使用するリソースの設定 */
  readonly sources?: Record<string, IEngineSourceConfig>;
}

/**
 * エンジンアダプターの動的なランタイム状態
 */
export interface IEngineAdapterState {
  readonly status: EngineStatus;
  readonly progress: ILoadProgress;
}

/**
 * エンジンアダプターの公開情報 (Facade利用者のための読取専用インターフェース)
 */
export interface IEngineAdapterInfo
  extends IEngineAdapterMetadata, IEngineAdapterState {}

/**
 * エンジンアダプターの共通インターフェース
 */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> extends IEngineAdapterInfo {
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
  /** アダプターの情報と状態への参照 (内部メソッドは隠蔽) */
  readonly adapter: IEngineAdapterInfo;

  /**
   * 探索を開始。
   * 非同期イテレータを通じて思考状況 (T_INFO) を、Promise を通じて最終結果 (T_RESULT) を提供。
   */
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  /**
   * エンジンのバイナリをロード・初期化。
   * search() を呼ぶ前に明示的に呼ぶことが推奨されますが、実装によっては search() 時に暗黙的に実行されます。
   */
  load(): Promise<void>;
  /**
   * 現在進行中の探索 (search) を即座に停止。
   * アダプターは生きており、次の search() をすぐに開始できます。
   */
  stop(): Promise<void>;
  /**
   * エンジンを終了し、リソース (WebWorker, メモリなど) を解放。
   * これを呼んだ後のインスタンスは利用不可能 (terminated状態) になります。
   */
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
  /** 詳細な診断メッセージ（デバッグ用） */
  details?: Record<keyof Omit<ICapabilities, "details">, string>;
}

/**
 * エンジン固有のオプション拡張
 */
export interface IEngineSpecificOptions extends Record<
  string,
  string | number | boolean | Record<string, unknown> | undefined
> {
  /** マルチスレッドエンジン用のスレッド数指定 */
  threads?: number;
  /** Hashメモリサイズ (MB) */
  hashSize?: number;
}
