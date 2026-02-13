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
  private middlewares: IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>[] = [];
  private loader: IEngineLoader | null = null;

  registerAdapter<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(
    adapter: IEngineAdapter<O, I, R>
  ): void {
    this.adapters.set(adapter.id, adapter as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
  }

  unregisterAdapter(id: string): void {
    this.adapters.delete(id);
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
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`Engine adapter not found: ${id}`);
    }

    const facade = new EngineFacade(
      adapter, 
      this.middlewares, 
      async () => this.getLoader()
    );
    facade.loadingStrategy = strategy;
    return facade as unknown as IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;
  }

  use<O extends IBaseSearchOptions, I extends IBaseSearchInfo, R extends IBaseSearchResult>(
    middleware: IMiddleware<O, I, R>
  ): void {
    this.middlewares.push(middleware as unknown as IMiddleware<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);
    this.middlewares.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  async checkCapabilities(): Promise<ICapabilities> {
    const { CapabilityDetector } = await import("../capabilities/CapabilityDetector.js");
    return CapabilityDetector.detect();
  }

  async getLoader(): Promise<IEngineLoader> {
    if (!this.loader) {
      const { EngineLoader } = await import("./EngineLoader.js");
      const { createFileStorage } = await import("../storage/index.js");
      const caps = await this.checkCapabilities();
      this.loader = new EngineLoader(createFileStorage(caps));
    }
    return this.loader;
  }

  async dispose(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map(a => a.dispose());
    await Promise.all(promises);
    this.adapters.clear();
    this.middlewares = [];
  }
}
