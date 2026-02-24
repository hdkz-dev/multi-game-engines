import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  IEngineConfig,
  IEngineSourceConfig,
  EngineErrorCode,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";
import {
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult,
} from "@multi-game-engines/domain-mahjong";
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
    super(config);
    this.id = config.id ?? "mortal";
    this.name = config.name ?? "Mortal";
    this.version = config.version ?? "1.0.0";
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
