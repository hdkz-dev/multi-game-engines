import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnvironmentDiagnostics } from "../EnvironmentDiagnostics.js";

describe("EnvironmentDiagnostics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should report basic environment info", async () => {
    vi.stubGlobal("navigator", {
      userAgent: "TestAgent",
      hardwareConcurrency: 4,
      deviceMemory: 4,
    });

    const info = await EnvironmentDiagnostics.getReport();
    expect(info.browser).toBeDefined();
    expect(info.capabilities).toBeDefined();
  });

  it("should detect high-resolution timer support", () => {
    expect(EnvironmentDiagnostics.hasHighResTimer()).toBe(
      typeof performance !== "undefined",
    );
  });

  it("should warn if suboptimal", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("crossOriginIsolated", false);

    EnvironmentDiagnostics.warnIfSuboptimal();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
