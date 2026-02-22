import {
  IEngineBridge,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  EngineLoadingStrategy,
  IMiddleware,
  ICapabilities,
  IEngineLoader,
  IEngine,
  IEngineConfig,
  EngineRegistry,
  EngineErrorCode,
} from "../types.js";
import { EngineFacade, INTERNAL_ADAPTER } from "./EngineFacade.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * 全てのゲームエンジンのライフサイクルとミドルウェアを統括するブリッジ。
 *
 * シングルトンとしてではなく、アプリケーションのコンテキストごとにインスタンス化することを推奨します。
 * 主要な機能:
 * - アダプターの登録と管理
 * - エンジンの動的ロードと依存性注入
 * - グローバルイベント（ステータス、進捗、テレメトリ）の集約
 * - ミドルウェアの適用と実行
 */
export class EngineBridge implements IEngineBridge {
  private adapters = new Map<
    string,
    IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
  >();
  private adapterFactories = new Map<
    string,
    (
      config: IEngineConfig,
    ) =>
      | IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
      | IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
  >();
  private engineInstances = new Map<
    string,
    WeakRef<IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>
  >();
  private middlewares: IMiddleware<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >[] = [];
  private pendingEngines = new Map<
    string,
    Promise<IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>
  >();
  private loader: IEngineLoader | null = null;
  private loaderPromise: Promise<IEngineLoader> | null = null;
  private capabilities: ICapabilities | null = null;
  private capsPromise: Promise<ICapabilities> | null = null;
  private disposed = false;

  private statusListeners = new Set<
    (id: string, status: EngineStatus) => void
  >();
  private progressListeners = new Set<
    (id: string, progress: ILoadProgress) => void
  >();
  private telemetryListeners = new Set<
    (id: string, event: ITelemetryEvent) => void
  >();
  private adapterUnsubscribers = new Map<string, (() => void)[]>();

  // 2026 Best Practice: インスタンスの破棄を監視し、リークを追跡可能にする
  private finalizationRegistry = new FinalizationRegistry((id: string) => {
    if (this.disposed) return;
    const ref = this.engineInstances.get(id);
    if (ref && !ref.deref()) {
      this.engineInstances.delete(id);
    }
  });

  constructor() {
    // 2026 Best Practice: 初期化時に能力検知を開始
    void this.checkCapabilities();
  }

  /**
   * 汎用アダプター（UCI/USI/GTP等）を生成するためのファクトリ関数を登録します。
   * これにより、`getEngine` に設定オブジェクトを渡すだけで、事前にインスタンス化することなくエンジンを利用可能になります。
   *
   * @param type - アダプターの種類識別子（例: "uci", "usi"）。IEngineConfig.adapter と一致させる必要があります。
   * @param factory - 設定を受け取りアダプターまたはエンジンを返す関数。
   */
  registerAdapterFactory(
    type: string,
    factory: (
      config: IEngineConfig,
    ) =>
      | IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
      | IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
  ): void {
    this.adapterFactories.set(type, factory);
  }

  /**
   * アダプターインスタンスをブリッジに登録します。
   *
   * 処理内容:
   * 1. 環境能力（Capabilities）の検証。不足している場合はエラーをスロー。
   * 2. 同一 ID の既存アダプターの破棄（リソースリーク防止）。
   * 3. ステータス、進捗、テレメトリイベントのグローバルリスナーへの接続。
   *
   * @param adapter - 登録する IEngineAdapter 実装。
   */
  async registerAdapter<
    O extends IBaseSearchOptions,
    I extends IBaseSearchInfo,
    R extends IBaseSearchResult,
  >(adapter: IEngineAdapter<O, I, R>): Promise<void> {
    if (this.disposed) return;

    // 2026 Best Practice: アダプター登録時に能力要件を検証
    await this.enforceCapabilities(
      adapter as IEngineAdapter<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    );

    // 2026 Best Practice: ID をサニタイズして正規化 (Path Traversal 対策とルックアップの一貫性)
    // 2026 Best Practice: 厳密な ID バリデーション (Silent sanitization 排除)
    if (/[^a-zA-Z0-9-_]/.test(adapter.id)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid adapter ID: "${adapter.id}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
      });
    }
    const id = adapter.id;

    // 2026 Best Practice: 同一 ID の上書き時に古いリソースを確実に解放 (Leak Prevention)
    await this.unregisterAdapter(id);

    const unsubs: (() => void)[] = [];
    unsubs.push(
      adapter.onStatusChange((status) => {
        for (const cb of this.statusListeners) cb(id, status);
      }),
    );
    unsubs.push(
      adapter.onProgress((progress) => {
        for (const cb of this.progressListeners) cb(id, progress);
      }),
    );
    unsubs.push(
      adapter.onTelemetry((event) => {
        for (const cb of this.telemetryListeners) cb(id, event);
      }),
    );

    this.adapterUnsubscribers.set(id, unsubs);
    // 2026 Best Practice: アダプターの型を IBase 型へ正規化して保存。
    const abstractAdapter = adapter as IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    this.adapters.set(id, abstractAdapter);
  }

  async unregisterAdapter(id: string): Promise<void> {
    const adapter = this.adapters.get(id);
    if (adapter) {
      const unsubs = this.adapterUnsubscribers.get(id);
      if (unsubs) {
        for (const unsub of unsubs) unsub();
      }
      this.adapterUnsubscribers.delete(id);
      try {
        await adapter.dispose();
      } catch (err) {
        console.error(`[EngineBridge] Failed to dispose adapter ${id}:`, err);
      }
    }
    this.adapters.delete(id);
    this.engineInstances.delete(id);
  }

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
   * 指定された ID または設定に基づいてエンジンインスタンスを取得します。
   *
   * 特徴:
   * - **キャッシュ**: 既にインスタンスが存在する場合は、WeakRef キャッシュから即座に返却します。
   * - **並行性制御**: 同一 ID に対する同時リクエストはデデュプリケーション（Promise 共有）され、競合を防ぎます。
   * - **動的生成**: ID の代わりに IEngineConfig を渡すことで、未登録のアダプターをオンデマンドで生成・登録できます。
   *
   * @param idOrConfig - エンジン ID (string) または設定オブジェクト (IEngineConfig)。
   * @param strategy - ロード戦略 ('on-demand' | 'manual' | 'eager')。デフォルトは 'on-demand'。
   * @returns IEngine インターフェースを実装した Facade インスタンス。
   * @throws {EngineError} アダプターが見つからない、または初期化に失敗した場合。
   */
  async getEngine<
    O extends IBaseSearchOptions = IBaseSearchOptions,
    I extends IBaseSearchInfo = IBaseSearchInfo,
    R extends IBaseSearchResult = IBaseSearchResult,
  >(
    idOrConfig: string | IEngineConfig,
    strategy: EngineLoadingStrategy = "on-demand",
  ): Promise<IEngine<O, I, R>> {
    if (this.disposed) {
      throw new EngineError({
        code: EngineErrorCode.LIFECYCLE_ERROR,
        message: "EngineBridge has already been disposed.",
      });
    }

    const id = typeof idOrConfig === "string" ? idOrConfig : idOrConfig.id;

    if (!id) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "Engine ID is required to get or create an engine instance.",
      });
    }

    // 2026 Security: Path Traversal Prevention
    // Ensure the ID (used for cache keys and storage paths) is strictly alphanumeric.
    if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid engine ID: "${id}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
      });
    }

    // 2026 Best Practice: Check if already disposed

    // 2026 Best Practice: インフライトの初期化をデデュプリケーション (TOCTOU レースコンディション対策)
    const pending = this.pendingEngines.get(id);
    if (pending) return pending as Promise<IEngine<O, I, R>>;

    // 2026 Best Practice: インスタンスのキャッシュ (WeakRef ベース)
    const ref = this.engineInstances.get(id);
    const cached = ref?.deref();
    if (cached) {
      cached.loadingStrategy = strategy;
      return cached as IEngine<O, I, R>;
    }

    const enginePromise = (async () => {
      try {
        if (this.disposed) {
          throw new EngineError({
            code: EngineErrorCode.LIFECYCLE_ERROR,
            message: "EngineBridge was disposed during engine initialization.",
            engineId: id,
          });
        }

        let adapter = this.adapters.get(id);
        let newlyRegistered = false;

        // 2026 Zenith Tier: 設定オブジェクトからの動的インスタンス化
        if (!adapter && typeof idOrConfig !== "string") {
          if (!idOrConfig.adapter) {
            throw new EngineError({
              code: EngineErrorCode.VALIDATION_ERROR,
              message: `Adapter type is required to instantiate engine "${id}".`,
              engineId: id,
            });
          }
          const factory = this.adapterFactories.get(idOrConfig.adapter);
          if (factory) {
            const result = factory(idOrConfig);
            // 2026 Best Practice: ファクトリが Facade を返した場合は内部アダプターを抽出
            let newAdapter: IEngineAdapter<
              IBaseSearchOptions,
              IBaseSearchInfo,
              IBaseSearchResult
            >;

            if (result instanceof EngineFacade) {
              newAdapter = (
                result as EngineFacade<
                  IBaseSearchOptions,
                  IBaseSearchInfo,
                  IBaseSearchResult
                >
              )[INTERNAL_ADAPTER]();
            } else if (this.isIEngineAdapter(result)) {
              newAdapter = result as IEngineAdapter<
                IBaseSearchOptions,
                IBaseSearchInfo,
                IBaseSearchResult
              >;
            } else {
              throw new EngineError({
                code: EngineErrorCode.INTERNAL_ERROR,
                message: `Factory for "${idOrConfig.adapter}" returned an object that does not implement IEngineAdapter (missing required id, name, version, status, load, search, searchRaw, stop, setOption, dispose, or parser methods).`,
                engineId: id,
              });
            }

            // 生成されたアダプターをブリッジに登録（セキュリティ検証を含むため await する）
            await this.registerAdapter(newAdapter);
            newlyRegistered = true;
            if (this.disposed) {
              await newAdapter.dispose();
              throw new EngineError({
                code: EngineErrorCode.LIFECYCLE_ERROR,
                message:
                  "EngineBridge was disposed during adapter registration.",
                engineId: id,
              });
            }
            adapter = this.adapters.get(id);
          }
        }

        if (!adapter) {
          throw new EngineError({
            code: EngineErrorCode.INTERNAL_ERROR,
            message: `Engine adapter not found or factory not registered: ${id}`,
            engineId: id,
            remediation:
              typeof idOrConfig !== "string"
                ? `Ensure registerAdapterFactory('${idOrConfig.adapter}', ... ) is called before getEngine.`
                : "Register the adapter instance first or provide a full IEngineConfig.",
          });
        }

        // 2026 Best Practice: セキュリティと環境能力の強制検証 (Zenith Tier Security)
        // registerAdapter 内で既に実行されている場合はスキップ。
        // ただし実行前に再確認。
        if (this.disposed) {
          throw new EngineError({
            code: EngineErrorCode.LIFECYCLE_ERROR,
            message: "EngineBridge was disposed before capability enforcement.",
            engineId: id,
          });
        }

        if (!newlyRegistered) {
          await this.enforceCapabilities(adapter);
        }

        if (this.disposed) {
          throw new EngineError({
            code: EngineErrorCode.LIFECYCLE_ERROR,
            message: "EngineBridge was disposed before creating facade.",
            engineId: id,
          });
        }

        // 2026 Best Practice: ミドルウェアのフィルタリング (Architectural Isolation)
        const filteredMiddlewares = this.middlewares.filter(
          (mw) => !mw.supportedEngines || mw.supportedEngines.includes(id),
        );

        const facade = new EngineFacade(
          adapter,
          filteredMiddlewares,
          async () => this.getLoader(),
          false, // EngineBridge がアダプターのライフサイクルを管理するため
        );
        facade.loadingStrategy = strategy;

        const engine = facade as IEngine<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >;

        if (this.disposed) {
          // ファサードが生成されていても、破棄されていたらキャッシュしない
          return engine;
        }

        this.engineInstances.set(id, new WeakRef(engine));
        this.finalizationRegistry.register(engine, id);

        return engine;
      } finally {
        this.pendingEngines.delete(id);
      }
    })();

    this.pendingEngines.set(id, enginePromise);
    return enginePromise as Promise<IEngine<O, I, R>>;
  }

  /**
   * 現在稼働中の（メモリ上に存在する）エンジンインスタンス数を取得します。
   */
  getActiveEngineCount(): number {
    let count = 0;
    for (const [id, ref] of this.engineInstances.entries()) {
      if (ref.deref()) {
        count++;
      } else {
        // 2026 Best Practice: 参照が切れたエントリを明示的にパージ
        this.engineInstances.delete(id);
      }
    }
    return count;
  }

  use<
    O extends IBaseSearchOptions,
    I extends IBaseSearchInfo,
    R extends IBaseSearchResult,
  >(middleware: IMiddleware<O, I, R>): void {
    // 2026 Best Practice: ミドルウェアを IBase 型へ正規化して保存。
    const abstractMiddleware = middleware as IMiddleware<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    this.middlewares.push(abstractMiddleware);
    this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // 2026 Best Practice: ミドルウェア更新時にキャッシュをクリア
    this.engineInstances.clear();
    this.pendingEngines.clear();
  }

  onGlobalStatusChange(
    callback: (id: string, status: EngineStatus) => void,
  ): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onGlobalProgress(
    callback: (id: string, progress: ILoadProgress) => void,
  ): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  onGlobalTelemetry(
    callback: (id: string, event: ITelemetryEvent) => void,
  ): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  async checkCapabilities(): Promise<ICapabilities> {
    if (this.capabilities) return this.capabilities;
    if (this.capsPromise) return this.capsPromise;

    this.capsPromise = (async () => {
      try {
        const { CapabilityDetector } =
          await import("../capabilities/CapabilityDetector.js");
        const caps = await CapabilityDetector.detect();
        this.capabilities = caps;
        return caps;
      } finally {
        this.capsPromise = null;
      }
    })();

    return this.capsPromise;
  }

  private async enforceCapabilities(
    adapter: IEngineAdapter<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >,
  ): Promise<void> {
    if (!adapter.requiredCapabilities) return;

    const caps = await this.checkCapabilities();
    const missing: string[] = [];

    for (const [key, required] of Object.entries(
      adapter.requiredCapabilities,
    )) {
      if (required && !caps[key as keyof ICapabilities]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Environment does not support required capabilities: ${missing.join(", ")}`,
        engineId: adapter.id,
        remediation:
          "Ensure the site is served over HTTPS and Cross-Origin Isolation headers (COOP/COEP) are enabled if Threads/SharedArrayBuffer are required.",
      });
    }
  }

  /**
   * 2026 Best Practice: アトミック初期化と Dispose ガード
   */
  async getLoader(): Promise<IEngineLoader> {
    if (this.loader) return this.loader;
    if (this.loaderPromise) return this.loaderPromise;

    this.loaderPromise = (async () => {
      try {
        const { EngineLoader } = await import("./EngineLoader.js");
        const { createFileStorage } = await import("../storage/index.js");
        const caps = await this.checkCapabilities();

        if (this.disposed) {
          throw new Error("EngineBridge already disposed");
        }

        const loader = new EngineLoader(createFileStorage(caps));
        this.loader = loader;
        return loader;
      } finally {
        this.loaderPromise = null;
      }
    })();

    return this.loaderPromise;
  }

  /**
   * ブリッジを破棄し、管理下の全てのリソースを解放します。
   *
   * 処理内容:
   * 1. 登録された全アダプターの `dispose()` を呼び出し、Worker を停止。
   * 2. イベントリスナーの解除。
   * 3. 内部キャッシュ（インスタンス、ミドルウェア）のクリア。
   * 4. 実行中のローダー処理の待機とクリーンアップ。
   *
   * このメソッド呼び出し後、ブリッジは使用不能になります。
   */
  async dispose(): Promise<void> {
    this.disposed = true;
    const pendingLoader = this.loaderPromise;
    const pendingEngines = Array.from(this.pendingEngines.values());

    const promises = Array.from(this.adapters.keys()).map(async (id) => {
      const adapter = this.adapters.get(id);
      if (adapter) {
        try {
          await adapter.dispose();
        } catch (err) {
          console.error(`[EngineBridge] Failed to dispose adapter ${id}:`, err);
        }
      }
      // 2026 Best Practice: 破棄失敗時も Blob URL リソースは強制的に解放
      if (this.loader) {
        this.loader.revokeByEngineId(id);
      }
    });
    await Promise.all(promises);

    // 2026 Best Practice: 進行中のエンジン生成とロード処理の完了を待機（または例外吸収）
    await Promise.all([
      ...pendingEngines.map((p) => p.catch(() => {})),
      pendingLoader ? pendingLoader.catch(() => {}) : Promise.resolve(),
    ]);

    // アダプターのイベントリスナーを確実に解除
    for (const unsubs of this.adapterUnsubscribers.values()) {
      for (const unsub of unsubs) unsub();
    }
    this.adapterUnsubscribers.clear();

    this.adapters.clear();
    this.engineInstances.clear();
    this.pendingEngines.clear();
    this.adapterFactories.clear();
    this.statusListeners.clear();
    this.progressListeners.clear();
    this.telemetryListeners.clear();
    this.middlewares = [];
    this.loader = null;
    this.loaderPromise = null;
    this.capabilities = null;
    this.capsPromise = null;
  }

  private isIEngineAdapter(obj: unknown): obj is IEngineAdapter {
    if (typeof obj !== "object" || obj === null) return false;
    const r = obj as Record<string, unknown>;
    const p = r["parser"];
    if (typeof p !== "object" || p === null) return false;

    const parser = p as Record<string, unknown>;
    return (
      typeof r["id"] === "string" &&
      typeof r["name"] === "string" &&
      typeof r["version"] === "string" &&
      typeof r["status"] === "string" &&
      typeof r["load"] === "function" &&
      typeof r["search"] === "function" &&
      typeof r["searchRaw"] === "function" &&
      typeof r["stop"] === "function" &&
      typeof r["setOption"] === "function" &&
      typeof r["dispose"] === "function" &&
      typeof r["onSearchResult"] === "function" &&
      typeof r["onStatusChange"] === "function" &&
      typeof r["onProgress"] === "function" &&
      typeof r["onTelemetry"] === "function" &&
      typeof r["emitTelemetry"] === "function" &&
      typeof parser["createSearchCommand"] === "function" &&
      typeof parser["parseInfo"] === "function" &&
      typeof parser["parseResult"] === "function"
    );
  }
}
