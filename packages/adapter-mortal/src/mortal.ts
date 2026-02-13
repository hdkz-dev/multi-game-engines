import { BaseAdapter } from "@multi-game-engines/core";
import { IEngineLoader, WorkerCommunicator, EngineError, EngineErrorCode } from "@multi-game-engines/core";
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
    try {
      const url = "https://example.com/mortal.js";
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

  async stop(): Promise<void> {
    this.cleanupPendingTask("Search aborted");
    if (!this.communicator) return;
    this.communicator.postMessage(this.parser.createStopCommand());
  }

  protected async sendOptionToWorker(name: string, value: string | number | boolean): Promise<void> {
    if (!this.communicator) {
      throw new EngineError(EngineErrorCode.NOT_READY, "Engine is not loaded", this.id);
    }
    this.communicator.postMessage(this.parser.createOptionCommand(name, value));
  }
}
