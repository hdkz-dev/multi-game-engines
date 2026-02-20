import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  ResourceMap,
  IEngineConfig,
  IEngineSourceConfig,
  IEngineAdapter,
} from "@multi-game-engines/core";
import { ISHOGISearchOptions } from "./usi-types.js";
import {
  ISHOGISearchInfo,
  ISHOGISearchResult,
  USIParser,
} from "./USIParser.js";

/**
 * 2026 Zenith Tier: 汎用 USI (Universal Shogi Interface) アダプター。
 * コンフィギュレーションにより、任意の将棋エンジンを動的にロード可能です。
 */
export class USIAdapter extends BaseAdapter<
  ISHOGISearchOptions,
  ISHOGISearchInfo,
  ISHOGISearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new USIParser();

  constructor(private config: IEngineConfig) {
    super();
    this.id = config.id;
    this.name = config.name ?? "USI Engine";
    this.version = config.version ?? "unknown";
  }

  /**
   * エンジンのリソースをロードし、Worker を初期化して 'usi' ハンドシェイクを実行します。
   *
   * @param loader - オプションのカスタムローダー。
   * @returns 初期化とハンドシェイク ('usiok') 完了時に解決される Promise。
   * @throws {EngineError} リソース不足、Worker エラー、またはハンドシェイクのタイムアウト時にスローされます。
   */
  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      const { sources } = this.config;

      // 2026 Best Practice: マルチソースの並列ロードと検証
      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value) {
          validSources[key] = value;
        }
      }

      const resources = loader
        ? await loader.loadResources(this.id, validSources)
        : { main: sources.main?.url };

      if (!resources["main"]) {
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: "Missing main entry point URL",
          engineId: this.id,
        });
      }

      this.communicator = new WorkerCommunicator(resources["main"]);

      // 依存性注入: WASM や評価関数等の Blob URL マップを Worker に送信
      const resourceMap: ResourceMap = {};
      for (const [key, source] of Object.entries(sources)) {
        if (source?.mountPath && resources[key]) {
          resourceMap[source.mountPath] = resources[key]!;
        }
      }

      if (Object.keys(resourceMap).length > 0) {
        await this.injectResources(resourceMap);
      }

      this.messageUnsubscriber = this.communicator.onMessage((data) => {
        this.handleIncomingMessage(data);
      });

      // 2026 Best Practice: エンジン初期化のハンドシェイク (Atomic Ready)
      const usiOkPromise = this.communicator.expectMessage(
        (line) => line === "usiok",
        { timeoutMs: 10000 },
      );

      this.communicator.postMessage("usi");
      await usiOkPromise;

      this.emitStatusChange("ready");
    } catch (error) {
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }
}

/**
 * 2026 Zenith Tier: 汎用 USI アダプターのファクトリ関数。
 */
export function createUSIAdapter(
  config: IEngineConfig,
): IEngineAdapter<ISHOGISearchOptions, ISHOGISearchInfo, ISHOGISearchResult> {
  return new USIAdapter(config);
}
