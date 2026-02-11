import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StockfishAdapter } from "../stockfish.js";
import { IEngineLoader } from "@multi-game-engines/core";

describe("StockfishAdapter", () => {
  let adapter: StockfishAdapter;
  let mockLoader: IEngineLoader;
  let currentMockWorker: MockWorker | null = null;

  class MockWorker implements Worker {
    onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => unknown) | null = null;
    onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    
    postMessage = vi.fn((msg: unknown) => {
      // Simulate engine response
      if (msg === "uci") {
        setTimeout(() => this.triggerMessage("uciok"), 10);
      } else if (typeof msg === "string" && msg.startsWith("position")) {
        // Prepare for search, no immediate response needed usually
      } else if (typeof msg === "string" && msg.startsWith("go")) {
        setTimeout(() => this.triggerMessage("info depth 1 score cp 10"), 10);
        setTimeout(() => this.triggerMessage("bestmove e2e4"), 20);
      } else if (msg === "stop") {
        // handled in logic
      }
    });

    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn().mockReturnValue(true);

    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      currentMockWorker = this;
    }

    triggerMessage(data: unknown) {
      if (this.onmessage) {
        this.onmessage({ data } as MessageEvent);
      }
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", MockWorker);
    
    adapter = new StockfishAdapter();
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:mock-url"),
      revoke: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should have correct metadata", () => {
    expect(adapter.id).toBe("stockfish");
    expect(adapter.name).toBe("Stockfish");
    expect(adapter.license.name).toBe("GPL-3.0-only");
  });

  it("should initialize correctly with load()", async () => {
    await adapter.load(mockLoader);
    
    expect(mockLoader.loadResource).toHaveBeenCalledWith("stockfish", adapter.sources.main);
    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("uci");
    expect(adapter.status).toBe("ready");
  });

  it("should perform search correctly", async () => {
    await adapter.load(mockLoader);

    const task = adapter.searchRaw("go depth 1");
    
    // Verify info stream
    const infoReader = task.info[Symbol.asyncIterator]();
    const firstInfo = await infoReader.next();
    expect(firstInfo.value).toMatchObject({ depth: 1, score: 10 });

    // Verify result
    const result = await task.result;
    expect(result.bestMove).toBe("e2e4");
  });

  it("should stop search correctly", async () => {
    await adapter.load(mockLoader);

    const task = adapter.searchRaw("go depth 100");
    await adapter.stop();

    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("stop");
    await expect(task.result).rejects.toThrow("Search aborted");
  });

  it("should dispose resources correctly", async () => {
    await adapter.load(mockLoader);
    await adapter.dispose();

    expect(currentMockWorker?.terminate).toHaveBeenCalled();
    expect(mockLoader.revoke).toHaveBeenCalledWith("blob:mock-url");
    expect(adapter.status).toBe("terminated");
  });
});
