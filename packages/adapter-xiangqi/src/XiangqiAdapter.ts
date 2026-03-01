import { BaseAdapter, IEngineLoader, WorkerCommunicator, EngineError, EngineErrorCode, IEngineConfig, IEngineSourceConfig, ResourceMap, createI18nKey } from "@multi-game-engines/core";

import { IXiangqiSearchOptions,
  IXiangqiSearchInfo,
  IXiangqiSearchResult, } from "@multi-game-engines/domain-xiangqi";
import { XiangqiParser } from "./XiangqiParser.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * 2026 Zenith Tier: Xiangqi (UCCI) Adapter.
 */
export class XiangqiAdapter extends BaseAdapter<
  IXiangqiSearchOptions,
  IXiangqiSearchInfo,
  IXiangqiSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new XiangqiParser();

  constructor(config: IEngineConfig) {
    super(config);
    this.id = config.id ?? "xiangqi";
    this.name = config.name ?? "Xiangqi Engine";
    this.version = config.version ?? "unknown";
  }

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

      if (Object.keys(resourceMap).length > 0) {
        await this.injectResources(resourceMap);
      }

      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

      const ucciOkPromise = this.communicator.expectMessage(
        (line) => line === "ucciok",
        { timeoutMs: 10000, signal },
      );

      this.communicator.postMessage("ucci");
      await ucciOkPromise;

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

  protected async onBookLoaded(url: string): Promise<void> {
    await this.setOption("BookFile", url);
  }
}
