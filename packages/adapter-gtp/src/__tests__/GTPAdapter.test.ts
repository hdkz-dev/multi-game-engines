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
import { GTPAdapter, createGTPAdapter } from "../GTPAdapter.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg !== null &&
      typeof msg === "object" &&
      "type" in msg &&
      msg.type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: { type: "MG_RESOURCES_READY" } });
        }
      }, 0);
    } else if (typeof msg === "string" && msg === "version") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "= 1.0" });
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("GTPAdapter", () => {
  const config: IEngineConfig = {
    id: "test-gtp",
    adapter: "gtp",
    name: "Test GTP Engine",
    sources: {
      main: {
        url: "https://example.com/engine.js",
        __unsafeNoSRI: true,
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
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
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

  it("should initialize with config metadata", () => {
    const adapter = new GTPAdapter(config);
    expect(adapter.id).toBe("test-gtp");
    expect(adapter.name).toBe("Test GTP Engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new GTPAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should throw loaderRequired and set error status when no loader", async () => {
    const adapter = new GTPAdapter(config);
    await expect(adapter.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.loaderRequired" }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should throw missingMainEntryPoint when main resource is missing", async () => {
    const noMainLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({}),
    };
    const adapter = new GTPAdapter(config);
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
    const adapter = new GTPAdapter(config);
    await expect(
      adapter.load(failLoader as unknown as IEngineLoader),
    ).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should cleanup communicator when aborted during handshake", async () => {
    const controller = new AbortController();
    class AbortingMockWorker extends MockWorker {
      postMessage = vi.fn((msg: unknown) => {
        // MG_INJECT_RESOURCES handshake は完了させてから abort する
        if (
          msg !== null &&
          typeof msg === "object" &&
          "type" in msg &&
          (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
        ) {
          setTimeout(() => {
            if (typeof this.onmessage === "function") {
              this.onmessage({ data: { type: "MG_RESOURCES_READY" } });
            }
          }, 0);
        } else if (msg === "version") {
          controller.abort();
        }
      });
    }
    vi.stubGlobal("Worker", AbortingMockWorker);
    const adapter = new GTPAdapter(config);
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
    const adapter = new GTPAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    await (
      adapter as unknown as { onBookLoaded(url: string): Promise<void> }
    ).onBookLoaded("blob:book");
    expect(workerInstance).not.toBeNull();
    expect(workerInstance!.postMessage).toHaveBeenCalledWith(
      expect.stringContaining("BookFile"),
    );
  });

  it("createGTPAdapter factory returns a GTPAdapter instance", () => {
    const adapter = createGTPAdapter(config);
    expect(adapter).toBeInstanceOf(GTPAdapter);
    expect(adapter.id).toBe("test-gtp");
  });
});
