import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  IEngineConfig,
  IEngineSourceConfig,
  EngineErrorCode,
  IEngine,
} from "@multi-game-engines/core";
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

  constructor(private config: IEngineConfig) {
    super();
    this.id = config.id;
    this.name = config.name ?? "Mortal";
    this.version = config.version ?? "1.0.0";
  }

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      if (!loader) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "IEngineLoader is required for secure resource loading.",
          engineId: this.id,
        });
      }

      const sources = this.config.sources;
      if (!sources) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "Engine configuration is missing 'sources' field.",
          engineId: this.id,
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
        });
      }

      this.communicator = new WorkerCommunicator(mainUrl);

      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

      this.emitStatusChange("ready");
    } catch (error) {
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }
}

import { EngineFacade } from "@multi-game-engines/core";

/**
 * 2026 Zenith Tier: Mortal エンジンのファクトリ関数。
 * EngineFacade でラップし、純粋な IEngine インターフェースを返します。
 */
export function createMortalEngine(
  config: IEngineConfig,
): IEngine<IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult> {
  const adapter = new MortalAdapter(config);
  return new EngineFacade(adapter);
}

/**
 * @deprecated Use createMortalEngine instead.
 */
export function createMortalAdapter(config: IEngineConfig) {
  return new MortalAdapter(config);
}
