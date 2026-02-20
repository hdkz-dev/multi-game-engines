import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  ResourceMap,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
  USIParser,
} from "./USIParser.js";

export class USIAdapter extends BaseAdapter<
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new USIParser();

  constructor(config: IEngineConfig) {
    super(config);
    this.id = config.id ?? "usi";
    this.name = config.name ?? "USI Engine";
    this.version = config.version ?? "unknown";
  }

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
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
          message: "Missing main entry after resolution",
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
      if (Object.keys(resourceMap).length > 0)
        await this.injectResources(resourceMap);

      this.messageUnsubscriber = this.communicator.onMessage((data) =>
        this.handleIncomingMessage(data),
      );

      const usiOk = this.communicator.expectMessage(
        (line) => line === "usiok",
        { timeoutMs: 10000 },
      );
      this.communicator.postMessage("usi");
      await usiOk;
      this.emitStatusChange("ready");
    } catch (e) {
      if (this.messageUnsubscriber) {
        this.messageUnsubscriber();
        this.messageUnsubscriber = null;
      }
      if (this.communicator) {
        this.communicator.terminate();
        this.communicator = null;
      }
      this.emitStatusChange("error");
      throw EngineError.from(e, this.id);
    }
  }
}
