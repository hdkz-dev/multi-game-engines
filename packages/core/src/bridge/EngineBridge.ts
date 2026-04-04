import {
  IEngine,
  IEngineAdapter,
  IBaseSearchOptions,
  IBaseSearchResult,
  IEngineConfig,
  IEngineRegistry,
  IEngineLoader,
  IMiddleware,
  EngineErrorCode,
} from "../types.js";
import { EngineFacade } from "./EngineFacade.js";
import { EngineError } from "../errors/EngineError.js";
import { createI18nKey } from "../protocol/ProtocolValidator.js";

/**
 * アダプター生成のためのファクトリ型。
 */
export type AdapterFactory<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> = (config: IEngineConfig) => IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>;

/**
 * 2026 Zenith Tier: エンジン管理の中枢ブリッジ。
 */
export class EngineBridge {
  private factories = new Map<
    string,
    AdapterFactory<IBaseSearchOptions, unknown, IBaseSearchResult>
  >();
  private engines = new Map<
    string,
    EngineFacade<IBaseSearchOptions, unknown, IBaseSearchResult>
  >();
  private globalMiddlewares: IMiddleware<
    IBaseSearchOptions,
    unknown,
    IBaseSearchResult
  >[] = [];
  private loaderInstance: IEngineLoader | null = null;
  private registries: IEngineRegistry[] = [];

  constructor(
    registry?: IEngineRegistry,
    private readonly loaderProvider?: () => Promise<IEngineLoader>,
  ) {
    if (registry) {
      this.registries.push(registry);
    }
  }

  /**
   * メタデータ解決のためのレジストリを追加します。
   */
  addRegistry(registry: IEngineRegistry): void {
    this.registries.unshift(registry);
  }

  /**
   * グローバルミドルウェアを登録します。登録されたミドルウェアは、今後取得される全てのエンジンに適用されます。
   * @param middleware - 登録するミドルウェア
   * @returns ブリッジのインスタンス（メソッドチェーン用）
   */
  use(
    middleware: IMiddleware<IBaseSearchOptions, unknown, IBaseSearchResult>,
  ): this {
    this.globalMiddlewares.push(middleware);
    for (const engine of this.engines.values()) {
      engine.use(middleware);
    }
    return this;
  }

  /**
   * 特定のエンジンタイプに対するアダプターファクトリを登録します。
   * @param type - アダプターのタイプ名（例: "stockfish", "yaneuraou"）
   * @param factory - アダプターを生成するファクトリ関数
   */
  registerAdapterFactory<
    T_OPTIONS extends IBaseSearchOptions,
    T_INFO,
    T_RESULT extends IBaseSearchResult,
  >(type: string, factory: AdapterFactory<T_OPTIONS, T_INFO, T_RESULT>): void {
    this.factories.set(
      type,
      factory as unknown as AdapterFactory<
        IBaseSearchOptions,
        unknown,
        IBaseSearchResult
      >,
    );
  }

  /**
   * 指定された設定またはIDに基づいてエンジンインスタンスを取得します。
   * すでに同じIDのエンジンが生成されている場合は、既存のインスタンスを返します。
   * @param idOrConfig - エンジンIDまたは詳細な設定オブジェクト
   * @returns 準備完了またはロード中のエンジンインスタンス（Facade）
   * @throws EngineError IDが不足している場合やアダプターが見つからない場合
   */
  async getEngine<
    T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
    T_INFO = unknown,
    T_RESULT extends IBaseSearchResult = IBaseSearchResult,
  >(
    idOrConfig: string | IEngineConfig,
  ): Promise<IEngine<T_OPTIONS, T_INFO, T_RESULT>> {
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
      return this.engines.get(id) as unknown as IEngine<
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >;
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
      [...this.globalMiddlewares] as unknown as IMiddleware<
        T_OPTIONS,
        T_INFO,
        T_RESULT
      >[],
      this.loaderProvider,
    );

    this.engines.set(
      id,
      facade as unknown as EngineFacade<
        IBaseSearchOptions,
        unknown,
        IBaseSearchResult
      >,
    );
    return facade;
  }

  /**
   * ブリッジを破棄します。
   */
  async dispose(): Promise<void> {
    const disposePromises = Array.from(this.engines.values()).map((engine) =>
      engine.dispose(),
    );
    await Promise.all(disposePromises);
    this.engines.clear();

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
      let sources = null;
      for (const registry of this.registries) {
        sources = registry.resolve(idOrConfig);
        if (sources) break;
      }
      if (!sources) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: `Engine "${idOrConfig}" not found in any registry.`,
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
    const a = obj as Record<string, unknown>;

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
