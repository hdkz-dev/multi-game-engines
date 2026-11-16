import {
  IEngineConfig,
  IEngine,
  deepMerge,
  EmscriptenWorkerCommunicator,
  type ICommunicator,
} from "@multi-game-engines/core";
import { USIAdapter } from "@multi-game-engines/adapter-usi";
import {
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

export class FairyStockfishShogiAdapter extends USIAdapter {
  protected override createBrowserCommunicator(
    resources: Readonly<Record<string, string>>,
  ): ICommunicator {
    if (this.config.sources?.main?.workerFactory === "Stockfish") {
      return new EmscriptenWorkerCommunicator(resources);
    }
    return super.createBrowserCommunicator(resources);
  }

  protected override async injectResources(
    resourceMap: Record<string, string>,
  ): Promise<void> {
    if (this.config.sources?.main?.workerFactory !== "Stockfish") {
      await super.injectResources(resourceMap);
    }
  }

  constructor(config?: Partial<IEngineConfig>) {
    const defaultConfig: IEngineConfig = {
      id: "fairy-stockfish-shogi",
      adapter: "usi",
      name: "Fairy-Stockfish Shogi",
      version: "1.1.11",
    };
    super(deepMerge(defaultConfig, config));
  }
}

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    "fairy-stockfish-shogi": IEngine<
      IShogiSearchOptions,
      IShogiSearchInfo,
      IShogiSearchResult
    >;
  }
}
