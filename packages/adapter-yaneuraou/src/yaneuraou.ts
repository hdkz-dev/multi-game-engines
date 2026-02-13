import { BaseAdapter } from "@multi-game-engines/core";
import { IEngineLoader, WorkerCommunicator, EngineError, EngineErrorCode } from "@multi-game-engines/core";
import { ISHOGISearchInfo, ISHOGISearchResult } from "./USIParser.js";
import { ISHOGISearchOptions } from "./usi-types.js";
import { USIParser } from "./USIParser.js";

export class YaneuraouAdapter extends BaseAdapter<
  ISHOGISearchOptions,
  ISHOGISearchInfo,
  ISHOGISearchResult
> {
  readonly id = "yaneuraou";
  readonly name = "Yaneuraou";
  readonly version = "7.5.0";
  readonly parser = new USIParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      const url = "https://example.com/yaneuraou.js";
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
