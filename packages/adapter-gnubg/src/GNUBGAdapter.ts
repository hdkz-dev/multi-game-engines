import {
  BaseAdapter,
  IEngineAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  IEngineSourceConfig,
  ResourceMap,
  I18nKey,
} from "@multi-game-engines/core";
import { tCommon as translate } from "@multi-game-engines/i18n-common";
import {
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult,
} from "@multi-game-engines/domain-backgammon";
import { GNUBGParser } from "./GNUBGParser.js";

/**
 * 2026 Zenith Tier: GNU Backgammon アダプター。
 */
export class GNUBGAdapter extends BaseAdapter<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new GNUBGParser();

  constructor(config: IEngineConfig = {}) {
    super(config);
    this.id = config.id ?? "gnubg";
    this.name = config.name ?? "GNU Backgammon";
    this.version = config.version ?? "1.07";
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
        if (value) {
          validSources[key] = value;
        }
      }

      const resources = await loader.loadResources(this.id, validSources);

      if (!resources["main"]) {
        const i18nKey = "engine.errors.missingMainEntryPoint" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
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

      // gnubg の初期化待ちロジックがあればここに追加
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

export function createGNUBGAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  IBackgammonSearchOptions,
  IBackgammonSearchInfo,
  IBackgammonSearchResult
> {
  return new GNUBGAdapter(config);
}
