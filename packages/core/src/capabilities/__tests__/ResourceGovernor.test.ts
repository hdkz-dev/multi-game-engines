import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResourceGovernor } from "../ResourceGovernor.js";
import { EnvironmentDetector } from "../EnvironmentDetector.js";
import { SecurityAdvisor } from "../SecurityAdvisor.js";

describe("ResourceGovernor", () => {
  beforeEach(() => {
    vi.spyOn(EnvironmentDetector, "detect").mockResolvedValue({
      wasmThreads: true,
      wasmSimd: true,
      threads: true,
      simd: true,
      opfs: true,
    });
    vi.spyOn(SecurityAdvisor, "getStatus").mockResolvedValue({
      isCrossOriginIsolated: true,
      canUseThreads: true,
      sriSupported: true,
      sriEnabled: true,
      coopCoepEnabled: true,
    });
    vi.spyOn(EnvironmentDetector, "getRecommendedThreads").mockReturnValue(4);
    vi.spyOn(EnvironmentDetector, "getRecommendedMaxMemory").mockReturnValue(
      1024 * 1024 * 1024,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should recommend optimal options for isolated multi-threaded environment", async () => {
    const options = await ResourceGovernor.getRecommendedOptions();
    expect(options["Threads"]).toBe(4);
    expect(options["Hash"]).toBe(512); // Cap at 512MB
    expect(options["MultiThreaded"]).toBe(true);
  });

  it("should fallback to single thread if not crossOriginIsolated", async () => {
    vi.spyOn(SecurityAdvisor, "getStatus").mockResolvedValue({
      isCrossOriginIsolated: false,
      canUseThreads: false,
      sriSupported: true,
      sriEnabled: true,
      coopCoepEnabled: false,
    });

    const options = await ResourceGovernor.getRecommendedOptions();
    expect(options["Threads"]).toBe(1);
    expect(options["MultiThreaded"]).toBe(false);
  });

  it("should apply low power mode settings", () => {
    const baseOptions = { Threads: 4, Hash: 512, Ponder: true };
    const lowPower = ResourceGovernor.applyLowPowerMode(baseOptions);
    expect(lowPower["Threads"]).toBe(1);
    expect(lowPower["Hash"]).toBe(16);
    expect(lowPower["Ponder"]).toBe(false);
  });
});
