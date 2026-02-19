import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  ResourceMap,
  IEngineConfig,
  IEngineSourceConfig,
} from "@multi-game-engines/core";
import {
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult,
  GTPParser,
} from "./GTPParser.js";

/**
 * 2026 Zenith Tier: 汎用 GTP (Go Text Protocol) アダプター。
 */
export class GTPAdapter extends BaseAdapter<
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new GTPParser();

  constructor(private config: IEngineConfig) {
    super();
    this.id = config.id;
    this.name = config.name ?? "GTP Engine";
    this.version = config.version ?? "unknown";
  }

  /**
   * エンジンのリソースをロードし、Worker を初期化します。
   *
   * @param loader - オプションのカスタムローダー。省略時はデフォルトのリソース解決ロジックが使用されます。
   * @returns 初期化完了時に解決される Promise。
   * @throws {EngineError} 必須リソースの欠落や Worker の起動失敗時にスローされます。
   */
  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      const { sources } = this.config;

      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value) validSources[key] = value;
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

      this.emitStatusChange("ready");
    } catch (error) {
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }
}
