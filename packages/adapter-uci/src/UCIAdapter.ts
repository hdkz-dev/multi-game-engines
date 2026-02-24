import {
  BaseAdapter,
  IEngineLoader,
  WorkerCommunicator,
  EngineError,
  EngineErrorCode,
  ResourceMap,
  IEngineConfig,
  IEngineSourceConfig,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";
import {
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult,
} from "@multi-game-engines/domain-chess";
import { UCIParser } from "./UCIParser.js";

/**
 * 2026 Zenith Tier: 汎用 UCI (Universal Chess Interface) アダプター。
 * コンフィギュレーションにより、任意の UCI エンジンを動的にロード可能です。
 */
export class UCIAdapter extends BaseAdapter<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly parser = new UCIParser();

  constructor(config: IEngineConfig) {
    super(config);
    this.id = config.id ?? "uci";
    this.name = config.name ?? "UCI Engine";
    this.version = config.version ?? "unknown";
  }

  /**
   * エンジンのリソースをロードし、Worker を初期化して 'uci' ハンドシェイクを実行します。
   *
   * @param loader - エンジンローダー。2026 Zenith Tier では必須です。省略されると EngineError がスローされます。
   * @returns 初期化とハンドシェイク ('uciok') 完了時に解決される Promise。
   * @throws {EngineError} リソース不足、Worker エラー、またはハンドシェイクのタイムアウト時にスローされます。
   */
  async load(loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    try {
      this.validateSources();

      if (!loader) {
        const i18nKey = "engine.errors.loaderRequired" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      const sources = this.config.sources;
      if (!sources) {
        const i18nKey = "engine.errors.missingSources" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
        });
      }

      // 2026 Best Practice: マルチソースの並列ロードと検証
      const validSources: Record<string, IEngineSourceConfig> = {};
      for (const [key, value] of Object.entries(sources)) {
        if (value) {
          validSources[key] = value;
        }
      }

      const resources = await loader.loadResources(this.id, validSources);

      if (!resources["main"]) {
        const i18nKey = "engine.errors.missingMainEntryPoint" as I18nKey;
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey),
          engineId: this.id,
          i18nKey,
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
      const uciOkPromise = this.communicator.expectMessage(
        (line) => line === "uciok",
        { timeoutMs: 10000 },
      );

      this.communicator.postMessage("uci");
      await uciOkPromise;

      this.emitStatusChange("ready");
    } catch (error) {
      if (this.messageUnsubscriber) {
        this.messageUnsubscriber();
        this.messageUnsubscriber = null;
      }
      if (this.communicator) {
        this.communicator.terminate();
        this.communicator = null;
      }
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }
}
