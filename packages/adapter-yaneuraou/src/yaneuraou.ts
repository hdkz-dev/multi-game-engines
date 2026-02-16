import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  ResourceMap,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
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
      const configs: Record<string, IEngineSourceConfig> = {
        main: {
          url: "https://example.com/yaneuraou.js",
          sri: "sha256-dummy-main",
          type: "worker-js" as const,
        },
        wasm: {
          url: "https://example.com/yaneuraou.wasm",
          sri: "sha256-dummy-wasm",
          type: "wasm" as const,
          mountPath: "yaneuraou.wasm",
        },
        nnue: {
          url: "https://example.com/eval/nnue.bin",
          sri: "sha256-dummy-nnue",
          type: "eval-data" as const,
          mountPath: "nnue.bin",
        },
      };

      const resources = loader
        ? await loader.loadResources(this.id, configs)
        : {
            main: configs.main.url,
            wasm: configs.wasm.url,
            nnue: configs.nnue.url,
          };

      this.communicator = new WorkerCommunicator(resources.main);

      // 依存性注入: WASM/NNUE 等の Blob URL マップを Worker に送信
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
