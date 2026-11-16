import { describe, it, expect, vi, afterEach } from "vitest";
import type { IEngineLoader } from "@multi-game-engines/core";
import { UCIAdapter } from "../UCIAdapter.js";

describe("worker ownership after a failed transport", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("terminates the failed worker before reload and owns the replacement until disposal", async () => {
    const workers: TestWorker[] = [];
    class TestWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: ((event: { message: string }) => void) | null = null;
      terminate = vi.fn();
      constructor() {
        workers.push(this);
      }
      postMessage(message: unknown): void {
        if (message === "uci")
          queueMicrotask(() => this.onmessage?.({ data: "uciok" }));
      }
    }
    vi.stubGlobal("Worker", TestWorker);
    const loader: IEngineLoader = {
      loadResource: vi.fn(),
      loadResources: vi
        .fn()
        .mockResolvedValue({ main: "blob:verified-fixture" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
    const adapter = new UCIAdapter({
      id: "reload-test",
      sources: {
        main: {
          url: "https://example.com/engine.js",
          type: "worker-js",
          __unsafeNoSRI: true,
        },
      },
    });
    await adapter.load(loader);
    workers[0]!.onerror?.({ message: "worker failed" });
    expect(() => adapter.searchRaw(["go depth 1"])).toThrow("worker failed");
    expect(adapter.status).toBe("error");
    await adapter.load(loader);
    expect(workers).toHaveLength(2);
    expect(workers[0]!.terminate).toHaveBeenCalledTimes(1);
    expect(workers[1]!.terminate).not.toHaveBeenCalled();
    expect(adapter.status).toBe("ready");
    await adapter.dispose();
    expect(workers[0]!.terminate).toHaveBeenCalledTimes(1);
    expect(workers[1]!.terminate).toHaveBeenCalledTimes(1);
    expect(adapter.status).toBe("terminated");
  });
});
