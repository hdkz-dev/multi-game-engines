import { describe, it, expect, vi, beforeEach } from "vitest";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";

describe("SecurityAdvisor", () => {
  beforeEach(() => {
    vi.stubGlobal("crossOriginIsolated", false);
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue({}),
    });
  });

  it("should report missing headers when not cross-origin isolated", () => {
    const status = SecurityAdvisor.getStatus();
    expect(status.isCrossOriginIsolated).toBe(false);
    expect(status.missingHeaders).toContain("Cross-Origin-Opener-Policy: same-origin");
  });

  it("should validate SRI hash format", () => {
    expect(SecurityAdvisor.isValidSRI("sha256-abc123")).toBe(true);
    expect(SecurityAdvisor.isValidSRI("invalid-hash")).toBe(false);
  });

  it("should generate safe fetch options", () => {
    const sri = "sha256-abc123";
    const options = SecurityAdvisor.getSafeFetchOptions(sri);
    expect(options.integrity).toBe(sri);
    expect(options.mode).toBe("cors");
  });
});
