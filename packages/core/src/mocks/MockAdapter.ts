import { BaseAdapter } from "../adapters/BaseAdapter.js";
import {
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
  EngineErrorCode,
} from "../types.js";
import { createMove } from "../protocol/ProtocolValidator.js";
import { EngineError } from "../errors/EngineError.js";
import { WorkerCommunicator } from "../workers/WorkerCommunicator.js";

/**
 * CI/CD および開発用の軽量なモックアダプター。
 */
export class MockAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  public override readonly version: string = "1.0.0-mock";
  public override readonly engineLicense: ILicenseInfo = {
    name: "MIT",
    url: "",
  };
  public override readonly adapterLicense: ILicenseInfo = {
    name: "MIT",
    url: "",
  };
  public override readonly parser: IProtocolParser<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  private mockPendingReject: ((err: unknown) => void) | null = null;
  private activeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: IEngineConfig = {}) {
    super(config.id ?? "mock-engine", config.name ?? "Mock Engine", config);
    this.parser = new MockParser();
  }

  public async load(_loader?: unknown): Promise<void> {
    this.emitStatusChange("loading");
    this._status = "ready";
    this.emitStatusChange("ready");
  }

  public setStatus(status: EngineStatus): void {
    this._status = status;
    this.emitStatusChange(status);
  }

  public testHandleIncomingMessage(data: unknown): void {
    this.handleIncomingMessage(data);
  }

  public setCommunicator(comm: unknown): void {
    this.communicator = comm as WorkerCommunicator;
  }

  protected async onInitialize(): Promise<void> {}
  protected async onSearchRaw(_command: unknown): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDispose(): Promise<void> {}
  protected async onBookLoaded(_url: string): Promise<void> {}

  public searchRaw(
    _command: MiddlewareCommand,
  ): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    this._status = "busy";
    this.emitStatusChange("busy");

    const resultPromise = new Promise<IBaseSearchResult>((resolve, reject) => {
      this.mockPendingReject = reject;
      this.activeTimer = setTimeout(() => {
        if (this._status === "busy") {
          const result: IBaseSearchResult = {
            bestMove: createMove("e2e4"),
            raw: "bestmove e2e4",
          };
          resolve(result);
          this._status = "ready";
          this.emitStatusChange("ready");
          this.mockPendingReject = null;
          this.activeTimer = null;
        }
      }, 10);
    });

    const infoStream: AsyncIterable<IBaseSearchInfo> = {
      [Symbol.asyncIterator]: async function* () {
        yield { raw: "info depth 1" };
      },
    };

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => {
        void this.stop();
      },
    };
  }

  public async stop(): Promise<void> {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    if (this.mockPendingReject) {
      const reject = this.mockPendingReject;
      this.mockPendingReject = null;
      reject(
        new EngineError({
          code: EngineErrorCode.SEARCH_ABORTED,
          message: "Stopped",
          engineId: this.id,
        }),
      );
    }
    this._status = "ready";
    this.emitStatusChange("ready");
  }

  public async dispose(): Promise<void> {
    await this.stop();
    this._status = "terminated";
    this.emitStatusChange("terminated");
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
  parseResult(line: unknown): IBaseSearchResult | null {
    return typeof line === "string"
      ? { bestMove: createMove("e2e4"), raw: line }
      : null;
  }
}
