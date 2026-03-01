import { BaseAdapter, IEngineLoader, WorkerCommunicator, EngineError, EngineErrorCode, ResourceMap, IEngineConfig, IEngineSourceConfig, createI18nKey } from "@multi-game-engines/core";

import { IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult, } from "@multi-game-engines/domain-shogi";
import { USIParser } from "./USIParser.js";
import { tShogi as translate } from "@multi-game-engines/i18n-shogi";

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

  /**
   * エンジンのリソースをロードします。
   * @param loader - エンジンローダー。
   * @param signal - 中断用シグナル。
   */
  async load(loader?: IEngineLoader, signal?: AbortSignal): Promise<void> {
    this.emitStatusChange("loading");
    try {
      this.validateSources();

      if (!loader) {
        const i18nKey = createI18nKey("engine.errors.loaderRequired");
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }
      this.activeLoader = loader;

      const sources = this.config.sources;
      if (!sources) {
        const i18nKey = createI18nKey("engine.errors.missingSources");
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value && typeof value === "object" && "url" in value) {
          validSources[key] = value as IEngineSourceConfig;
        }
      }

      const resources = await this.loadWithProgress(
        loader,
        validSources,
        signal,
      );

      if (!resources["main"]) {
        const i18nKey = createI18nKey("engine.errors.missingMainEntryPoint");
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      this.communicator = new WorkerCommunicator(resources["main"]);
      const resourceMap: ResourceMap = {};
      for (const [key, sourceVal] of Object.entries(sources)) {
        const source = sourceVal as IEngineSourceConfig | undefined;
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
        { timeoutMs: 10000, signal },
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

  protected async onBookLoaded(url: string): Promise<void> {
    await this.setOption("BookFile", url);
  }
}
