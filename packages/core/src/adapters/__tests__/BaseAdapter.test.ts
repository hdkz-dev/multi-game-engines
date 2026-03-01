import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { BaseAdapter } from "../BaseAdapter.js";
import {
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "../../types.js";
import { createMove } from "../../protocol/ProtocolValidator.js";
import { WorkerCommunicator } from "../../workers/WorkerCommunicator.js";

class TestAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly id = "test-adapter";
  readonly name = "Test Adapter";
  readonly version = "1.0.0";
  readonly parser = {
    createSearchCommand: vi.fn(),
    createStopCommand: vi.fn(),
    createOptionCommand: vi.fn(),
    parseInfo: vi.fn(),
    parseResult: vi.fn(),
    isReadyCommand: "isready",
    readyResponse: "readyok",
    translateError: vi.fn(),
  };

  public async load(): Promise<void> {
    this.emitStatusChange("ready");
  }

  protected async onInitialize(): Promise<void> {
    // mock implementation
  }

  protected async onSearchRaw(_command: string): Promise<void> {
    // mock implementation
  }

  protected async onStop(): Promise<void> {
    // mock implementation
  }

  protected async onDispose(): Promise<void> {
    // mock implementation
  }

  protected async onBookLoaded(_url: string): Promise<void> {
    // mock implementation
  }

  public testEmitStatusChange(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  public testHandleIncomingMessage(data: unknown) {
    this.handleIncomingMessage(data);
  }

  public testEmitProgress(p: ILoadProgress) {
    this.emitProgress(p);
  }

  public setCommunicator(comm: unknown) {
    this.communicator = comm as unknown as WorkerCommunicator;
  }

  public setStatus(status: EngineStatus) {
    this._status = status;
  }

  public async testHandleStreamCancel() {
    return this.handleStreamCancel();
  }
}

describe("BaseAdapter", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with uninitialized status", () => {
    const adapter = new TestAdapter();
    expect(adapter.status).toBe("uninitialized");
  });

  it("should notify status changes to listeners", () => {
    const adapter = new TestAdapter();
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    adapter.testEmitStatusChange("ready");

    expect(statusSpy).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });

  it("should unsubscribe listeners", () => {
    const adapter = new TestAdapter();
    const statusSpy = vi.fn();
    const unsubscribe = adapter.onStatusChange(statusSpy);

    unsubscribe();
    adapter.testEmitStatusChange("busy");

    expect(statusSpy).not.toHaveBeenCalled();
  });

  it("should notify search info through message handling", () => {
    const adapter = new TestAdapter();
    const infoSpy = vi.fn();
    adapter.onInfo(infoSpy);

    const mockInfo = { raw: "info 1" } as IBaseSearchInfo;
    vi.mocked(adapter.parser.parseInfo).mockReturnValue(mockInfo);

    adapter.testHandleIncomingMessage("info string from engine");

    expect(adapter.parser.parseInfo).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(mockInfo);
  });

  it("should notify search results through message handling", () => {
    const adapter = new TestAdapter();
    const resultSpy = vi.fn();
    adapter.onSearchResult(resultSpy);

    const mockResult = {
      raw: "result",
      bestMove: createMove("e2e4"),
    } as IBaseSearchResult;
    vi.mocked(adapter.parser.parseResult).mockReturnValue(mockResult);

    adapter.testHandleIncomingMessage("bestmove e2e4");

    expect(adapter.parser.parseResult).toHaveBeenCalled();
    expect(resultSpy).toHaveBeenCalledWith(mockResult);
  });

  it("should notify telemetry events to listeners", () => {
    const adapter = new TestAdapter();
    const telemetrySpy = vi.fn();
    adapter.onTelemetry(telemetrySpy);

    const mockEvent: ITelemetryEvent = {
      type: "performance",
      timestamp: 12345,
      metadata: {},
    };
    adapter.emitTelemetry(mockEvent);

    expect(telemetrySpy).toHaveBeenCalledWith(mockEvent);
  });

  it("should notify progress updates to listeners", () => {
    const adapter = new TestAdapter();
    const progressSpy = vi.fn();
    adapter.onProgress(progressSpy);

    const progress: ILoadProgress = {
      status: "loading",
      loadedBytes: 500,
      totalBytes: 1000,
    };
    adapter.testEmitProgress(progress);

    expect(progressSpy).toHaveBeenCalledWith(progress);
  });

  it("should throw error if searching when not ready", () => {
    const adapter = new TestAdapter();
    adapter.setStatus("uninitialized");
    expect(() => adapter.searchRaw("go")).toThrow();
  });

  it("should trigger stop() when stream is cancelled", async () => {
    const adapter = new TestAdapter();
    const stopSpy = vi.spyOn(adapter, "stop").mockResolvedValue(undefined);

    await adapter.testHandleStreamCancel();

    expect(stopSpy).toHaveBeenCalled();
  });

  it("should validate SRI hashes and throw on invalid formats", () => {
    const adapter = new TestAdapter({
      sources: {
        main: { url: "test.js", type: "script", sri: "invalid-hash" },
      },
    });
    expect(() =>
      (adapter as unknown as { validateSources: () => void }).validateSources(),
    ).toThrow();
  });

  it("should handle engine-reported errors through parser.translateError", () => {
    const adapter = new TestAdapter();
    adapter.setStatus("ready");
    adapter.setCommunicator({ postMessage: vi.fn(), onMessage: vi.fn() });

    const task = adapter.searchRaw("go");
    adapter.setStatus("busy");

    if (adapter.parser.translateError) {
      vi.mocked(adapter.parser.translateError).mockReturnValue(
        "engine.errors.protocolError" as unknown as string,
      );
    }

    adapter.testHandleIncomingMessage("error: something went wrong");

    expect(adapter.status).toBe("error");
    return expect(task.result).rejects.toThrow();
  });

  it("should handle unknown message formats gracefully", () => {
    const adapter = new TestAdapter();
    const infoSpy = vi.fn();
    adapter.onInfo(infoSpy);

    adapter.testHandleIncomingMessage(12345);
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
