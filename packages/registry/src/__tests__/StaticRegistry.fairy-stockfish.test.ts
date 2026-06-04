import { describe, it, expect } from "vitest";
import { StaticRegistry } from "../index.js";

describe("StaticRegistry fairy-stockfish entries", () => {
  it("resolves Fairy-Stockfish chess sources", () => {
    const registry = new StaticRegistry();
    const sources = registry.resolve("fairy-stockfish");

    expect(sources).not.toBeNull();
    expect(sources?.["main"]?.url).toContain("fairy-stockfish-nnue.wasm");
    expect(sources?.["main"]?.type).toBe("worker-js");
    expect(sources?.["wasm"]?.type).toBe("wasm");
  });

  it("resolves Fairy-Stockfish shogi sources", () => {
    const registry = new StaticRegistry();
    const sources = registry.resolve("fairy-stockfish-shogi");

    expect(sources).not.toBeNull();
    expect(sources?.["main"]?.url).toContain("fairy-stockfish-nnue.wasm");
    expect(sources?.["main"]?.type).toBe("worker-js");
    expect(sources?.["wasm"]?.type).toBe("wasm");
  });
});
