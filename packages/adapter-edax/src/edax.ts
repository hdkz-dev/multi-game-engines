import { BaseAdapter } from "@multi-game-engines/core";
import { IEngineLoader, WorkerCommunicator } from "@multi-game-engines/core";
import { IOthelloSearchOptions, IOthelloSearchInfo, IOthelloSearchResult } from "./EdaxParser.js";
import { EdaxParser } from "./EdaxParser.js";

export class EdaxAdapter extends BaseAdapter<
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult
> {
  readonly id = "edax";
  readonly name = "Edax";
  readonly version = "4.4";
  readonly parser = new EdaxParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    
    // WIP: URL selection logic
    const url = "https://example.com/edax.js";
    const config = {
      url,
      // TODO: Replace with actual SRI hash before production release
      sri: "sha256-dummy",
      size: 0,
    };

    const scriptUrl = loader 
      ? await loader.loadResource(this.id, config)
      : url;

    this.communicator = new WorkerCommunicator(scriptUrl);
    
    this.messageUnsubscriber = this.communicator.onMessage((data) => {
      this.handleIncomingMessage(data);
    });

    this.emitStatusChange("ready");
  }
}
