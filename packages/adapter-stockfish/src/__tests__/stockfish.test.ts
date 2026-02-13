import { describe, it, expect, vi, beforeEach } from "vitest";
import { StockfishAdapter } from "../stockfish.js";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("StockfishAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with correct metadata", () => {
    const adapter = new StockfishAdapter();
    expect(adapter.id).toBe("stockfish");
  });

  it("should change status correctly on load", async () => {
    const adapter = new StockfishAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
