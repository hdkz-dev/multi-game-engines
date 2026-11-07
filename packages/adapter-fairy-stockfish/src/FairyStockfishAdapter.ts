import {
  IEngineConfig,
  IEngine,
  deepMerge,
  EmscriptenWorkerCommunicator,
  type ICommunicator,
} from "@multi-game-engines/core";
import { UCIAdapter } from "@multi-game-engines/adapter-uci";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";

export class FairyStockfishAdapter extends UCIAdapter {
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
      id: "fairy-stockfish",
      adapter: "uci",
      name: "Fairy-Stockfish",
      version: "1.1.11",
    };
    super(deepMerge(defaultConfig, config));
  }
}

declare module "@multi-game-engines/core" {
  interface EngineRegistry {
    "fairy-stockfish": IEngine<
      IChessSearchOptions,
      IChessSearchInfo,
      IChessSearchResult
    >;
  }
}
