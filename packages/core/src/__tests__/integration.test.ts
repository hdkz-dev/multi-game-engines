import { describe, it, expect, beforeEach } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge.js";
import { MemoryStorage } from "../storage/MemoryStorage.js";
import { createPositionId } from "../index.js";
import { PositionId } from "../types.js";

describe("Core Integration", () => {
  let bridge: EngineBridge;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    bridge = new EngineBridge({ storage });
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

    await bridge.dispose();
    expect(engine.status).toBe("terminated");
  });

  it("should handle global middlewares across engines", async () => {
    const log: string[] = [];
    bridge.use({
      id: "logger",
      onCommand: async (cmd) => {
        log.push(String(cmd));
        return cmd;
      },
    });

    const e1 = await bridge.getEngine({ id: "e1", adapter: "mock" });
    const e2 = await bridge.getEngine({ id: "e2", adapter: "mock" });

    await e1.search({});
    await e2.search({});

    expect(log).toHaveLength(2);
    expect(log).toContain("go");
  });
});
