import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
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
      const url = "https://example.com/stockfish.js";
      const config = {
        url,
        // TODO: Replace with actual SRI hash before production release
        sri: "sha256-dummy",
        size: 0,
        type: "worker-js" as const,
      };

      const scriptUrl = loader
        ? await loader.loadResource(this.id, config)
        : url;

      this.communicator = new WorkerCommunicator(scriptUrl);

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
