import { describe, it, expect, vi } from "vitest";
import { MockAdapter } from "../MockAdapter.js";
import { IEngineLoader } from "../../types.js";

describe("MockAdapter", () => {
  it("should initialize and load correctly", async () => {
    const adapter = new MockAdapter({ id: "test", name: "Mock" });
    expect(adapter.id).toBe("test");
    expect(adapter.status).toBe("uninitialized");

    await adapter.load({} as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should return mock search results and info", async () => {
    const adapter = new MockAdapter();
    await adapter.load();

    const task = adapter.searchRaw("go");
    expect(adapter.status).toBe("busy");

    const result = await task.result;
    expect(result.bestMove).toBeDefined();
    expect(adapter.status).toBe("ready");

    const infoList = [];
    for await (const info of task.info) {
      infoList.push(info);
    }
    expect(infoList.length).toBeGreaterThan(0);
  });

  it("should handle stop", async () => {
    const adapter = new MockAdapter();
    await adapter.stop();
    expect(adapter.status).toBe("ready");
  });

  it("should reject pending search when stop is called mid-search", async () => {
    const adapter = new MockAdapter();
    await adapter.load();

    const task = adapter.searchRaw("go");
    const resultPromise = task.result;

    await adapter.stop();
    await expect(resultPromise).rejects.toThrow();
  });

  it("should notify onStatusChange listeners", async () => {
    const adapter = new MockAdapter();
    const statuses: string[] = [];
    adapter.onStatusChange((s) => statuses.push(s));
    await adapter.load();
    expect(statuses).toContain("loading");
    expect(statuses).toContain("ready");
  });

  it("should notify onProgress listeners via onProgress override", () => {
    const adapter = new MockAdapter();
    const listener = vi.fn();
    const cleanup = adapter.onProgress(listener);
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("should handle parser methods", () => {
    const adapter = new MockAdapter();
    const parser = adapter.parser;
    expect(parser.createSearchCommand({})).toBe("go");
    expect(parser.createStopCommand()).toBe("stop");
    expect(parser.createOptionCommand("a", "b")).toBe("setoption");
    expect(parser.parseInfo("info")).toMatchObject({ raw: "info" });
    expect(parser.parseResult("bestmove")).toMatchObject({ bestMove: "e2e4" });
  });
});
