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
import { JanggiAdapter } from "../JanggiAdapter.js";
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
    } else if (msg === "ujci") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "id name TestJanggi" } as MessageEvent);
          this.onmessage({ data: "ujciok" } as MessageEvent);
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: unknown = null;
}

describe("JanggiAdapter", () => {
  const config: IEngineConfig = {
    id: "custom-jg",
    name: "Custom Janggi",
    adapter: "janggi",
    sources: {
      main: {
        url: "janggi.js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        type: "worker-js",
      },
    },
  };

  const mockLoader = {
    loadResource: vi.fn().mockResolvedValue("blob:mock"),
    loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
    revokeByEngineId: vi.fn(),
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
    mockLoader.loadResource.mockClear();
    mockLoader.loadResources.mockClear();
    mockLoader.revoke.mockClear();
    mockLoader.revokeAll.mockClear();
    mockLoader.revokeByEngineId.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should have correct id and name", () => {
    const adapter = new JanggiAdapter({
      id: "custom-jg",
      name: "Custom Janggi",
    });
    expect(adapter.id).toBe("custom-jg");
    expect(adapter.name).toBe("Custom Janggi");
  });

  it("should load successfully when source has mountPath (injectResources path)", async () => {
    const configWithMount: IEngineConfig = {
      ...config,
      sources: {
        ...config.sources,
        book: {
          url: "book.bin",
          __unsafeNoSRI: true,
          type: "binary",
          mountPath: "/book.bin",
        },
      } as IEngineConfig["sources"],
    };
    const loaderWithBook = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({
        main: "blob:mock",
        book: "blob:book",
      }),
    };
    const adapter = new JanggiAdapter(configWithMount);
    await adapter.load(loaderWithBook as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should change status to ready on successful load with ujciok handshake", async () => {
    const adapter = new JanggiAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should emit loading then ready status", async () => {
    const adapter = new JanggiAdapter(config);
    const statuses: string[] = [];
    adapter.onStatusChange((s) => statuses.push(s));
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(statuses).toEqual(["loading", "ready"]);
  });

  it("should throw loaderRequired when no loader provided", async () => {
    const adapter = new JanggiAdapter(config);
    await expect(adapter.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.loaderRequired" }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should throw missingMainEntryPoint and set error status when main resource is missing", async () => {
    const noMainLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({}),
    };
    const adapter = new JanggiAdapter(config);
    await expect(
      adapter.load(noMainLoader as unknown as IEngineLoader),
    ).rejects.toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.missingMainEntryPoint",
      }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should set error status when loader rejects", async () => {
    const failLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockRejectedValue(new Error("network error")),
    };
    const adapter = new JanggiAdapter(config);
    await expect(
      adapter.load(failLoader as unknown as IEngineLoader),
    ).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should cleanup communicator when aborted during handshake", async () => {
    const controller = new AbortController();
    class AbortingMockWorker extends MockWorker {
      postMessage = vi.fn((msg: unknown) => {
        if (msg === "ujci") controller.abort();
      });
    }
    vi.stubGlobal("Worker", AbortingMockWorker);
    const adapter = new JanggiAdapter(config);
    await expect(
      adapter.load(mockLoader as unknown as IEngineLoader, controller.signal),
    ).rejects.toThrow();
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
    const adapter = new JanggiAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    await (
      adapter as unknown as { onBookLoaded(url: string): Promise<void> }
    ).onBookLoaded("blob:book");
    expect(workerInstance).not.toBeNull();
    expect(workerInstance!.postMessage).toHaveBeenCalledWith(
      expect.stringContaining("BookFile"),
    );
  });
});
