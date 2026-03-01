import { describe, it, expect } from "vitest";
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
