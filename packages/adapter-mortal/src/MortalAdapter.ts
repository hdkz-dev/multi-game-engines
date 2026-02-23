import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  IEngineConfig,
  IEngineSourceConfig,
  EngineErrorCode,
} from "@multi-game-engines/core";
import { OfficialRegistry } from "@multi-game-engines/registry";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "./MahjongJSONParser.js";
import { MahjongJSONParser } from "./MahjongJSONParser.js";

/**
 * 2026 Zenith Tier: Mortal 麻雀エンジンアダプター。
 */
export class MortalAdapter extends BaseAdapter<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new MahjongJSONParser();

  constructor(config: IEngineConfig = {}) {
    // 2026 Best Practice: セントラルレジストリからデフォルトの URL/SRI を解決
    const registrySources = OfficialRegistry.resolve("mortal", config.version);
    const finalConfig = {
      ...config,
      sources: { ...registrySources, ...(config.sources || {}) },
    } as IEngineConfig;

    super(finalConfig);
    this.id = finalConfig.id ?? "mortal";
    this.name = finalConfig.name ?? "Mortal";
    this.version = finalConfig.version ?? "1.0.0";
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
        if (value) validSources[key] = value;
      }

      const resources = await loader.loadResources(this.id, validSources);
      const mainUrl = resources["main"];

      if (!mainUrl) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "Missing main entry point after resolution",
          engineId: this.id,
          i18nKey: "engine.errors.missingMainEntryPoint",
        });
      }

      this.communicator = new WorkerCommunicator(mainUrl);

      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

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

/**
 * @deprecated Use createMortalEngine instead.
 */
export function createMortalAdapter(config: IEngineConfig) {
  return new MortalAdapter(config);
}
