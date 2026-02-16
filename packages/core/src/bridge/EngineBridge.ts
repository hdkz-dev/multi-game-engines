import {
  IEngineBridge,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineLoadingStrategy,
  IMiddleware,
  ICapabilities,
  IEngineLoader,
  IEngine,
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

  async registerAdapter<
    O extends IBaseSearchOptions,
    I extends IBaseSearchInfo,
    R extends IBaseSearchResult,
  >(adapter: IEngineAdapter<O, I, R>): Promise<void> {
    if (this.disposed) return;

    // 2026 Best Practice: アダプター登録時に能力要件を検証
    await this.enforceCapabilities(adapter);

    // 2026 Best Practice: 同一 ID の上書き時に古いリソースを確実に解放 (Leak Prevention)
    const old = this.adapters.get(adapter.id);
    if (old) {
      await old.dispose();
    }
    this.adapters.set(
      adapter.id,
      adapter as unknown as IEngineAdapter<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    );
    this.engineInstances.delete(adapter.id);
  }

  async unregisterAdapter(id: string): Promise<void> {
    const adapter = this.adapters.get(id);
    if (adapter) {
      await adapter.dispose();
    }
    this.adapters.delete(id);
    this.engineInstances.delete(id);
  }

  getEngine<K extends keyof EngineRegistry>(
    id: K,
    strategy?: EngineLoadingStrategy,
  ): IEngine<
    EngineRegistry[K]["options"],
    EngineRegistry[K]["info"],
    EngineRegistry[K]["result"]
  >;
  getEngine<
    O extends IBaseSearchOptions,
    I extends IBaseSearchInfo,
    R extends IBaseSearchResult,
  >(id: string, strategy?: EngineLoadingStrategy): IEngine<O, I, R>;
  getEngine(
    id: string,
    strategy: EngineLoadingStrategy = "on-demand",
  ): IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
    // 2026 Best Practice: インスタンスのキャッシュ (WeakRef ベース)
    const ref = this.engineInstances.get(id);
    const cached = ref?.deref();
    if (cached) {
      cached.loadingStrategy = strategy;
      return cached;
    }

    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`Engine adapter not found: ${id}`);
    }

    // 2026 Best Practice: セキュリティと環境能力の強制検証 (Zenith Tier Security)
    this.enforceCapabilities(adapter);

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
    this.middlewares.push(
      middleware as unknown as IMiddleware<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    );
    this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // 2026 Best Practice: ミドルウェア更新時にキャッシュをクリア
    this.engineInstances.clear();
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
