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
import { EngineFacade } from "./EngineFacade.js";
import { EngineError } from "../errors/EngineError.js";

/**
 * 全てのゲームエンジンのライフサイクルとミドルウェアを統括するブリッジ。
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
    ) => IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
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

  registerAdapterFactory<
    O extends IBaseSearchOptions,
    I extends IBaseSearchInfo,
    R extends IBaseSearchResult,
  >(
    type: string,
    factory: (config: IEngineConfig) => IEngineAdapter<O, I, R>,
  ): void {
    this.adapterFactories.set(
      type,
      factory as (
        config: IEngineConfig,
      ) => IEngineAdapter<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    );
  }

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
      await adapter.dispose();
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
  async getEngine(
    idOrConfig: string | IEngineConfig,
    strategy: EngineLoadingStrategy = "on-demand",
  ): Promise<IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>> {
    const id = typeof idOrConfig === "string" ? idOrConfig : idOrConfig.id;

    // 2026 Best Practice: インスタンスのキャッシュ (WeakRef ベース)
    const ref = this.engineInstances.get(id);
    const cached = ref?.deref();
    if (cached) {
      cached.loadingStrategy = strategy;
      return cached;
    }

    let adapter = this.adapters.get(id);

    // 2026 Zenith Tier: 設定オブジェクトからの動的インスタンス化
    if (!adapter && typeof idOrConfig !== "string") {
      const factory = this.adapterFactories.get(idOrConfig.adapter);
      if (factory) {
        const newAdapter = factory(idOrConfig) as IEngineAdapter<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >;
        adapter = newAdapter;
        // 生成されたアダプターをブリッジに登録（セキュリティ検証を含むため await する）
        await this.registerAdapter(newAdapter);
      }
    }

    if (!adapter) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Engine adapter not found or factory not registered: ${id}`,
        remediation:
          typeof idOrConfig !== "string"
            ? `Ensure registerAdapterFactory('${idOrConfig.adapter}', ... ) is called before getEngine.`
            : "Register the adapter instance first or provide a full IEngineConfig.",
      });
    }

    // 2026 Best Practice: セキュリティと環境能力の強制検証 (Zenith Tier Security)
    await this.enforceCapabilities(adapter);

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
    this.engineInstances.set(id, new WeakRef(engine));
    this.finalizationRegistry.register(engine, id);

    return engine;
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

  async dispose(): Promise<void> {
    this.disposed = true;
    const pendingLoader = this.loaderPromise;
    const promises = Array.from(this.adapters.values()).map((a) => a.dispose());
    await Promise.all(promises);

    // 2026 Best Practice: 実行中のロード処理の完了を待機（または例外吸収）
    if (pendingLoader) {
      await pendingLoader.catch(() => {
        /* disposed 時の意図的な例外を吸収 */
      });
    }

    this.adapters.clear();
    this.engineInstances.clear();
    this.middlewares = [];
    this.loader = null;
    this.loaderPromise = null;
  }
}
