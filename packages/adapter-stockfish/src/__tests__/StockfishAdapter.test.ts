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
    } else if (msg === "uci") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "uciok" });
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("StockfishAdapter", () => {
  let mockLoader: IEngineLoader;

  beforeAll(() => {
    vi.useFakeTimers({ now: 0 });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("Worker", MockWorker);
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:mock"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("should initialize with correct metadata", () => {
    const adapter = new StockfishAdapter();
    expect(adapter.id).toBe("stockfish");
  });

  it("should change status correctly on load", async () => {
    const adapter = new StockfishAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.runAllTimersAsync();
    await loadPromise;
    expect(adapter.status).toBe("ready");
  });

  it("should handle UCI bestmove (none) without throwing", async () => {
    // Custom MockWorker that returns (none)
    class NoneWorker extends MockWorker {
      constructor() {
        super();
        const originalPostMessage = this.postMessage;
        this.postMessage = vi.fn((msg: unknown) => {
          originalPostMessage(msg);
          if (msg === "go depth 10") {
            setTimeout(() => {
              if (typeof this.onmessage === "function") {
                this.onmessage({ data: "bestmove (none)" });
              }
            }, 0);
          }
        });
      }
    }
    vi.stubGlobal("Worker", NoneWorker);

    const adapter = new StockfishAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.runAllTimersAsync();
    await loadPromise;

    const searchPromise = adapter.search({
      fen: createFEN("startpos"),
      depth: 10,
    });
    await vi.runAllTimersAsync();
    const result = await searchPromise;
    expect(result.bestMove).toBeNull();
  });

  it("should reject position strings containing control characters", async () => {
    const adapter = new StockfishAdapter();
    const loadPromise = adapter.load(mockLoader);
    await vi.runAllTimersAsync();
    await loadPromise;

    // Top-level key injection
    await expect(
      adapter.search({
        fen: createFEN("startpos"),
        // Testing injection via custom field due to index signature
        "evil\nkey": "data",
      }),
    ).rejects.toThrow(/Potential command injection/);

    // Value injection
    await expect(
      adapter.search({
        fen: createFEN("startpos"),
        depth: 10,
        extra: "evil\rvalue",
      }),
    ).rejects.toThrow(/Potential command injection/);

    // Nested object injection
    await expect(
      adapter.search({
        fen: createFEN("startpos"),
        options: { "nested\nkey": "value" },
      }),
    ).rejects.toThrow(/Potential command injection/);
  });
});
