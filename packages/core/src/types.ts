/**
 * ブランド型を生成するためのヘルパー型。
 * @template T_BASE ベースとなる型（例: string）
 * @template T_BRAND ブランド名（ユニークな文字列リテラル）
 */
export type Brand<T_BASE, T_BRAND> = T_BASE & { readonly __brand: T_BRAND };

/**
 * FEN (Forsyth-Edwards Notation) を表すブランド型。
 */
export type FEN = Brand<string, "FEN">;

/**
 * 指し手を表すブランド型（UCI/USI形式）。
 */
export type Move = Brand<string, "Move">;

/**
 * 局面表記を表すブランド型（FEN またはアダプター定義の独自形式）。
 */
export type PositionString = Brand<string, "PositionString">;

/**
 * 局面情報のバリデータファクトリ。
 */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new Error("Invalid FEN: Input must be a non-empty string.");
  }
  const fields = pos.trim().split(/\s+/);
  if (fields.length < 4) {
    throw new Error(
      `Invalid FEN structure: Expected at least 4 fields, found ${fields.length}`,
    );
  }
  return pos as FEN;
}

/**
 * 局面表記のバリデータファクトリ。
 */
export function createPositionString(pos: string): PositionString {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new Error(
      "Invalid PositionString: Input must be a non-empty string.",
    );
  }
  return pos as PositionString;
}

/**
 * 指し手のバリデータファクトリ。
 */
export function createMove(move: string): Move {
  if (typeof move !== "string" || !/^[a-z0-9+*#=-]+$/i.test(move)) {
    throw new Error(
      `Invalid Move format: "${move}" contains illegal characters.`,
    );
  }
  return move as Move;
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
  fen?: FEN | PositionString;
  signal?: AbortSignal;
  [key: string]: unknown;
}

/**
 * 探索状況情報。
 */
export interface IBaseSearchInfo {
  depth?: number;
  seldepth?: number;
  nodes?: number;
  nps?: number;
  time?: number;
  pv?: Move[];
  multipv?: number;
  scoreType?: "cp" | "mate";
  scoreValue?: number;
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
  missingHeaders?: string[];
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

export interface EngineError {
  message: string;
  code: EngineErrorCode;
  remediation?: string;
  engineId?: string;
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
  priority?: number;
  supportedEngines?: string[];
  onCommand?(
    command: MiddlewareCommand,
    context: MiddlewareContext<T_OPTIONS>,
  ):
    | Promise<MiddlewareCommand | undefined | void>
    | MiddlewareCommand
    | undefined
    | void;
  onInfo?(
    info: T_INFO,
    context: MiddlewareContext<T_OPTIONS>,
  ): Promise<T_INFO | undefined | void> | T_INFO | undefined | void;
  onResult?(
    result: T_RESULT,
    context: MiddlewareContext<T_OPTIONS>,
  ): Promise<T_RESULT | undefined | void> | T_RESULT | undefined | void;
}

/**
 * 探索タスク。
 */
export interface ISearchTask<T_INFO, T_RESULT> {
  info: AsyncIterable<T_INFO>;
  result: Promise<T_RESULT>;
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
  readonly lastError: EngineError | null;
  loadingStrategy?: EngineLoadingStrategy;

  use(middleware: IMiddleware<T_OPTIONS, T_INFO, T_RESULT>): this;
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
 * エンジン・ソース設定。
 */
export type IEngineSourceConfig = {
  url: string;
  type: string;
  size?: number;
} & (
  | { sri: string; __unsafeNoSRI?: never }
  | { sri?: never; __unsafeNoSRI: true }
);

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
  getEngine<T extends keyof EngineRegistry>(id: T): EngineRegistry[T];
  registerAdapter(
    adapter: IEngineAdapter<IBaseSearchOptions, unknown, IBaseSearchResult>,
  ): void;
  dispose(): Promise<void>;
}

/**
 * 宣言併合用レジストリ。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EngineRegistry {}
