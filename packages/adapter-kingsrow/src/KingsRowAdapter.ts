import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  IEngineSourceConfig,
  IEngineAdapter,
  ResourceMap,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";
import { KingsRowParser } from "./KingsRowParser.js";

/**
 * 2026 Zenith Tier: KingsRow チェッカーアダプター。
 */
export class KingsRowAdapter extends BaseAdapter<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new KingsRowParser();

  constructor(config: IEngineConfig = {}) {
    // 2026 Best Practice: セントラルレジストリからデフォルトの URL/SRI を解決
    const registrySources = OfficialRegistry.resolve(
      "kingsrow",
      config.version,
    );
    const finalConfig = {
      ...config,
      sources: { ...registrySources, ...(config.sources || {}) },
    } as IEngineConfig;

    super(finalConfig);
    this.id = finalConfig.id ?? "kingsrow";
    this.name = finalConfig.name ?? "KingsRow Checkers";
    this.version = finalConfig.version ?? "unknown";
  }

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      this.validateSources();

      if (!loader) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "IEngineLoader is required for secure resource loading.",
          engineId: this.id,
          i18nKey: "engine.errors.loaderRequired",
        });
      }

      const sources = this.config.sources;
      if (!sources) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "Engine configuration is missing 'sources' field.",
          engineId: this.id,
          i18nKey: "engine.errors.missingSources",
        });
      }

      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value) {
          validSources[key] = value;
        }
      }

      const resources = await loader.loadResources(this.id, validSources);

      if (!resources["main"]) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "Missing main entry point after resolution",
          engineId: this.id,
          i18nKey: "engine.errors.missingMainEntryPoint",
        });
      }

      this.communicator = new WorkerCommunicator(resources["main"]);

      const resourceMap: ResourceMap = {};
      for (const [key, source] of Object.entries(sources)) {
        if (source?.mountPath && resources[key]) {
          resourceMap[source.mountPath] = resources[key]!;
        }
      }

      if (Object.keys(resourceMap).length > 0) {
        await this.injectResources(resourceMap);
      }

      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

      // KingsRow の初期化待ちロジックがあればここに追加
      this.emitStatusChange("ready");
    } catch (error) {
      if (this.messageUnsubscriber) {
        this.messageUnsubscriber();
        this.messageUnsubscriber = null;
      }
      if (this.communicator) {
        this.communicator.terminate();
        this.communicator = null;
      }
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }
}

export function createKingsRowAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  return new KingsRowAdapter(config);
}
