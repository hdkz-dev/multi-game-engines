import { describe, it, expect, vi, afterEach } from "vitest";
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

  it("should NOT warn when cross-origin isolated", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("crossOriginIsolated", true);

    EnvironmentDiagnostics.warnIfSuboptimal();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should report 'unknown' browser when navigator is undefined", async () => {
    vi.stubGlobal("navigator", undefined);
    const info = await EnvironmentDiagnostics.getReport();
    expect(info.browser).toBe("unknown");
  });

  it("should mark COOP/COEP headers as missing when not isolated", () => {
    vi.stubGlobal("crossOriginIsolated", false);
    const status = EnvironmentDiagnostics.getSecurityStatus();
    expect(status.coopCoepEnabled).toBe(false);
    expect(status.canUseThreads).toBe(false);
    expect(status.missingHeaders).toEqual([
      "Cross-Origin-Opener-Policy: same-origin",
      "Cross-Origin-Embedder-Policy: require-corp",
    ]);
  });

  it("should not list missing headers when cross-origin isolated", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const status = EnvironmentDiagnostics.getSecurityStatus();
    expect(status.coopCoepEnabled).toBe(true);
    expect(status.missingHeaders).toBeUndefined();
  });

  it("should treat crossOriginIsolated as false when the global is undefined", () => {
    vi.stubGlobal("crossOriginIsolated", undefined);
    const status = EnvironmentDiagnostics.getSecurityStatus();
    expect(status.coopCoepEnabled).toBe(false);
    expect(status.isCrossOriginIsolated).toBe(false);
  });

  it("should set canUseThreads false when SharedArrayBuffer is missing", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    vi.stubGlobal("SharedArrayBuffer", undefined);
    expect(EnvironmentDiagnostics.getSecurityStatus().canUseThreads).toBe(
      false,
    );
  });

  it("should report sriSupported false when document is unavailable", () => {
    vi.stubGlobal("document", undefined);
    expect(EnvironmentDiagnostics.getSecurityStatus().sriSupported).toBe(false);
  });

  it("hasHighResTimer should be false when performance is unavailable", () => {
    vi.stubGlobal("performance", undefined);
    expect(EnvironmentDiagnostics.hasHighResTimer()).toBe(false);
  });
});
