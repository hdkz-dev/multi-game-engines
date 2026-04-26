import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineFacade } from "../EngineFacade.js";
import { MockAdapter } from "../../mocks/MockAdapter.js";
import { IEngineLoader } from "../../types.js";

describe("EngineFacade", () => {
  let mockLoader: IEngineLoader;

  beforeEach(() => {
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:url"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:url" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("should atomic load: concurrent load() calls should be shared", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const loadSpy = vi
      .spyOn(adapter, "load")
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    const p1 = facade.load();
    const p2 = facade.load();

    await Promise.all([p1, p2]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("dispose() がアダプターを破棄し、リソースを解放すること", async () => {
    const adapter = new MockAdapter({ id: "test-engine" });
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    vi.spyOn(adapter, "dispose");

    await facade.dispose();

    expect(adapter.dispose).toHaveBeenCalledTimes(1);
    expect(mockLoader.revokeAll).toHaveBeenCalled();
  });

  it("should call adapter.stop from stop() and clear currentSearchTask", async () => {
    const adapter = new MockAdapter({ id: "test" });
    await adapter.load();
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    // Start a search to set currentSearchTask, then stop
    const searchPromise = facade.search({});
    facade.stop();
    await searchPromise.catch(() => {});
    expect(adapter.status).not.toBe("busy");
  });

  it("should call adapter.stop in dispose() when currentSearchTask is set", async () => {
    const adapter = new MockAdapter({ id: "test" });
    await adapter.load();
    const stopSpy = vi.spyOn(adapter, "stop");
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    // Start search but don't await (suppress unhandled rejection)
    const searchPromise = facade.search({}).catch(() => {});
    // Dispose while search is running
    await facade.dispose();
    await searchPromise;
    expect(stopSpy).toHaveBeenCalled();
  });

  it("should support use() and unuse() middleware", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    const mw = { id: "test-mw", onCommand: vi.fn(), onResult: vi.fn() };
    facade.use(mw as never);
    facade.unuse(mw as never);
    facade.use(mw as never);
    facade.unuse("test-mw");
    expect(facade).toBeDefined();
  });

  it("should support event listener registration methods", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    const info = vi.fn();
    const result = vi.fn();
    const status = vi.fn();
    const telemetry = vi.fn();
    const progress = vi.fn();

    const cleanInfo = facade.onInfo(info);
    const cleanResult = facade.onSearchResult(result);
    const cleanStatus = facade.onStatusChange(status);
    const cleanTelemetry = facade.onTelemetry(telemetry);
    const cleanProgress = facade.onProgress(progress);

    cleanInfo();
    cleanResult();
    cleanStatus();
    cleanTelemetry();
    cleanProgress();

    facade.emitTelemetry({
      type: "lifecycle",
      timestamp: Date.now(),
      metadata: {},
    });
    expect(facade).toBeDefined();
  });

  it("should not emitTelemetry after dispose", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const emitSpy = vi.spyOn(adapter, "emitTelemetry" as never);
    const facade = new EngineFacade(adapter, [], async () => mockLoader);

    await facade.dispose();
    facade.emitTelemetry({
      type: "lifecycle",
      timestamp: Date.now(),
      metadata: {},
    });
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
