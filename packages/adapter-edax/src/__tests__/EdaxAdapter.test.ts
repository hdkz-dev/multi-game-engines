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
import { EdaxAdapter } from "../EdaxAdapter.js";
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

describe("EdaxAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "edax",
    adapter: "edax",
    sources: {
      main: {
        url: "http://localhost/edax.js",
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

  it("should initialize with correct metadata", () => {
    const adapter = new EdaxAdapter(mockConfig);
    expect(adapter.id).toBe("edax");
    expect(adapter.name).toBe("Edax");
  });

  it("should change status to loading then ready on load", async () => {
    const adapter = new EdaxAdapter(mockConfig);
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    await adapter.load(mockLoader);

    expect(statusSpy).toHaveBeenCalledWith("loading");
    expect(statusSpy).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });

  it("should throw loaderRequired and set error status when no loader", async () => {
    const adapter = new EdaxAdapter(mockConfig);
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
    const adapter = new EdaxAdapter(mockConfig);
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
    const adapter = new EdaxAdapter(mockConfig);
    await expect(adapter.load(failLoader)).rejects.toThrow();
    expect(adapter.status).toBe("error");
  });

  it("should cleanup communicator when ready status listener throws", async () => {
    const adapter = new EdaxAdapter(mockConfig);
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
    const adapter = new EdaxAdapter(mockConfig);
    await adapter.load(mockLoader);
    await (
      adapter as unknown as { onBookLoaded(url: string): Promise<void> }
    ).onBookLoaded("blob:book");
    expect(workerInstance).not.toBeNull();
    expect(workerInstance!.postMessage).toHaveBeenCalledWith(
      expect.stringContaining("BookFile"),
    );
  });
});
