import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { KingsRowAdapter, createKingsRowAdapter } from "../KingsRowAdapter.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg !== null &&
      typeof msg === "object" &&
      "type" in msg &&
      (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({
            data: { type: "MG_RESOURCES_READY" },
          } as MessageEvent);
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: unknown = null;
}

describe("KingsRowAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "kingsrow",
    adapter: "kingsrow",
    sources: {
      main: {
        url: "http://localhost/kingsrow.js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        type: "worker-js",
      },
    },
  };

  const mockLoader: IEngineLoader = {
    loadResource: vi.fn().mockResolvedValue("blob:http://localhost/main"),
    loadResources: vi
      .fn()
      .mockResolvedValue({ main: "blob:http://localhost/main" }),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
    revokeByEngineId: vi.fn(),
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
    (mockLoader.loadResource as ReturnType<typeof vi.fn>).mockClear();
    (mockLoader.loadResources as ReturnType<typeof vi.fn>).mockClear();
    (mockLoader.revoke as ReturnType<typeof vi.fn>).mockClear();
    (mockLoader.revokeAll as ReturnType<typeof vi.fn>).mockClear();
    (mockLoader.revokeByEngineId as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should load successfully when source has mountPath (injectResources path)", async () => {
    const configWithMount: IEngineConfig = {
      ...mockConfig,
      sources: {
        ...mockConfig.sources,
        book: {
          url: "book.bin",
          sri: "sha384-ValidBookSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          type: "binary",
          mountPath: "/book.bin",
        },
      } as IEngineConfig["sources"],
    };
    const loaderWithBook = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({
        main: "blob:http://localhost/main",
        book: "blob:book",
      }),
    };
    const adapter = new KingsRowAdapter(configWithMount);
    await adapter.load(loaderWithBook);
    expect(adapter.status).toBe("ready");
  });

  it("should be instantiated", () => {
    const adapter = new KingsRowAdapter(mockConfig);
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe("kingsrow");
  });

  it("should change status to ready on load", async () => {
    const adapter = new KingsRowAdapter(mockConfig);
    await adapter.load(mockLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should throw loaderRequired and set error status when no loader", async () => {
    const adapter = new KingsRowAdapter(mockConfig);
    await expect(adapter.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.loaderRequired" }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should throw missingMainEntryPoint when main resource is missing", async () => {
    const noMainLoader: IEngineLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({}),
    };
    const adapter = new KingsRowAdapter(mockConfig);
    await expect(adapter.load(noMainLoader)).rejects.toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.missingMainEntryPoint",
      }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should set error status when loader rejects", async () => {
    const failLoader: IEngineLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockRejectedValue(new Error("network error")),
    };
    const adapter = new KingsRowAdapter(mockConfig);
    await expect(adapter.load(failLoader)).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should cleanup communicator when ready status listener throws", async () => {
    const adapter = new KingsRowAdapter(mockConfig);
    adapter.onStatusChange((status) => {
      if (status === "ready") throw new Error("listener error");
    });
    await expect(adapter.load(mockLoader)).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should call setOption BookFile via onBookLoaded after successful load", async () => {
    let workerInstance: InstanceType<typeof MockWorker> | null = null;
    class CaptureMockWorker extends MockWorker {
      constructor(...args: ConstructorParameters<typeof MockWorker>) {
        super(...args);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        workerInstance = this;
      }
    }
    vi.stubGlobal("Worker", CaptureMockWorker);
    const adapter = new KingsRowAdapter(mockConfig);
    await adapter.load(mockLoader);
    await (
      adapter as unknown as { onBookLoaded(url: string): Promise<void> }
    ).onBookLoaded("blob:book");
    expect(workerInstance).not.toBeNull();
    expect(workerInstance!.postMessage).toHaveBeenCalledWith(
      expect.stringContaining("BookFile"),
    );
  });

  it("createKingsRowAdapter factory returns a KingsRowAdapter instance", () => {
    const adapter = createKingsRowAdapter(mockConfig);
    expect(adapter).toBeInstanceOf(KingsRowAdapter);
    expect(adapter.id).toBe("kingsrow");
  });
});
