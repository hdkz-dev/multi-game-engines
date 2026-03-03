import { BaseAdapter } from "../adapters/BaseAdapter.js";
import {
  IEngineLoader,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  IProtocolParser,
  IEngineConfig,
  MiddlewareCommand,
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  ILicenseInfo,
} from "../types.js";
import { createMove } from "../protocol/ProtocolValidator.js";

/**
 * CI/CD および開発用の軽量なモックアダプター。
 */
export class MockAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly version: string = "1.0.0-mock";
  readonly engineLicense: ILicenseInfo = { name: "MIT", url: "" };
  readonly adapterLicense: ILicenseInfo = { name: "MIT", url: "" };
  readonly parser: IProtocolParser<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  constructor(config: IEngineConfig = {}) {
    super(config.id ?? "mock-engine", config.name ?? "Mock Engine", config);
    this.parser = new MockParser();
  }

  public async load(_loader?: unknown): Promise<void> {
    this.emitStatusChange("loading");
    this.emitStatusChange("ready");
  }

  protected async onInitialize(): Promise<void> {}
  protected async onSearchRaw(_command: unknown): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDispose(): Promise<void> {}
  protected async onBookLoaded(_url: string): Promise<void> {}

  public searchRaw(
    _command: MiddlewareCommand,
  ): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    const task = super.searchRaw(_command);
    
    const resultPromise = new Promise<IBaseSearchResult>((resolve) => {
      setTimeout(() => {
        if (this._status === "busy") {
          const result: IBaseSearchResult = {
            bestMove: createMove("e2e4"),
            raw: "bestmove e2e4",
          };
          resolve(result);
          this.emitStatusChange("ready");
        }
      }, 500);
    });

    return {
      ...task,
      result: resultPromise,
    };
  }

  public async stop(): Promise<void> {
    if (this._status === "busy") {
      this.emitStatusChange("ready");
    }
  }

  public async setOption(
    _name: string,
    _value: string | number | boolean,
  ): Promise<void> {
    // NOP
  }

  onStatusChange(callback: (status: EngineStatus) => void): () => void {
    return super.onStatusChange(callback);
  }
  onInfo(callback: (info: IBaseSearchInfo) => void): () => void {
    return super.onInfo(callback);
  }
  onSearchResult(callback: (result: IBaseSearchResult) => void): () => void {
    return super.onSearchResult(callback);
  }
  onProgress(callback: (progress: ILoadProgress) => void): () => void {
    return super.onProgress(callback);
  }
  onTelemetry(callback: (event: ITelemetryEvent) => void): () => void {
    return super.onTelemetry(callback);
  }
}

class MockParser implements IProtocolParser<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  isReadyCommand = "isready";
  readyResponse = "readyok";
  createSearchCommand(_options: IBaseSearchOptions): MiddlewareCommand {
    return "go";
  }
  createStopCommand(): MiddlewareCommand {
    return "stop";
  }
  createOptionCommand(_name: string, _value: unknown): MiddlewareCommand {
    return "setoption";
  }
  parseInfo(line: unknown): IBaseSearchInfo | null {
    return typeof line === "string" ? { raw: line } : null;
  }
  parseResult(
    line: unknown,
  ): IBaseSearchResult | null {
    return typeof line === "string" ? { bestMove: createMove("e2e4"), raw: line } : null;
  }
}
