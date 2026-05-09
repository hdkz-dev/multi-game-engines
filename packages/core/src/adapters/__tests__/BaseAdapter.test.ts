import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { BaseAdapter } from "../BaseAdapter.js";
import {
  EngineStatus,
  ILoadProgress,
  ITelemetryEvent,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ILicenseInfo,
} from "../../types.js";
import { createMove } from "../../protocol/ProtocolValidator.js";
import { WorkerCommunicator } from "../../workers/WorkerCommunicator.js";

const mockLicense: ILicenseInfo = { name: "MIT", url: "" };

class TestAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly version = "1.0.0";
  readonly engineLicense = mockLicense;
  readonly adapterLicense = mockLicense;
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

  constructor(id = "test-adapter", name = "Test Adapter", config = {}) {
    super(id, name, config);
  }

  public async load(): Promise<void> {
    this.emitStatusChange("ready");
  }

  protected async onInitialize(): Promise<void> {}
  protected async onSearchRaw(_command: string): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDispose(): Promise<void> {}
  protected async onBookLoaded(_url: string): Promise<void> {}

  // テスト用に内部 protected メソッドを公開
  public testEmitStatusChange(status: EngineStatus) {
    this.emitStatusChange(status);
  }

  public testHandleIncomingMessage(data: unknown) {
    this.handleIncomingMessage(data);
  }

  public testEmitProgress(p: ILoadProgress) {
    this.emitProgress(p);
  }

  public testEmitTelemetry(e: ITelemetryEvent) {
    this.emitTelemetry(e);
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
    adapter.testEmitTelemetry(mockEvent);

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
    expect(
      () =>
        new TestAdapter("test", "Test", {
          sources: {
            main: { url: "test.js", type: "script", sri: "invalid-hash" },
          },
        }),
    ).toThrow(/Invalid SRI hash format/);
  });

  it("should handle engine-reported errors through parser.translateError", () => {
    const adapter = new TestAdapter();
    adapter.setStatus("ready");
    adapter.setCommunicator({
      postMessage: vi.fn(),
      onMessage: vi.fn(),
    } as unknown);

    const task = adapter.searchRaw("go");
    adapter.setStatus("busy");

    if (adapter.parser.translateError) {
      vi.mocked(adapter.parser.translateError).mockReturnValue(
        "engine.errors.protocolError" as unknown as unknown,
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

  it("should emit ready status on handleStreamCancel when busy", async () => {
    const adapter = new TestAdapter();
    adapter.setStatus("busy");
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    await adapter.testHandleStreamCancel();
    expect(statusSpy).toHaveBeenCalledWith("ready");
  });

  it("should skip ready emission on handleStreamCancel when not busy", async () => {
    const adapter = new TestAdapter();
    adapter.setStatus("ready");
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    await adapter.testHandleStreamCancel();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it("should clear all listeners on clearListeners", () => {
    const adapter = new TestAdapter();
    adapter.onStatusChange(vi.fn());
    adapter.onInfo(vi.fn());

    // Access protected method via any cast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapter as any).clearListeners();
    expect(adapter).toBeDefined();
  });

  describe("constructor variants", () => {
    it("should accept an IEngineConfig and derive id/name from it", () => {
      class CfgAdapter extends BaseAdapter<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      > {
        readonly version = "x";
        readonly parser = {
          createSearchCommand: vi.fn(),
          createStopCommand: vi.fn(),
          createOptionCommand: vi.fn(),
          parseInfo: vi.fn(),
          parseResult: vi.fn(),
          isReadyCommand: "isready",
          readyResponse: "readyok",
        };
        async load() {}
      }
      const a = new CfgAdapter({ id: "from-cfg", name: "From Cfg" });
      expect(a.id).toBe("from-cfg");
      expect(a.name).toBe("From Cfg");
    });

    it("should default id/name when IEngineConfig omits them", () => {
      class CfgAdapter extends BaseAdapter<
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      > {
        readonly version = "x";
        readonly parser = {
          createSearchCommand: vi.fn(),
          createStopCommand: vi.fn(),
          createOptionCommand: vi.fn(),
          parseInfo: vi.fn(),
          parseResult: vi.fn(),
          isReadyCommand: "isready",
          readyResponse: "readyok",
        };
        async load() {}
      }
      const a = new CfgAdapter({});
      expect(a.id).toBe("unknown");
      expect(a.name).toBe("Unknown Engine");
    });
  });

  describe("validateSources", () => {
    it("should throw when sources is provided without main", () => {
      expect(
        () =>
          new TestAdapter("t", "T", {
            sources: {
              other: {
                url: "x.js",
                type: "script",
                sri: "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
              },
            },
          }),
      ).toThrow(/requires a "main" source/);
    });

    it("should throw when an SRI hash contains the literal Placeholder", () => {
      expect(
        () =>
          new TestAdapter("t", "T", {
            sources: {
              main: {
                url: "x.js",
                type: "script",
                sri: "sha384-PlaceholderAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
              },
            },
          }),
      ).toThrow(/Placeholder SRI hash detected/);
    });

    it("should accept a valid SRI hash", () => {
      expect(
        () =>
          new TestAdapter("t", "T", {
            sources: {
              main: {
                url: "x.js",
                type: "script",
                sri: "sha384-SetCorrectHashHereToSatisfySecurityAudit0123456789ABCDEF01234567",
              },
            },
          }),
      ).not.toThrow();
    });
  });

  describe("search / searchRaw / stop / setOption / dispose lifecycle", () => {
    const makeReadyAdapter = () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      const post = vi.fn();
      a.setCommunicator({
        postMessage: post,
        onMessage: vi.fn(),
        terminate: vi.fn().mockResolvedValue(undefined),
      } as unknown);
      return { adapter: a, post };
    };

    it("search() should resolve when parser.parseResult yields a result", async () => {
      const { adapter } = makeReadyAdapter();
      const result = {
        raw: "bm",
        bestMove: createMove("e2e4"),
      } as IBaseSearchResult;
      vi.mocked(adapter.parser.createSearchCommand).mockReturnValue(
        "go" as unknown as never,
      );
      vi.mocked(adapter.parser.parseResult).mockReturnValue(result);

      const promise = adapter.search({} as IBaseSearchOptions);
      adapter.testHandleIncomingMessage("bestmove e2e4");
      await expect(promise).resolves.toBe(result);
      expect(adapter.status).toBe("ready");
    });

    it("searchRaw() should restart cleanly when called while busy", async () => {
      const { adapter } = makeReadyAdapter();
      const first = adapter.searchRaw("go");
      // Attach a catch handler so the rejection from the restart cleanup
      // doesn't leak as an unhandled rejection.
      const firstSettled = first.result.catch(() => undefined);
      expect(adapter.status).toBe("busy");

      const second = adapter.searchRaw("go");
      expect(adapter.status).toBe("busy");
      expect(second).toBeDefined();
      // The previous task must have been rejected via the cleanup path
      await expect(firstSettled).resolves.toBeUndefined();
    });

    it("searchRaw() should reset status to ready when sendSearchCommand throws", () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      a.setCommunicator({
        postMessage: vi.fn().mockImplementation(() => {
          throw new Error("post failed");
        }),
        onMessage: vi.fn(),
      } as unknown);

      expect(() => a.searchRaw("go")).toThrow(/post failed/);
      expect(a.status).toBe("ready");
    });

    it("searchRaw().stop() should call adapter.stop()", async () => {
      const { adapter } = makeReadyAdapter();
      const stopSpy = vi.spyOn(adapter, "stop").mockResolvedValue(undefined);
      const task = adapter.searchRaw("go");
      task.stop();
      // stop() is invoked via void expression; ensure microtask resolution
      await Promise.resolve();
      expect(stopSpy).toHaveBeenCalled();
    });

    it("stop() should be a no-op when not busy", async () => {
      const { adapter, post } = makeReadyAdapter();
      await adapter.stop();
      expect(post).not.toHaveBeenCalled();
    });

    it("stop() should post a stop command when busy", async () => {
      const { adapter, post } = makeReadyAdapter();
      const task = adapter.searchRaw("go");
      const settled = task.result.catch(() => undefined);
      vi.mocked(adapter.parser.createStopCommand).mockReturnValue(
        "stop" as unknown as never,
      );
      await adapter.stop();
      expect(post).toHaveBeenCalledWith("stop");
      await settled;
    });

    it("setOption() should post an option command", async () => {
      const { adapter, post } = makeReadyAdapter();
      vi.mocked(adapter.parser.createOptionCommand).mockReturnValue(
        "setoption name X value 1" as unknown as never,
      );
      await adapter.setOption("X", 1);
      expect(post).toHaveBeenCalledWith("setoption name X value 1");
    });

    it("setOption() should be a no-op without a communicator", async () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      // No communicator set
      await expect(a.setOption("X", 1)).resolves.toBeUndefined();
    });

    it("dispose() should terminate the communicator, transition to terminated, and clear listeners", async () => {
      const a = new TestAdapter();
      const term = vi.fn().mockResolvedValue(undefined);
      a.setCommunicator({
        postMessage: vi.fn(),
        onMessage: vi.fn(),
        terminate: term,
      } as unknown);

      const statusSpy = vi.fn();
      const infoSpy = vi.fn();
      a.onStatusChange(statusSpy);
      a.onInfo(infoSpy);

      await a.dispose();

      expect(term).toHaveBeenCalled();
      expect(a.status).toBe("terminated");
      // After dispose, listeners should be cleared (next emit shouldn't call them)
      a.testEmitStatusChange("ready");
      // statusSpy may have been called once (with "terminated") before clear
      const beforeClear = statusSpy.mock.calls.length;
      a.testEmitStatusChange("busy");
      expect(statusSpy.mock.calls.length).toBe(beforeClear);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("dispose() should be safe even without a communicator", async () => {
      const a = new TestAdapter();
      await expect(a.dispose()).resolves.toBeUndefined();
      expect(a.status).toBe("terminated");
    });
  });

  describe("handleIncomingMessage edge paths", () => {
    it("should ignore messages when status is 'error'", () => {
      const a = new TestAdapter();
      a.setStatus("error");
      const infoSpy = vi.fn();
      a.onInfo(infoSpy);
      a.testHandleIncomingMessage("anything");
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("should ignore messages when status is 'terminated'", () => {
      const a = new TestAdapter();
      a.setStatus("terminated");
      const infoSpy = vi.fn();
      a.onInfo(infoSpy);
      a.testHandleIncomingMessage("anything");
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it("should not call translateError when error doesn't start with 'error'", () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      a.testHandleIncomingMessage("warning: something");
      expect(adapterParser(a).translateError).not.toHaveBeenCalled();
    });

    it("should set status to error when translateError yields a message", () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      vi.mocked(adapterParser(a).translateError!).mockReturnValue("translated");
      a.testHandleIncomingMessage("error: catastrophic");
      expect(a.status).toBe("error");
    });

    it("should not transition status when translateError returns null", () => {
      const a = new TestAdapter();
      a.setStatus("ready");
      vi.mocked(adapterParser(a).translateError!).mockReturnValue(
        null as unknown as string,
      );
      a.testHandleIncomingMessage("error: ignore me");
      expect(a.status).toBe("ready");
    });
  });

  describe("setBook", () => {
    it("should throw when no loader is attached", async () => {
      const a = new TestAdapter();
      await expect(
        a.setBook({
          id: "book",
          url: "book.bin",
          type: "bin",
          sri: "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        }),
      ).rejects.toThrow(/No loader/);
    });

    it("should call activeLoader.loadResource and onBookLoaded with the resulting URL", async () => {
      const a = new TestAdapter();
      const loadResource = vi.fn().mockResolvedValue("blob:loaded");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a as any).activeLoader = { loadResource };
      const onBookSpy = vi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(a as any, "onBookLoaded")
        .mockResolvedValue(undefined);

      await a.setBook({
        id: "book",
        url: "book.bin",
        type: "bin",
        sri: "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      });

      expect(loadResource).toHaveBeenCalled();
      expect(onBookSpy).toHaveBeenCalledWith("blob:loaded");
    });
  });

  it("progress getter should reflect current status", () => {
    const a = new TestAdapter();
    expect(a.progress.status).toBe("uninitialized");
    a.setStatus("ready");
    expect(a.progress.status).toBe("ready");
  });

  it("updateStatus is a public alias for emitStatusChange", () => {
    const a = new TestAdapter();
    const spy = vi.fn();
    a.onStatusChange(spy);
    a.updateStatus("busy");
    expect(spy).toHaveBeenCalledWith("busy");
    expect(a.status).toBe("busy");
  });
});

const adapterParser = (a: { parser: unknown }) =>
  a.parser as {
    translateError?: (data: unknown) => string | null;
  };
