import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  IEngineAdapter,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
  GTPParser,
} from "./GTPParser.js";

export class GTPAdapter extends BaseAdapter<
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new GTPParser();

  constructor(config: IEngineConfig) {
    super(config);
    this.id = config.id ?? "gtp";
    this.name = config.name ?? "GTP Engine";
    this.version = config.version ?? "unknown";
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
      this.messageUnsubscriber = this.communicator.onMessage((data) =>
        this.handleIncomingMessage(data),
      );
      this.emitStatusChange("ready");
    } catch (e) {
      this.emitStatusChange("error");
      throw EngineError.from(e, this.id);
    }
  }
}

export function createGTPAdapter(
  config: IEngineConfig,
): IEngineAdapter<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  return new GTPAdapter(config);
}
