import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  isNodeEnvironment,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  IEngineSourceConfig,
  createI18nKey,
} from "@multi-game-engines/core";

import {
  IBridgeSearchOptions,
  IBridgeSearchInfo,
  IBridgeSearchResult,
} from "@multi-game-engines/domain-bridge";
import { BridgeJSONParser } from "./BridgeJSONParser.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * コントラクトブリッジエンジンアダプター (JSON プロトコル)。
 *
 * エンジン側は以下の JSON フォーマットで応答することを期待します:
 * - オークション応答: `{"bid": "3NT", "expectedScore": 400}`
 * - カードプレイ応答: `{"play": "AS"}`
 * - 中間情報: `{"info": {"nodes": 5000}}`
 *
 * Node.js 環境では `config.binaryPath` を指定することで
 * ネイティブバイナリ (GIB エンジン等) を直接起動できます。
 */
export class BridgeAdapter extends BaseAdapter<
  IBridgeSearchOptions,
  IBridgeSearchInfo,
  IBridgeSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new BridgeJSONParser();

  constructor(config: IEngineConfig = {}) {
    super(config);
    this.id = config.id ?? "bridge";
    this.name = config.name ?? "Bridge Engine";
    this.version = config.version ?? "unknown";
  }

  async load(loader?: IEngineLoader, signal?: AbortSignal): Promise<void> {
    this.emitStatusChange("loading");
    try {
      if (isNodeEnvironment() && this.config.binaryPath) {
        const { NativeCommunicator } = await import(
          /* webpackIgnore: true */ /* @vite-ignore */ "@multi-game-engines/core/node"
        );
        const native = new NativeCommunicator(this.config.binaryPath);
        await native.spawn();
        this.communicator = native;
      } else {
        this.validateSources();

        if (!loader) {
          const i18nKey = createI18nKey("engine.errors.loaderRequired");
          throw new EngineError({
            code: EngineErrorCode.VALIDATION_ERROR,
            message: translate(i18nKey),
            engineId: this.id,
            i18nKey,
          });
        }
        this.activeLoader = loader;

        const sources = this.config.sources;
        if (!sources) {
          const i18nKey = createI18nKey("engine.errors.missingSources");
          throw new EngineError({
            code: EngineErrorCode.VALIDATION_ERROR,
            message: translate(i18nKey),
            engineId: this.id,
            i18nKey,
          });
        }

        const validSources: Record<string, IEngineSourceConfig> = {};
        for (const [key, value] of Object.entries(sources)) {
          if (value && typeof value === "object" && "url" in value) {
            validSources[key] = value as IEngineSourceConfig;
          }
        }

        const resources = await this.loadWithProgress(
          loader,
          validSources,
          signal,
        );

        if (!resources["main"]) {
          const i18nKey = createI18nKey("engine.errors.missingMainEntryPoint");
          throw new EngineError({
            code: EngineErrorCode.VALIDATION_ERROR,
            message: translate(i18nKey),
            engineId: this.id,
            i18nKey,
          });
        }

        this.communicator = new WorkerCommunicator(resources["main"]);
        await this.injectResources(resources);
      }

      this.messageUnsubscriber = this.communicator.onMessage((data) =>
        this.handleIncomingMessage(data),
      );

      // JSON ハンドシェイク: {"ready": true} を待つ
      const readyPromise = this.communicator.expectMessage(
        (line) => {
          try {
            const msg = JSON.parse(String(line));
            return (
              typeof msg === "object" &&
              msg !== null &&
              (msg as Record<string, unknown>)["ready"] === true
            );
          } catch {
            return false;
          }
        },
        { timeoutMs: 10000, signal },
      );
      void this.communicator.postMessage(JSON.stringify({ cmd: "ready" }));
      await readyPromise;

      this.emitStatusChange("ready");
    } catch (e) {
      if (this.messageUnsubscriber) {
        this.messageUnsubscriber();
        this.messageUnsubscriber = null;
      }
      if (this.communicator) {
        void this.communicator.terminate();
        this.communicator = null;
      }
      this.emitStatusChange("error");
      throw EngineError.from(e, this.id);
    }
  }

  protected async onBookLoaded(_url: string): Promise<void> {
    // ブリッジはオープニングブックの概念が異なるため省略
  }
}

export function createBridgeAdapter(config: IEngineConfig): BridgeAdapter {
  return new BridgeAdapter(config);
}
