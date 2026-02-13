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
  EngineRegistry
} from "../types.js";
import { EngineFacade } from "./EngineFacade.js";

/**
 * 全てのゲームエンジンのライフサイクルとミドルウェアを統括するブリッジ。
 */
export class EngineBridge implements IEngineBridge {
  private adapters = new Map<string, IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>();
  private engineInstances = new Map<string, WeakRef<IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>>>();
  private middlewares: IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>[] = [];
  private loader: IEngineLoader | null = null;
  private loaderPromise: Promise<IEngineLoader> | null = null;
  private disposed = false;

  async registerAdapter<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(
    adapter: IEngineAdapter<O, I, R>
  ): Promise<void> {
    if (this.disposed) return;
    // 2026 Best Practice: 同一 ID の上書き時に古いリソースを確実に解放 (Leak Prevention)
    const old = this.adapters.get(adapter.id);
    if (old) {
      await old.dispose();
    }
    this.adapters.set(adapter.id, adapter as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
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
    strategy?: EngineLoadingStrategy
  ): IEngine<
    EngineRegistry[K]["options"],
    EngineRegistry[K]["info"],
    EngineRegistry[K]["result"]
  >;
  getEngine<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(
    id: string,
    strategy?: EngineLoadingStrategy
  ): IEngine<O, I, R>;
  getEngine(id: string, strategy: EngineLoadingStrategy = "on-demand"): IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult> {
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

    // 2026 Best Practice: ミドルウェアのフィルタリング (Architectural Isolation)
    const filteredMiddlewares = this.middlewares.filter(mw => 
      !mw.supportedEngines || mw.supportedEngines.includes(id)
    );

    const facade = new EngineFacade(
      adapter, 
      filteredMiddlewares, 
      async () => this.getLoader(),
      false // EngineBridge がアダプターのライフサイクルを管理するため
    );
    facade.loadingStrategy = strategy;

    const engine = facade as IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;
    this.engineInstances.set(id, new WeakRef(engine));

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
        this.engineInstances.delete(id);
      }
    }
    return count;
  }

  use<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(
    middleware: IMiddleware<O, I, R>
  ): void {
    this.middlewares.push(middleware as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // 2026 Best Practice: ミドルウェア更新時にキャッシュをクリア
    this.engineInstances.clear();
  }

  async checkCapabilities(): Promise<ICapabilities> {
    const { CapabilityDetector } = await import("../capabilities/CapabilityDetector.js");
    return CapabilityDetector.detect();
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
    const promises = Array.from(this.adapters.values()).map(a => a.dispose());
    await Promise.all(promises);
    this.adapters.clear();
    this.engineInstances.clear();
    this.middlewares = [];
    this.loader = null;
    this.loaderPromise = null;
  }
}
