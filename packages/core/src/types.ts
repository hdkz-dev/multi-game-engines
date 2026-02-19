/**
 * ブランド型を生成するためのヘルパー型。
 * @template T_BASE ベースとなる型（例: string）
 * @template T_BRAND ブランド名（ユニークな文字列リテラル）
 */
export type Brand<T_BASE, T_BRAND> = T_BASE & { readonly __brand: T_BRAND };

/**
 * 指し手を表すブランド型（UCI/USI形式）。
 */
export type Move = Brand<string, "Move">;

/**
 * 局面表記を表すブランド型（FEN またはアダプター定義の独自形式）。
 */
/**
 * 局面表記を表すブランド型（FEN またはアダプター定義の独自形式）。
 */
export type PositionString<T extends string = string> = string & {
  readonly __brand: T;
};

/**
 * チェスの局面表記（FEN）。
 */
export type FEN = PositionString<"FEN">;

/**
 * 将棋の局面表記（SFEN）。
 */
export type SFEN = PositionString<"SFEN">;

export function createPositionString<T extends string>(
  value: string,
): PositionString<T> {
  return value as PositionString<T>;
}

export function createFEN(value: string): FEN {
  return createPositionString<"FEN">(value);
}

export function createSFEN(value: string): SFEN {
  return createPositionString<"SFEN">(value);
}

/**
 * エンジンの状態。
 */
export type EngineStatus =
  | "uninitialized"
  | "loading"
  | "ready"
  | "busy"
  | "error"
  | "disposed"
  | "terminated";

/**
 * 探索オプション。
 */
export interface IBaseSearchOptions {
  fen?: PositionString | undefined;
  signal?: AbortSignal | undefined;
  [key: string]: unknown;
}

/**
 * 構造化されたスコア情報。
 * 各種ゲームエンジンが返却する評価値を、プロトコルの詳細（マジックナンバー等）から隔離して保持する。
 */
export interface IScoreInfo {
  /** 評価値（センチポーン。主にチェス・将棋で使用） */
  cp?: number | undefined;
  /** 詰みまでの手数（主にチェス・将棋で使用） */
  mate?: number | undefined;
  /** 得点差（囲碁のコミ後点数、オセロの石数差など） */
  points?: number | undefined;
  /** 勝率 (0.0 - 1.0)。確率論的な評価を行うエンジンで使用。 */
  winrate?: number | undefined;
}

/**
 * 探索状況情報。
 */
export interface IBaseSearchInfo {
  /** 探索深度 (プライまたは手数) */
  depth?: number | undefined;
  /** 選択的探索深度 (Selective Depth) */
  seldepth?: number | undefined;
  /** 探索したノード数 */
  nodes?: number | undefined;
  /** 探索速度 (Nodes Per Second) */
  nps?: number | undefined;
  /** 探索時間 (ミリ秒) */
  time?: number | undefined;
  /** 読み筋 (Principal Variation) */
  pv?: Move[] | undefined;
  /** MultiPV の順位 (1, 2, ...) */
  multipv?: number | undefined;
  /** 思考の複雑さ・規模を示す追加指標（囲碁の visits など） */
  visits?: number | undefined;
  /** ハッシュテーブルの使用率 (0 - 1000) */
  hashfull?: number | undefined;
  /** 構造化スコア。cp, mate, points, winrate を統合して保持する。 */
  score?: IScoreInfo | undefined;
  /** ハードウェアアクセラレーションの使用状況 */
  acceleration?: "none" | "simd" | "webgpu" | "webnn" | undefined;
  /** デバイスメモリ使用量 (bytes) */
  memoryUsage?: number | undefined;
  [key: string]: unknown;
}

/**
 * 探索結果。
 */
export interface IBaseSearchResult {
  bestMove?: unknown;
  ponder?: unknown;
  [key: string]: unknown;
}

/**
 * ロード進捗。
 */
export interface ILoadProgress {
  phase: string;
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * 能力検出。
 */
export interface ICapabilities {
  wasmThreads: boolean;
  wasmSimd: boolean;
  webNN?: boolean;
  webGPU?: boolean;
  webTransport?: boolean;
  threads?: boolean;
  simd?: boolean;
  opfs?: boolean;
}

/**
 * セキュリティ状態。
 */
export interface ISecurityStatus {
  sriEnabled: boolean;
  coopCoepEnabled: boolean;
  sriSupported: boolean;
  canUseThreads: boolean;
  isCrossOriginIsolated: boolean;
  missingHeaders?: string[] | undefined;
}

/**
 * エラー関連。
 */
export enum EngineErrorCode {
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  CANCELLED = "CANCELLED",
  SECURITY_ERROR = "SECURITY_ERROR",
  SRI_MISMATCH = "SRI_MISMATCH",
  NOT_READY = "NOT_READY",
  SEARCH_ABORTED = "SEARCH_ABORTED",
  SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
  LIFECYCLE_ERROR = "LIFECYCLE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface IEngineError {
  message: string;
  code: EngineErrorCode;
  remediation?: string | undefined;
  engineId?: string | undefined;
}

/**
 * テレメトリ関連。
 */
export interface ITelemetryEvent {
  type: string;
  timestamp: number;
  duration?: number;
  metadata: Record<string, unknown>;
}

export type EngineTelemetry = ITelemetryEvent;

/**
 * ミドルウェア関連。
 */
export interface MiddlewareContext<T_OPTIONS = IBaseSearchOptions> {
  engineId: string;
  telemetryId?: string;
  options?: T_OPTIONS;
  emitTelemetry?: (telemetry: EngineTelemetry) => void;
}

export type IMiddlewareContext<T_OPTIONS = IBaseSearchOptions> =
  MiddlewareContext<T_OPTIONS>;

export enum MiddlewarePriority {
  LOW = -100,
  NORMAL = 0,
  HIGH = 100,
  CRITICAL = 1000,
}

export type MiddlewareCommand =
  | string
  | string[]
  | Record<string, unknown>
  | Uint8Array;

export interface IMiddleware<
  T_OPTIONS = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT = IBaseSearchResult,
> {
  id?: string;
  priority?: number;
  supportedEngines?: string[];
  /**
   * エンジンへのコマンド送信前に呼び出されます。
   * @param command 送信されるコマンド
   * @param context コンテキスト情報
   * @returns 変更されたコマンド、または undefined (変更なし)
   */
  onCommand?(
    command: MiddlewareCommand,
    context: MiddlewareContext<T_OPTIONS>,
  ):
    | Promise<MiddlewareCommand | undefined | void>
    | MiddlewareCommand
    | undefined
    | void;
  /**
   * エンジンからの情報受信時に呼び出されます。
   * @param info 受信した情報
   * @param context コンテキスト情報
   * @returns 変更された情報、または undefined (変更なし)
   */
  onInfo?(
    info: T_INFO,
    context: MiddlewareContext<T_OPTIONS>,
  ): Promise<T_INFO | undefined | void> | T_INFO | undefined | void;
  /**
   * 探索結果の受信時に呼び出されます。
   * @param result 受信した結果
   * @param context コンテキスト情報
   * @returns 変更された結果、または undefined (変更なし)
   */
  onResult?(
    result: T_RESULT,
    context: MiddlewareContext<T_OPTIONS>,
  ): Promise<T_RESULT | undefined | void> | T_RESULT | undefined | void;
}

/**
 * 探索タスク。
 * 非同期イテレータによる途中経過の取得と、Promise による最終結果の取得を両立します。
 */
export interface ISearchTask<T_INFO, T_RESULT> {
  /** 途中経過をストリームとして取得するための非同期イテレータ */
  info: AsyncIterable<T_INFO>;
  /** 最終結果が確定した時点で解決される Promise */
  result: Promise<T_RESULT>;
  /** 探索を強制的に中断します */
  stop(): void;
}

/**
 * プロトコルパーサー。
 */
export interface IProtocolParser<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  createSearchCommand(options: T_OPTIONS): MiddlewareCommand;
  createStopCommand(): MiddlewareCommand;
  createOptionCommand(name: string, value: unknown): MiddlewareCommand;
  parseInfo(line: string | Record<string, unknown>): T_INFO | null;
  parseResult(line: string | Record<string, unknown>): T_RESULT | null;
}

/**
 * エンジン・アダプター。
 */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: EngineStatus;
  readonly parser: IProtocolParser<T_OPTIONS, T_INFO, T_RESULT>;
  readonly requiredCapabilities?: Partial<ICapabilities>;

  load(loader?: IEngineLoader): Promise<void>;
  searchRaw(command: MiddlewareCommand): ISearchTask<T_INFO, T_RESULT>;
  stop(): void | Promise<void>;
  dispose(): Promise<void>;
  setOption(name: string, value: string | number | boolean): Promise<void>;
  onInfo?(callback: (info: T_INFO) => void): () => void;
  onSearchResult(callback: (result: T_RESULT) => void): () => void;
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  onProgress(callback: (progress: ILoadProgress) => void): () => void;
  onTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void;
  emitTelemetry(telemetry: EngineTelemetry): void;
}

/**
 * 利用者向け engine インターフェース。
 */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly status: EngineStatus;
  readonly lastError: IEngineError | null;
  loadingStrategy?: EngineLoadingStrategy;

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this;
  unuse(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT> | string): this;
  load(): Promise<void>;
  search(options: T_OPTIONS): Promise<T_RESULT>;
  stop(): void;
  dispose(): Promise<void>;
  onInfo(callback: (info: T_INFO) => void): () => void;
  onSearchResult(callback: (result: T_RESULT) => void): () => void;
  onStatusChange(callback: (status: EngineStatus) => void): () => void;
  onTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void;
  emitTelemetry(telemetry: EngineTelemetry): void;
}

/**
 * ロード戦略。
 */
export type EngineLoadingStrategy = "manual" | "on-demand" | "eager";

/**
 * ストレージ関連。
 */
export interface IFileStorage {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
  has?(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * エンジン・ソースのタイプ。
 */
export type IEngineSourceType =
  | "wasm"
  | "worker-js"
  | "eval-data"
  | "native"
  | "webgpu-compute"
  | "asset";

/**
 * エンジン・ソース設定。
 */
export type IEngineSourceConfig = {
  url: string;
  type: IEngineSourceType | string;
  size?: number;
  /**
   * 仮想的なマウントパス（例: "/nnue/default.nnue"）。
   * Blob URL 環境下での相対パス解決に使用される。
   */
  mountPath?: string;
} & (
  | { sri: string; __unsafeNoSRI?: never }
  | { sri?: never; __unsafeNoSRI: true }
);

/**
 * 2026 Zenith Tier: 動的エンジン構成定義。
 * 特定のアダプター実装と、その実行に必要なリソースをパッケージ化します。
 */
export interface IEngineConfig {
  /** インスタンスの一意識別子 */
  id: string;
  /** 使用するプロトコル/アダプター型（例: 'uci', 'usi', 'gtp'） */
  adapter: string;
  /** 表示名 */
  name?: string;
  /** バージョン情報 */
  version?: string;
  /** 実行リソースの定義 */
  sources: {
    /** メインのJSローダー/エントリーポイント */
    main: IEngineSourceConfig;
    /** WASM バイナリ（オプション） */
    wasm?: IEngineSourceConfig;
    /** ニューラルネットワークの重みファイル等（オプション） */
    eval?: IEngineSourceConfig;
    /** 追加の任意リソース */
    [key: string]: IEngineSourceConfig | undefined;
  };
  /** エンジン起動時のデフォルトオプション */
  options?: Record<string, unknown>;
  /** 必須とされる環境能力 */
  requiredCapabilities?: Partial<ICapabilities>;
}

/**
 * リソースマップ。
 * 仮想マウントパス（キー）と Blob URL（値）の対応を保持します。
 */
export type ResourceMap = Record<string, string>;

/**
 * エンジンローダー。
 */
export interface IEngineLoader {
  loadResource(engineId: string, config: IEngineSourceConfig): Promise<string>;
  loadResources(
    engineId: string,
    configs: Record<string, IEngineSourceConfig>,
  ): Promise<Record<string, string>>;
}

/**
 * エンジン・ブリッジ。
 */
export interface IEngineBridge {
  /**
   * 登録済みの ID または動的な設定オブジェクトからエンジンを取得します。
   */
  getEngine<K extends keyof EngineRegistry>(
    id: K,
    strategy?: EngineLoadingStrategy,
  ): Promise<EngineRegistry[K]>;
  getEngine<
    O extends IBaseSearchOptions = IBaseSearchOptions,
    I extends IBaseSearchInfo = IBaseSearchInfo,
    R extends IBaseSearchResult = IBaseSearchResult,
  >(
    config: IEngineConfig,
    strategy?: EngineLoadingStrategy,
  ): Promise<IEngine<O, I, R>>;
  getEngine<
    O extends IBaseSearchOptions = IBaseSearchOptions,
    I extends IBaseSearchInfo = IBaseSearchInfo,
    R extends IBaseSearchResult = IBaseSearchResult,
  >(
    idOrConfig: string | IEngineConfig,
    strategy?: EngineLoadingStrategy,
  ): Promise<IEngine<O, I, R>>;

  /**
   * アダプターインスタンスを明示的に登録します。
   */
  registerAdapter(
    adapter: IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >,
  ): Promise<void>;

  /**
   * 汎用アダプター用のファクトリ（クラス）を登録します。
   */
  registerAdapterFactory<
    O extends IBaseSearchOptions = IBaseSearchOptions,
    I extends IBaseSearchInfo = IBaseSearchInfo,
    R extends IBaseSearchResult = IBaseSearchResult,
  >(
    type: string,
    factory: (config: IEngineConfig) => IEngineAdapter<O, I, R>,
  ): void;

  unregisterAdapter(id: string): Promise<void>;
  onGlobalStatusChange(
    callback: (id: string, status: EngineStatus) => void,
  ): () => void;
  onGlobalProgress(
    callback: (id: string, progress: ILoadProgress) => void,
  ): () => void;
  onGlobalTelemetry(
    callback: (id: string, event: ITelemetryEvent) => void,
  ): () => void;
  dispose(): Promise<void>;
}

/**
 * 宣言併合用レジストリ。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EngineRegistry {}
