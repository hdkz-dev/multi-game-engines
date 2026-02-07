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
  /** 対象のエンジンID */
  engineId: string;
  /** 使用されているアダプター名 */
  adapterName: string;
  /** 発生時のタイムスタンプ */
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
  /** 局面のFEN文字列 */
  fen: FEN;
  /** 探索する深さ (Ply) */
  depth?: number;
  /** 制限時間 (ms) */
  time?: number;
  /** 探索結節点数 (Nodes) */
  nodes?: number;
  /** 探索のキャンセル用シグナル */
  signal?: AbortSignal;
}

/**
 * 思考状況の基底
 */
export interface IBaseSearchInfo {
  /** 現在の探索深さ */
  depth: number;
  /** 評価値 (cp) */
  score: number;
  /** 読み筋 (Principal Variation) */
  pv?: Move[];
  /** 探索速度 (Nodes Per Second) */
  nps?: number;
  /** 経過時間 (ms) */
  time?: number;
  /** エンジンからの生の思考出力 */
  raw?: string;
}

/**
 * 探索結果の基底
 */
export interface IBaseSearchResult {
  /** 最善手 */
  bestMove: Move;
  /** 受読み手 (Ponder) */
  ponder?: Move;
  /** エンジンからの生の探索完了メッセージ */
  raw?: string;
}

/**
 * 実行中の探索タスク管理用インターフェース
 */
export interface ISearchTask<
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  /** 思考状況の非同期イテレータ */
  readonly info: AsyncIterable<T_INFO>;
  /** 最終結果の Promise */
  readonly result: Promise<T_RESULT>;
  /** 探索を強制停止するメソッド */
  stop(): Promise<void>;
}

/**
 * ミドルウェアの優先度。
 * 登録された順番よりも優先度の高いものが先に実行されます。
 */
export enum MiddlewarePriority {
  /** ログ出力など */
  LOW = 0,
  /** 一般的な処理 */
  NORMAL = 100,
  /** 最優先の変換処理 */
  HIGH = 200,
  /** 変更を加えずに監視のみを行う */
  MONITOR = 1000,
}

/**
 * ミドルウェアの定義インターフェース。
 * プロトコル・コマンド、思考状況、最終結果をインターセプトできます。
 */
export interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  /** 実行優先度 */
  priority?: MiddlewarePriority;

  /** コマンドが送信される際に実行されます */
  onCommand?(
    command: string | Uint8Array,
    context: IMiddlewareContext,
  ): string | Uint8Array | Promise<string | Uint8Array>;

  /** 思考状況が返される際に実行されます */
  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;

  /** 最終結果が返される際に実行されます */
  onResult?(
    result: T_RESULT,
    context: IMiddlewareContext,
  ): T_RESULT | Promise<T_RESULT>;
}

/**
 * エンジンバイナリの供給元リソースを定義します。
 */
export interface IEngineSourceConfig {
  /** リソースのURL (絶対パスまたはCDN相対パス) */
  readonly url: string;
  /** サブリソース整合性 (SRI) ハッシュ (例: "sha384-...") */
  readonly sri: string;
  /** ファイルサイズ (バイト) */
  readonly size: number;
  /**
   * 実行タイプ。
   * WASMに加え、WebGPU (NNUE加速) や Native ブリッジをサポート。
   */
  readonly type?:
    | "wasm"
    | "worker-js"
    | "native"
    | "webgpu-compute"
    | "eval-data";
}

/**
 * エンジンライブラリ全体のルートマニフェスト形式 (manifest.json)
 */
export interface IEngineManifestIndex {
  /** APIバージョン (例: "v1") */
  readonly version: string;
  /** 最終更新日時 */
  readonly updatedAt: string;
  /** エンジンIDごとの概要情報 */
  readonly engines: Record<
    string,
    {
      /** 説明文 */
      readonly description: string;
      /** 最新バージョンの識別子 */
      readonly latestVersion: string;
      /** 利用可能な全バージョン一覧 */
      readonly versions: string[];
    }
  >;
}

/**
 * 特定のエンジン・バージョンの詳細マニフェスト形式 (/v1/{engine}/{version}/manifest.json)
 */
export interface IEngineVersionManifest {
  /** エンジンID */
  readonly engineId: string;
  /** バージョン識別子 */
  readonly version: string;
  /** ファイル名ごとの供給元設定 */
  readonly files: Record<string, IEngineSourceConfig>;
}

/**
 * 標準化されたエラーコードの定義。
 */
export enum EngineErrorCode {
  /** ネットワーク障害によるダウンロード失敗 */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** サブリソース整合性 (SRI) の検証失敗 (改竄や破損の可能性) */
  SRI_MISMATCH = "SRI_MISMATCH",
  /** WebAssembly または WebWorker の初期化失敗 */
  WASM_INIT_FAILED = "WASM_INIT_FAILED",
  /** スレッド数やメモリ制限などのリソース不足 */
  RESOURCES_LIMIT = "RESOURCES_LIMIT",
  /** ブラウザのセキュリティ制約によるエラー */
  SECURITY_VIOLATION = "SECURITY_VIOLATION",
  /** 探索中のタイムアウト */
  SEARCH_TIMEOUT = "SEARCH_TIMEOUT",
  /** エンジン内部またはプロトコル外のエラー */
  INTERNAL_ERROR = "INTERNAL_ERROR",
  /** その他の不明なエラー */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * エンジン操作時に発生する例外。
 */
export interface IEngineError extends Error {
  /** 標準化されたエラーコード */
  readonly code: EngineErrorCode;
  /** 関連するエンジンID */
  readonly engineId?: string;
  /** 元の例外オブジェクト */
  readonly originalError?: unknown;
}

/**
 * ライセンス情報を詳細に定義します。
 */
export interface ILicenseInfo {
  /**
   * ライセンス名。
   * 可能な限り SPDX License Identifier (例: "MIT", "GPL-3.0-only") を使用してください。
   */
  readonly name: string;
  /** ライセンス条文または公式サイトへのリンク */
  readonly url: string;
  /** GPL等でソースコード公開が必要な場合の、リポジトリへのリンク */
  readonly sourceCodeUrl?: string;
}

/**
 * 観測可能性 (Observability) のためのテレメトリイベント。
 */
export interface ITelemetryEvent {
  /** イベント名 (例: "load_time", "nps_peak") */
  readonly event: string;
  /** 発生時のタイムスタンプ */
  readonly timestamp: number;
  /** 関連する属性データ */
  readonly attributes: Record<string, string | number | boolean>;
}

/**
 * ロード・初期化処理の進捗状況。
 */
export interface ILoadProgress {
  /** 現在のフェーズ */
  readonly phase:
    | "not-started"
    | "downloading"
    | "initializing"
    | "ready"
    | "error";
  /** 進捗率 (0-100) */
  readonly percentage: number;
  /** 多言語対応のためのメッセージキーと表示用テキスト */
  readonly i18n: {
    readonly key: string;
    readonly params?: Record<string, string | number>;
    readonly defaultMessage: string;
  };
  /** phase が "error" の場合にセットされるエラー情報 */
  readonly error?: Error;
}

/**
 * エンジンのライフサイクルステータス。
 */
export type EngineStatus =
  | "idle" // 初期状態・待機中
  | "loading" // リソース取得・初期化中
  | "ready" // 利用可能
  | "busy" // 探索実行中
  | "error" // エラー発生中
  | "terminated"; // 終了済み

/**
 * エンジンアダプターの静的メタデータ。
 * 起動環境、ライセンス、供給元など、不変の情報を定義します。
 */
export interface IEngineAdapterMetadata {
  /** アダプターを識別する一意のID (例: "stockfish") */
  readonly id: string;
  /** ユーザーに表示する名称 (例: "Stockfish via WASM") */
  readonly name: string;
  /** アダプターのバージョン */
  readonly version: string;

  /** エンジン自体のライセンス情報 */
  readonly engineLicense: ILicenseInfo;
  /** アダプターパッケージ自体のライセンス情報 */
  readonly adapterLicense: ILicenseInfo;

  /** ロードに使用するリソースの設定。キーはファイル名や役目を表す文字列。 */
  readonly sources?: Record<string, IEngineSourceConfig>;
}

/**
 * エンジンアダプターの動的なランタイム状態。
 * 複数インスタンスを作成した際、それぞれが独立して持つ状態を定義します。
 */
export interface IEngineAdapterState {
  /** 現在の動作ステータス */
  readonly status: EngineStatus;
  /** ロードや処理の進捗状況 */
  readonly progress: ILoadProgress;
}

/**
 * エンジンアダプターの公開情報（読取専用）。
 * Facade を利用するアプリケーションはこのインターフェースを通じて情報を取得します。
 */
export interface IEngineAdapterInfo
  extends IEngineAdapterMetadata, IEngineAdapterState {}

/**
 * エンジンアダプターの具象インターフェース。
 * アダプター開発者はこれを実装します。
 */
export interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> extends IEngineAdapterInfo {
  /** 必要に応じてリソースを事前取得します (キャッシュのみ) */
  prefetch?(): Promise<void>;
  /** エンジンをロードし、準備完了 (ready) にします */
  load(): Promise<void>;
  /** 探索を実行し、タスクを返します */
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  /** リソースを解放し、終了 (terminated) にします */
  dispose(): Promise<void>;

  /** ステータス変更の通知を購読します */
  onStatusChange(callback: (status: EngineStatus) => void): void;
  /** 進捗状況の通知を購読します */
  onProgress(callback: (progress: ILoadProgress) => void): void;
  /** テレメトリイベントを購読します */
  onTelemetry?(callback: (event: ITelemetryEvent) => void): void;
}

/**
 * 利用者向けの Facade インターフェース。
 * 特定のアダプター実装から独立して、一貫した操作を提供します。
 */
export interface IEngine<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> {
  /** アダプターの状態情報 (読取専用、メソッドは隠蔽) */
  readonly adapter: IEngineAdapterInfo;

  /** 探索を開始します */
  search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  /** エンジンを初期化します。search() の前に呼ぶことが推奨されます。 */
  load(): Promise<void>;
  /** 現在の探索を停止します。アダプターは再利用可能な状態を維持します。 */
  stop(): Promise<void>;
  /** エンジンを完全に終了し、インスタンスを無効化します。 */
  quit(): Promise<void>;

  /** 法的な帰属表示のためのクレジット情報を取得します */
  getCredits(): {
    engine: ILicenseInfo;
    adapter: ILicenseInfo;
  };
}

/**
 * エンジンブリッジ。
 * 複数のエンジンの登録、管理、ミドルウェアの注入、能力診断を一括管理します。
 */
export interface IEngineBridge {
  /** アダプターを登録し、利用可能にします */
  registerAdapter<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(
    adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
  ): void;

  /** 特定のエンジンを操作するための Facade を取得します */
  getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(
    id: string,
  ): IEngine<T_OPTIONS, T_INFO, T_RESULT>;

  /** 全体または特定の通信をインターセプトするミドルウェアを追加します */
  use<T_INFO = unknown, T_RESULT = unknown>(
    middleware: IMiddleware<T_INFO, T_RESULT>,
  ): void;

  /** 実行環境が 2026年最新基準の Web 標準を満たしているか診断します */
  checkCapabilities(): Promise<ICapabilities>;
  /** セキュリティ状態の詳細を取得します */
  getSecurityStatus(): ISecurityStatus;
}

/**
 * 実行環境の能力診断項目 (2026年最新基準)
 */
export interface ICapabilities {
  /** Origin Private File System (大容量ファイルの永続化) */
  readonly opfs: boolean;
  /** WebAssembly Threads サポート */
  readonly wasmThreads: boolean;
  /** WebAssembly SIMD サポート */
  readonly wasmSimd: boolean;
  /** Web Neural Network API (推論加速) */
  readonly webNN: boolean;
  /** WebGPU (Compute加速) */
  readonly webGPU: boolean;
  /** Low-latency 通信プロトコル */
  readonly webTransport: boolean;
  /** 詳細な診断メッセージ（デバッグ・警告用） */
  readonly details?: Record<keyof Omit<ICapabilities, "details">, string>;
}

/**
 * エンジン固有のオプション拡張。
 * アダプターによって定義される、型安全な追加設定。
 */
export interface IEngineSpecificOptions extends Record<
  string,
  string | number | boolean | Record<string, unknown> | undefined
> {
  /** スレッド数 (Parallelism) */
  threads?: number;
  /** Hashメモリサイズ (MB) */
  hashSize?: number;
}
