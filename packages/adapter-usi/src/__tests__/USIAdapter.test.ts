import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { USIAdapter } from "../USIAdapter.js";
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
    } else if (msg === "usi") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "id name TestEngine" });
          this.onmessage({ data: "usiok" });
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("USIAdapter", () => {
  const config: IEngineConfig = {
    id: "test-engine",
    adapter: "usi",
    sources: {
      main: {
        url: "engine.js",
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

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    mockLoader.loadResource.mockClear();
    mockLoader.loadResources.mockClear();
    mockLoader.revoke.mockClear();
    mockLoader.revokeAll.mockClear();
    mockLoader.revokeByEngineId.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should initialize with config", () => {
    const adapter = new USIAdapter(config);
    expect(adapter.id).toBe("test-engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new USIAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should throw EngineError if loader is missing", async () => {
    const adapter = new USIAdapter(config);
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
    const adapter = new USIAdapter(config);
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
    const adapter = new USIAdapter(config);
    await expect(
      adapter.load(failLoader as unknown as IEngineLoader),
    ).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should cleanup communicator when aborted during handshake", async () => {
    const controller = new AbortController();
    class AbortingMockWorker extends MockWorker {
      postMessage = vi.fn((msg: unknown) => {
        if (msg === "usi") controller.abort();
      });
    }
    vi.stubGlobal("Worker", AbortingMockWorker);
    const adapter = new USIAdapter(config);
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
    const adapter = new USIAdapter(config);
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
