import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor";

describe("SecurityAdvisor", () => {
  beforeEach(() => {
    // デフォルトは非隔離環境
    vi.stubGlobal("crossOriginIsolated", false);
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue({}),
    });
  });

  afterEach(() => {
    // グローバルスタブをリセットしてテスト間の干渉を防ぐ (2026 Best Practice)
    vi.unstubAllGlobals();
  });

  it("should report missing headers and recommended actions when not cross-origin isolated", () => {
    const status = SecurityAdvisor.getStatus();
    expect(status.isCrossOriginIsolated).toBe(false);
    expect(status.canUseThreads).toBe(false);
    expect(status.missingHeaders).toBeDefined();
    expect(status.recommendedActions).toBeDefined();
  });

  it("should report healthy status when cross-origin isolated is true", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const status = SecurityAdvisor.getStatus();
    
    expect(status.isCrossOriginIsolated).toBe(true);
    expect(status.canUseThreads).toBe(true);
    expect(status.missingHeaders).toBeUndefined();
    expect(status.recommendedActions).toBeUndefined();
  });

  it("should detect sriSupported correctly based on element attributes", () => {
    // サポートされていない場合
    expect(SecurityAdvisor.getStatus().sriSupported).toBe(false);

    // サポートされている場合
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue({ integrity: "" }),
    });
    expect(SecurityAdvisor.getStatus().sriSupported).toBe(true);
  });

  it("should validate SRI hash formats including multi-hash support", () => {
    expect(SecurityAdvisor.isValidSRI("sha256-abc123==")).toBe(true);
    expect(SecurityAdvisor.isValidSRI("sha384-def456==")).toBe(true);
    expect(SecurityAdvisor.isValidSRI("sha512-ghi789==")).toBe(true);
    expect(SecurityAdvisor.isValidSRI("sha256-abc123== sha384-def456==")).toBe(true);
    expect(SecurityAdvisor.isValidSRI("invalid-hash")).toBe(false);
    expect(SecurityAdvisor.isValidSRI("sha256-abc123== invalid")).toBe(false);
    expect(SecurityAdvisor.isValidSRI("")).toBe(false);
  });

  it("should return correct fetch options with integrity and cors mode", () => {
    const sri = "sha256-abc123==";
    const options = SecurityAdvisor.getSafeFetchOptions(sri);
    expect(options.integrity).toBe(sri);
    expect(options.mode).toBe("cors");
    expect(options.credentials).toBe("omit");
  });

  it("should return empty fetch options for invalid or missing SRI", () => {
    expect(SecurityAdvisor.getSafeFetchOptions()).toEqual({});
    expect(SecurityAdvisor.getSafeFetchOptions("")).toEqual({});
    expect(SecurityAdvisor.getSafeFetchOptions("invalid-sri")).toEqual({});
  });
});
