import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FairyStockfishShogiAdapter } from "../FairyStockfishShogiAdapter.js";
import { createFairyStockfishShogiEngine } from "../index.js";
import type { IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg !== null &&
      typeof msg === "object" &&
      "type" in msg &&
      msg.type === "MG_INJECT_RESOURCES"
    ) {
      queueMicrotask(() => {
        this.onmessage?.({ data: { type: "MG_RESOURCES_READY" } });
      });
    } else if (msg === "usi") {
      queueMicrotask(() => {
        this.onmessage?.({ data: "id name Fairy-Stockfish Shogi" });
        this.onmessage?.({ data: "usiok" });
      });
    }
  });
  terminate = vi.fn();
}

describe("FairyStockfishShogiAdapter", () => {
  const mockConfig = {
    sources: {
      main: {
        url: "stockfish.js",
        __unsafeNoSRI: true as const,
        type: "worker-js" as const,
      },
    },
  };

  const mockLoader: IEngineLoader = {
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("initializes with Fairy-Stockfish Shogi metadata", () => {
    const adapter = new FairyStockfishShogiAdapter(mockConfig);
    expect(adapter.id).toBe("fairy-stockfish-shogi");
  });

  it("creates an engine facade through the factory", () => {
    const engine = createFairyStockfishShogiEngine({
      sources: mockConfig.sources,
    });
    expect(engine).toBeDefined();
  });

  it("reaches ready status on USI handshake", async () => {
    const adapter = new FairyStockfishShogiAdapter(mockConfig);
    await adapter.load(mockLoader);
    expect(adapter.status).toBe("ready");
  });
});
