import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  ResourceMap,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "./UCIParser.js";
import { UCIParser } from "./UCIParser.js";

export class StockfishAdapter extends BaseAdapter<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> {
  readonly id = "stockfish";
  readonly name = "Stockfish";
  readonly version = "16.1";
  readonly parser = new UCIParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      const configs: Record<string, IEngineSourceConfig> = {
        main: {
          url: "https://example.com/stockfish.js",
          sri: "sha256-dummy-main",
          type: "worker-js" as const,
        },
        wasm: {
          url: "https://example.com/stockfish.wasm",
          sri: "sha256-dummy-wasm",
          type: "wasm" as const,
          mountPath: "stockfish.wasm",
        },
      };

      const resources = loader
        ? await loader.loadResources(this.id, configs)
        : { main: configs.main.url, wasm: configs.wasm.url };

      this.communicator = new WorkerCommunicator(resources.main);

      // 依存性注入: WASM 等の Blob URL マップを Worker に送信
      const resourceMap: ResourceMap = {};
      for (const [key, config] of Object.entries(configs)) {
        if (config.mountPath) {
          resourceMap[config.mountPath] = resources[key];
        }
      }
      await this.injectResources(resourceMap);

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
