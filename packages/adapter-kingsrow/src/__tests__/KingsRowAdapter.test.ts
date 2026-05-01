import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  KingsRowAdapter,
  createKingsRowAdapter,
  RapidDraughtsAdapter,
} from "../KingsRowAdapter.js";
import type { IEngineConfig } from "@multi-game-engines/core";

// rapid-draughts is a real npm dep — no mocking needed for unit tests.
// We do not need a Worker or a loader because rapid-draughts is bundled.

describe("KingsRowAdapter (rapid-draughts backend)", () => {
  const minimalConfig: IEngineConfig = {
    id: "kingsrow",
    adapter: "kingsrow",
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should be instantiated without a source URL", () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe("kingsrow");
    expect(adapter.status).toBe("uninitialized");
  });

  it("createKingsRowAdapter factory returns a KingsRowAdapter", () => {
    const adapter = createKingsRowAdapter(minimalConfig);
    expect(adapter).toBeInstanceOf(KingsRowAdapter);
    expect(adapter.id).toBe("kingsrow");
  });

  it("RapidDraughtsAdapter is an alias for KingsRowAdapter", () => {
    expect(RapidDraughtsAdapter).toBe(KingsRowAdapter);
  });

  it("load() sets status to ready (no Worker/loader needed)", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });

  it("load() can be called without any arguments", async () => {
    const adapter = new KingsRowAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });

  it("search() returns a bestMove in standard notation from starting position", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    const result = await adapter.search({
      board: "startpos" as Parameters<typeof adapter.search>[0]["board"],
    });
    expect(result).toBeDefined();
    // bestMove is either null (game over) or a "11-15" style string
    if (result.bestMove !== null) {
      expect(result.bestMove).toMatch(/^\d+-\d+$/);
    }
  }, 15_000 /* alpha-beta may take a few seconds at default depth */);

  it("search() with depth=1 is fast", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    const result = await adapter.search({
      board: "startpos" as Parameters<typeof adapter.search>[0]["board"],
      depth: 1,
    });
    expect(result).toBeDefined();
  });

  it("stop() does not throw when not busy", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    await expect(adapter.stop()).resolves.toBeUndefined();
  });

  it("dispose() sets status to terminated", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    await adapter.dispose();
    expect(adapter.status).toBe("terminated");
  });

  it("onStatusChange() emits loading → ready during load", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    const statuses: string[] = [];
    adapter.onStatusChange((s) => statuses.push(s));
    await adapter.load();
    expect(statuses).toContain("loading");
    expect(statuses).toContain("ready");
  });

  it("onSearchResult() listener is called after search", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    const results: unknown[] = [];
    adapter.onSearchResult((r) => results.push(r));
    await adapter.search({
      board: "startpos" as Parameters<typeof adapter.search>[0]["board"],
      depth: 1,
    });
    expect(results).toHaveLength(1);
  });

  it("applyMove() does not throw for a legal move string", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await adapter.load();
    // Opening position has moves like 11-15, 11-16, etc.
    expect(() => adapter.applyMove("11-15")).not.toThrow();
  });

  it("search() throws NOT_READY when called before load", async () => {
    const adapter = new KingsRowAdapter(minimalConfig);
    await expect(
      adapter.search({
        board: "startpos" as Parameters<typeof adapter.search>[0]["board"],
      }),
    ).rejects.toMatchObject({ code: "NOT_READY" });
  });
});
