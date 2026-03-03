import { describe, it, expect, beforeEach } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge.js";
import { MockAdapter } from "../mocks/MockAdapter.js";
import { createPositionId } from "../index.js";

describe("Core Integration", () => {
  let bridge: EngineBridge;

  beforeEach(() => {
    bridge = new EngineBridge();
    // 明示的に mock アダプターを登録
    bridge.registerAdapterFactory("mock", (config) => {
      return new MockAdapter(config);
    });
  });

  it("should perform a full lifecycle from bridge to search", async () => {
    const engine = await bridge.getEngine({
      id: "test-engine",
      adapter: "mock",
    });

    await engine.load();
    expect(engine.status).toBe("ready");

    const result = await engine.search({
      positionId: createPositionId("pos1"),
    });

    expect(result.bestMove).toBeDefined();
    expect(engine.status).toBe("ready");
  });

  it("should handle global middlewares across engines", async () => {
    const log: string[] = [];
    bridge.use({
      id: "logger",
      onSearch: async (options) => {
        log.push(`search:${options.positionId}`);
        return options;
      },
    });

    const engine = await bridge.getEngine({ id: "e1", adapter: "mock" });
    await engine.load();
    await engine.search({ positionId: createPositionId("pos2") });

    expect(log).toContain("search:pos2");
  });
});
