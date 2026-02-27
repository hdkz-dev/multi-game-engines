import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  IEngineAdapter,
  IEngineSourceConfig,
  I18nKey,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "@multi-game-engines/domain-go";
import { GTPParser } from "./GTPParser.js";

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
        const i18nKey = "engine.errors.loaderRequired" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      const sources = this.config.sources;
      if (!sources) {
        const i18nKey = "engine.errors.missingSources" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value) validSources[key] = value;
      }

      const resources = await loader.loadResources(this.id, validSources);
      const mainUrl = resources["main"];

      if (!mainUrl) {
        const i18nKey = "engine.errors.missingMainEntryPoint" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      this.communicator = new WorkerCommunicator(mainUrl);
      this.messageUnsubscriber = this.communicator.onMessage((data) =>
        this.handleIncomingMessage(data),
      );
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

export function createGTPAdapter(
  config: IEngineConfig,
): IEngineAdapter<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  return new GTPAdapter(config);
}
