import { describe, it, expect, vi } from "vitest";
import { MonitorRegistry } from "../MonitorRegistry.js";
import { IEngine } from "@multi-game-engines/core";

describe("MonitorRegistry", () => {
  const mockEngine = {
    id: "test",
    status: "ready",
    onInfo: vi.fn(() => () => {}),
    onStatusChange: vi.fn(() => () => {}),
  } as unknown as IEngine;

  it("should return the same monitor instance for the same engine", () => {
    const registry = MonitorRegistry.getInstance();
    const monitor1 = registry.getOrCreateMonitor(
      mockEngine,
      "startpos",
      (s) => s,
    );
    const monitor2 = registry.getOrCreateMonitor(
      mockEngine,
      "startpos",
      (s) => s,
    );

    expect(monitor1).toBe(monitor2);
  });

  it("should return different monitors for different engines", () => {
    const registry = MonitorRegistry.getInstance();
    const mockEngine2 = { id: "test2" } as unknown as IEngine;

    const monitor1 = registry.getOrCreateMonitor(
      mockEngine,
      "startpos",
      (s) => s,
    );
    const monitor2 = registry.getOrCreateMonitor(
      mockEngine2,
      "startpos",
      (s) => s,
    );

    expect(monitor1).not.toBe(monitor2);
  });
});
