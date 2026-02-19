import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
} from "@multi-game-engines/core";
import {
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult,
} from "./EdaxParser.js";
import { EdaxParser } from "./EdaxParser.js";

export class EdaxAdapter extends BaseAdapter<
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult
> {
  readonly id = "edax";
  readonly name = "Edax";
  readonly version = "4.4";
  readonly parser = new EdaxParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      // WIP: URL selection logic
      const url = "https://example.com/edax.js";
      const config = {
        url,
        // TODO: Replace with real SRI hash before production release
        sri: "sha384-EdaxMainScriptHashPlaceholder",
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
