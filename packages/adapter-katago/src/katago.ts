import { BaseAdapter } from "@multi-game-engines/core";
import {
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
} from "@multi-game-engines/core";
import {
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult,
} from "./GTPParser.js";
import { GTPParser } from "./GTPParser.js";

export class KatagoAdapter extends BaseAdapter<
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult
> {
  readonly id = "katago";
  readonly name = "KataGo";
  readonly version = "1.15.0";
  readonly parser = new GTPParser();

  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      const url = "https://example.com/katago.js";
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
