import { BaseAdapter } from "@multi-game-engines/core";
import { IEngineLoader, WorkerCommunicator } from "@multi-game-engines/core";
import { IMahjongSearchOptions, IMahjongSearchInfo, IMahjongSearchResult } from "./MahjongJSONParser.js";
import { MahjongJSONParser } from "./MahjongJSONParser.js";

export class MortalAdapter extends BaseAdapter<
  IMahjongSearchOptions,
  IMahjongSearchInfo,
  IMahjongSearchResult
> {
  readonly id = "mortal";
  readonly name = "Mortal";
  readonly version = "1.0.0";
  readonly parser = new MahjongJSONParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    
    const url = "https://example.com/mortal.js";
    const config = {
      url,
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
