import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { USIAdapter } from "../USIAdapter.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg &&
      typeof msg === "object" &&
      (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: { type: "MG_RESOURCES_READY" } });
        }
      }, 0);
    }
    // 2026: ハンドシェイク対応
    if (msg === "usi") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
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
    id: "test-usi",
    adapter: "usi",
    name: "Test USI Engine",
    sources: {
      main: {
        url: "https://example.com/engine.js",
        __unsafeNoSRI: true,
        type: "worker-js",
      },
    },
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
  });

  it("should initialize with config metadata", () => {
    const adapter = new USIAdapter(config);
    expect(adapter.id).toBe("test-usi");
    expect(adapter.name).toBe("Test USI Engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new USIAdapter(config);
    const statusChanges: string[] = [];
    adapter.onStatusChange((s) => statusChanges.push(s));

    await adapter.load();

    expect(statusChanges).toContain("loading");
    expect(statusChanges).toContain("ready");
    expect(adapter.status).toBe("ready");
  });

  it("should inject resources if mountPath is specified", async () => {
    const configWithWasm: IEngineConfig = {
      ...config,
      sources: {
        ...config.sources,
        wasm: {
          url: "https://example.com/engine.wasm",
          mountPath: "/engine.wasm",
          type: "binary",
          __unsafeNoSRI: true,
        },
      },
    };
    const adapter = new USIAdapter(configWithWasm);
    const mockLoader = {
      loadResources: vi.fn().mockResolvedValue({
        main: "blob:main",
        wasm: "blob:wasm",
      }),
    };

    await adapter.load(mockLoader as unknown as IEngineLoader);

    expect(mockLoader.loadResources).toHaveBeenCalled();
    expect(adapter.status).toBe("ready");
  });

  it("should throw EngineError if main resource is missing", async () => {
    const adapter = new USIAdapter(config);
    const mockLoader = {
      loadResources: vi.fn().mockResolvedValue({}),
    };

    await expect(
      adapter.load(mockLoader as unknown as IEngineLoader),
    ).rejects.toThrow(/Missing main entry point URL/);
    expect(adapter.status).toBe("error");
  });

  it("should throw EngineError on handshake timeout", async () => {
    // Override MockWorker for this test to NOT respond with usiok
    vi.stubGlobal(
      "Worker",
      class extends MockWorker {
        override postMessage = vi.fn((msg) => {
          if (msg === "usi") {
            // Do nothing, trigger timeout
          }
        });
      },
    );

    const adapter = new USIAdapter(config);
    // Speed up vitest timers
    vi.useFakeTimers();

    const loadPromise = adapter.load();

    // Advance 10s and check rejection
    const advance = vi.advanceTimersByTimeAsync(11000);

    await expect(Promise.all([loadPromise, advance])).rejects.toThrow();
    expect(adapter.status).toBe("error");

    vi.useRealTimers();
  });
});
