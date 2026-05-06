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
  IPokerSearchOptions,
  IPokerSearchInfo,
  IPokerSearchResult,
} from "@multi-game-engines/domain-poker";
import { PokerJSONParser } from "./PokerJSONParser.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * ポーカーエンジンアダプター (JSON-RPC プロトコル)。
 *
 * エンジン側は以下の JSON フォーマットで応答することを期待します:
 * - アクション応答: `{"action": "raise:150", "equity": 0.62}`
 * - 中間情報: `{"info": {"nodes": 12345, "equity": 0.55}}`
 *
 * Node.js 環境では `config.binaryPath` を指定することで
 * ネイティブバイナリ (GTO ソルバー等) を直接起動できます。
 */
export class PokerAdapter extends BaseAdapter<
  IPokerSearchOptions,
  IPokerSearchInfo,
  IPokerSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new PokerJSONParser();

  constructor(config: IEngineConfig = {}) {
    super(config);
    this.id = config.id ?? "poker";
    this.name = config.name ?? "Poker Engine";
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

      // JSON-RPC ハンドシェイク: {"ready": true} を待つ
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
    // ポーカーはオープニングブックを使用しない
  }
}

export function createPokerAdapter(config: IEngineConfig): PokerAdapter {
  return new PokerAdapter(config);
}
