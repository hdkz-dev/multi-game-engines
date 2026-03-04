import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { StockfishAdapter } from "../StockfishAdapter.js";
import { IEngineLoader } from "@multi-game-engines/core";
import { createFEN } from "@multi-game-engines/domain-chess";

describe("StockfishAdapter", () => {
  let mockLoader: IEngineLoader;
  const mockConfig = {
    sources: {
      main: {
        url: "stockfish.js",
        __unsafeNoSRI: true as const,
        type: "worker-js" as const,
      },
    },
  };

  beforeAll(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:mock"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("should initialize with correct metadata", () => {
    const adapter = new StockfishAdapter(mockConfig);
    expect(adapter.id).toBe("stockfish");
  });

  it("should change status correctly on load", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        onmessage: ((ev: { data: unknown }) => void) | null = null;
        postMessage(msg: unknown) {
          const onmessage = this.onmessage;
          // 2026 Best Practice: Use microtask to ensure reliable async response.
          // This avoids race conditions between expectation registration and delivery.
          queueMicrotask(() => {
            if (msg === "uci") {
              onmessage?.({ data: "uciok" });
            } else if (msg === "isready") {
              onmessage?.({ data: "readyok" });
            }
          });
        }
        terminate() {}
      },
    );

    const adapter = new StockfishAdapter(mockConfig);
    await adapter.load(mockLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should handle UCI bestmove (none) without throwing", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        onmessage: ((ev: { data: unknown }) => void) | null = null;
        postMessage(msg: unknown) {
          const onmessage = this.onmessage;
          // console.log(`[MockWorker] Received: ${JSON.stringify(msg)}`);

          setTimeout(() => {
            if (msg === "uci") {
              // console.log("[MockWorker] Sending: uciok");
              onmessage?.({ data: "uciok" });
            } else if (msg === "isready") {
              // console.log("[MockWorker] Sending: readyok");
              onmessage?.({ data: "readyok" });
            } else if (
              Array.isArray(msg) &&
              msg.some((m) => typeof m === "string" && m.startsWith("go"))
            ) {
              // console.log("[MockWorker] Sending: bestmove (none)");
              onmessage?.({ data: "bestmove (none)" });
            } else if (typeof msg === "string" && msg.startsWith("go")) {
              // console.log("[MockWorker] Sending: bestmove (none)");
              onmessage?.({ data: "bestmove (none)" });
            }
          }, 0);
        }
        terminate() {}
      },
    );

    const adapter = new StockfishAdapter(mockConfig);
    await adapter.load(mockLoader);

    const result = await adapter.search({
      fen: createFEN("startpos"),
      depth: 10,
    });
    expect(result.bestMove).toBeNull();
  });
});
