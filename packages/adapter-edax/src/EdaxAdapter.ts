import { BaseAdapter, IEngineLoader, WorkerCommunicator, EngineError, IEngineConfig, IEngineSourceConfig, EngineErrorCode, createI18nKey } from "@multi-game-engines/core";

import { IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult, } from "@multi-game-engines/domain-reversi";
import { EdaxParser } from "./EdaxParser.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * 2026 Zenith Tier: Edax リバーシエンジンアダプター。
 */
export class EdaxAdapter extends BaseAdapter<
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new EdaxParser();

  constructor(config: IEngineConfig = {}) {
    super(config);
    this.id = config.id || "edax";
    this.name = config.name || "Edax";
    this.version = config.version || "4.4";
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
      const mainUrl = resources["main"];

      if (!mainUrl) {
        const i18nKey = createI18nKey("engine.errors.missingMainEntryPoint");
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
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

  protected async onBookLoaded(url: string): Promise<void> {
    await this.setOption("BookFile", url);
  }
}
