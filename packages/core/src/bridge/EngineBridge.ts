import {
  IEngine,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IEngineConfig,
  IEngineRegistry,
  IEngineLoader,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBookAsset,
  ILicenseInfo,
  IMiddleware,
} from "../types.js";
import { EngineFacade } from "./EngineFacade.js";
import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";
import { createI18nKey } from "../protocol/ProtocolValidator.js";

/**
 * アダプター生成のためのファクトリ型。
 */
export type AdapterFactory<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> = (config: IEngineConfig) => IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>;

/**
 * 2026 Zenith Tier: エンジン管理の中枢ブリッジ。
 */
export class EngineBridge {
  private factories = new Map<string, AdapterFactory<any, any, any>>();
  private engines = new Map<string, EngineFacade<any, any, any>>();
  private globalMiddlewares: IMiddleware<any, any, any>[] = [];
  private loaderInstance: IEngineLoader | null = null;

  constructor(
    private readonly registry: IEngineRegistry = {
      resolve: () => null,
      getSupportedEngines: () => [],
    },
    private readonly loaderProvider?: () => Promise<IEngineLoader>
  ) {}

  use(middleware: IMiddleware<any, any, any>): this {
    this.globalMiddlewares.push(middleware);
    for (const engine of this.engines.values()) {
      engine.use(middleware);
    }
    return this;
  }

  registerAdapterFactory<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult,
  >(type: string, factory: AdapterFactory<T_OPTIONS, T_INFO, T_RESULT>): void {
    this.factories.set(type, factory);
  }

  async getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(idOrConfig: string | IEngineConfig): Promise<IEngine<T_OPTIONS, T_INFO, T_RESULT>> {
    const config = this.resolveConfig(idOrConfig);
    const id = config.id;

    if (!id) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "Engine configuration must have an ID.",
        i18nKey: createI18nKey("engine.errors.validationError"),
      });
    }

    if (this.engines.has(id)) {
      return this.engines.get(id) as unknown as IEngine<T_OPTIONS, T_INFO, T_RESULT>;
    }

    const adapterType = config.adapter;
    if (!adapterType) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Engine "${id}" has no adapter type defined.`,
        engineId: id,
        i18nKey: createI18nKey("engine.errors.invalidAdapter"),
      });
    }

    const factory = this.factories.get(adapterType);
    if (!factory) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `No factory registered for adapter type "${adapterType}".`,
        engineId: id,
        i18nKey: createI18nKey("engine.errors.invalidAdapter"),
      });
    }

    const adapter = factory(config);
    if (!this.isIEngineAdapter(adapter)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Factory for "${adapterType}" returned an object that does not implement IEngineAdapter.`,
        engineId: id,
        i18nKey: createI18nKey("engine.errors.validationError"),
      });
    }

    const facade = new EngineFacade<T_OPTIONS, T_INFO, T_RESULT>(
      adapter as IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
      [...this.globalMiddlewares],
      this.loaderProvider
    );

    this.engines.set(id, facade);
    return facade;
  }

  async dispose(): Promise<void> {
    // 物理的に全エンジンを破棄
    const disposePromises = Array.from(this.engines.values()).map((e) => e.dispose());
    await Promise.all(disposePromises);
    this.engines.clear();

    // ローダー自体のクリーンアップ (テスト用 mockLoader への適合)
    if (this.loaderProvider) {
      const loader = await this.loaderProvider();
      if (loader && typeof loader.revokeAll === "function") {
        loader.revokeAll();
      }
    } else if (this.loaderInstance) {
      this.loaderInstance.revokeAll();
      this.loaderInstance = null;
    }
  }

  private resolveConfig(idOrConfig: string | IEngineConfig): IEngineConfig {
    if (typeof idOrConfig === "string") {
      const sources = this.registry.resolve(idOrConfig);
      if (!sources) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: `Engine "${idOrConfig}" not found in registry.`,
          engineId: idOrConfig,
          i18nKey: createI18nKey("engine.errors.invalidEngineId"),
        });
      }
      return { id: idOrConfig, adapter: idOrConfig, sources };
    }
    return idOrConfig;
  }

  private isIEngineAdapter(obj: unknown): boolean {
    if (!obj || typeof obj !== "object") return false;
    const a = obj as Record<string, any>;
    
    return (
      typeof a["id"] === "string" &&
      typeof a["name"] === "string" &&
      typeof a["status"] === "string" &&
      typeof a["load"] === "function" &&
      typeof a["searchRaw"] === "function" &&
      typeof a["stop"] === "function" &&
      typeof a["onStatusChange"] === "function"
    );
  }
}
