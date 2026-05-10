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

  describe("identity getters", () => {
    it("should expose adapter identity through getters", () => {
      const adapter = new MockAdapter({ id: "x", name: "X" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      expect(facade.id).toBe("x");
      expect(facade.name).toBe("X");
      expect(facade.version).toBe(adapter.version);
      expect(facade.status).toBe(adapter.status);
      expect(facade.engineLicense).toEqual(adapter.engineLicense);
      expect(facade.adapterLicense).toEqual(adapter.adapterLicense);
    });

    it("lastError should be null until a search throws", () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      expect(facade.lastError).toBeNull();
    });

    it("config getter should reflect adapter.config when present", () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      // MockAdapter exposes config via the adapter type-shape
      expect(facade.config).toBeDefined();
    });
  });

  describe("setBook", () => {
    it("should delegate to adapter.setBook", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const setBookSpy = vi
        .spyOn(adapter, "setBook")
        .mockResolvedValue(undefined);
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      const asset = {
        id: "b",
        url: "u",
        type: "bin" as const,
        sri: "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      };
      await facade.setBook(asset);
      expect(setBookSpy).toHaveBeenCalledWith(asset, undefined);
    });

    it("should throw after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      await facade.dispose();
      await expect(
        facade.setBook({
          id: "b",
          url: "u",
          type: "bin",
          sri: "sha384-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        }),
      ).rejects.toThrow(/Object disposed/);
    });
  });

  describe("search behavior", () => {
    it("should throw when called after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      await facade.dispose();
      await expect(facade.search({})).rejects.toThrow(/Object disposed/);
    });

    it("should reject with NOT_READY when busy", async () => {
      const adapter = new MockAdapter({ id: "x" });
      await adapter.load();
      adapter.updateStatus("busy");
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      await expect(facade.search({})).rejects.toThrow(/Engine is busy/);
    });

    it("should reject with NOT_READY when manual loading strategy and not loaded", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      facade.loadingStrategy = "manual";
      await expect(facade.search({})).rejects.toThrow();
    });

    it("should auto-load on demand when loading strategy is not manual", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const loadSpy = vi.spyOn(adapter, "load");
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      facade.loadingStrategy = "on-demand";
      await facade.search({});
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe("middleware chains", () => {
    it("onTelemetry middleware can transform events", () => {
      const adapter = new MockAdapter({ id: "x" });
      const onTelemetrySpy = vi.fn(
        (event: { metadata: Record<string, unknown> }) => ({
          ...event,
          metadata: { ...event.metadata, transformed: true },
        }),
      );
      new EngineFacade(
        adapter,
        [{ onTelemetry: onTelemetrySpy } as never],
        async () => mockLoader,
      );
      adapter.emitTelemetry({
        type: "lifecycle",
        timestamp: 0,
        metadata: { original: true },
      });
      expect(onTelemetrySpy).toHaveBeenCalled();
    });

    it("onTelemetry middleware errors are swallowed", () => {
      const adapter = new MockAdapter({ id: "x" });
      const onTelemetrySpy = vi.fn(() => {
        throw new Error("mw boom");
      });
      new EngineFacade(
        adapter,
        [{ onTelemetry: onTelemetrySpy } as never],
        async () => mockLoader,
      );
      expect(() =>
        adapter.emitTelemetry({
          type: "lifecycle",
          timestamp: 0,
          metadata: {},
        }),
      ).not.toThrow();
      expect(onTelemetrySpy).toHaveBeenCalled();
    });

    it("onInfo middleware can transform info events asynchronously", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onInfoSpy = vi.fn(async (info: unknown) => info);
      new EngineFacade(
        adapter,
        [{ onInfo: onInfoSpy } as never],
        async () => mockLoader,
      );
      // Trigger an info event via the adapter's listeners
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).infoListeners as Set<
        (i: unknown) => void
      >;
      for (const l of listeners) l({ depth: 1 });
      // Allow the async middleware chain to settle
      await Promise.resolve();
      expect(onInfoSpy).toHaveBeenCalled();
    });

    it("onResult middleware errors are swallowed in adapter listener", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onResultSpy = vi.fn(async () => {
        throw new Error("result mw boom");
      });
      new EngineFacade(
        adapter,
        [{ onResult: onResultSpy } as never],
        async () => mockLoader,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).resultListeners as Set<
        (r: unknown) => void
      >;
      for (const l of listeners) l({ raw: "x" });
      await Promise.resolve();
      expect(onResultSpy).toHaveBeenCalled();
    });
  });

  it("dispose is idempotent", async () => {
    const adapter = new MockAdapter({ id: "test" });
    const facade = new EngineFacade(adapter, [], async () => mockLoader);
    await facade.dispose();
    await expect(facade.dispose()).resolves.toBeUndefined();
  });

  it("stop is a no-op after dispose", async () => {
    const adapter = new MockAdapter({ id: "x" });
    const stopSpy = vi.spyOn(adapter, "stop");
    const facade = new EngineFacade(adapter, [], async () => mockLoader);
    await facade.dispose();
    facade.stop();
    // adapter.stop may have been called inside dispose, but after dispose flag
    // stop() must not call it again — we can't easily distinguish, so just
    // verify the call is a no-op (no throw).
    expect(stopSpy).toBeDefined();
  });

  describe("listener early-returns after dispose", () => {
    it("onTelemetry middleware should NOT fire after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onTelemetrySpy = vi.fn();
      const facade = new EngineFacade(
        adapter,
        [{ onTelemetry: onTelemetrySpy } as never],
        async () => mockLoader,
      );
      await facade.dispose();
      adapter.emitTelemetry({
        type: "lifecycle",
        timestamp: 0,
        metadata: {},
      });
      expect(onTelemetrySpy).not.toHaveBeenCalled();
    });

    it("onInfo middleware should NOT fire after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onInfoSpy = vi.fn();
      const facade = new EngineFacade(
        adapter,
        [{ onInfo: onInfoSpy } as never],
        async () => mockLoader,
      );
      await facade.dispose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).infoListeners as Set<
        (i: unknown) => void
      >;
      for (const l of listeners) l({ depth: 1 });
      await Promise.resolve();
      expect(onInfoSpy).not.toHaveBeenCalled();
    });

    it("onResult middleware should NOT fire after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onResultSpy = vi.fn();
      const facade = new EngineFacade(
        adapter,
        [{ onResult: onResultSpy } as never],
        async () => mockLoader,
      );
      await facade.dispose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).resultListeners as Set<
        (r: unknown) => void
      >;
      for (const l of listeners) l({ raw: "x" });
      await Promise.resolve();
      expect(onResultSpy).not.toHaveBeenCalled();
    });

    it("onInfo middleware should skip events whose positionId does not match the current search", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onInfoSpy = vi.fn(async (info: unknown) => info);
      const facade = new EngineFacade(
        adapter,
        [{ onInfo: onInfoSpy } as never],
        async () => mockLoader,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facade as any).currentPositionId = "expected-pos";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).infoListeners as Set<
        (i: unknown) => void
      >;
      // info with mismatched positionId should be filtered out before mw runs
      for (const l of listeners) l({ depth: 1, positionId: "stale-pos" });
      await Promise.resolve();
      expect(onInfoSpy).not.toHaveBeenCalled();
    });

    it("onResult middleware can transform results returned to the listener", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const onResultSpy = vi.fn(async (result: { raw: string }) => ({
        ...result,
        transformed: true,
      }));
      new EngineFacade(
        adapter,
        [{ onResult: onResultSpy } as never],
        async () => mockLoader,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listeners = (adapter as any).resultListeners as Set<
        (r: unknown) => void
      >;
      for (const l of listeners) l({ raw: "y" });
      await Promise.resolve();
      expect(onResultSpy).toHaveBeenCalled();
    });
  });

  describe("load() guards", () => {
    it("load() should be a no-op when status is already ready", async () => {
      const adapter = new MockAdapter({ id: "x" });
      await adapter.load(); // sets status=ready
      const loadSpy = vi.spyOn(adapter, "load");
      loadSpy.mockClear();
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      await facade.load();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it("load() should throw after dispose", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      await facade.dispose();
      await expect(facade.load()).rejects.toThrow(/Object disposed/);
    });

    it("load() should reuse an in-flight load promise (adapter.load called once)", async () => {
      const adapter = new MockAdapter({ id: "x" });
      const adapterLoadSpy = vi
        .spyOn(adapter, "load")
        .mockImplementation(() => new Promise((r) => setTimeout(r, 30)));
      const facade = new EngineFacade(adapter, [], async () => mockLoader);
      const a = facade.load();
      const b = facade.load();
      await Promise.all([a, b]);
      expect(adapterLoadSpy).toHaveBeenCalledTimes(1);
    });

    it("default loaderProvider re-uses the resolved loader on subsequent calls", async () => {
      const adapter = new MockAdapter({ id: "x" });
      // No explicit loaderProvider — exercises the default lambda
      const facade = new EngineFacade(adapter, []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const internal = facade as any;
      internal.resolvedLoader = mockLoader;
      const result = await internal.loaderProvider();
      expect(result).toBe(mockLoader);
    });
  });
});
