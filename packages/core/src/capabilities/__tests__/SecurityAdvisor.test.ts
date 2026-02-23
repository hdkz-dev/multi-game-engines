import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SecurityAdvisor } from "../SecurityAdvisor.js";

describe("SecurityAdvisor", () => {
  const testData = new TextEncoder().encode("test").buffer;
  const validSha256 = "sha256-n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=";
  const invalidSha256 = "sha256-invalidhashinvalidhashinvalidhashinvalidhas=";

  beforeEach(() => {
    vi.stubGlobal("crossOriginIsolated", false);
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("isValidSRI", () => {
    it("should validate single hash correctly", () => {
      expect(SecurityAdvisor.isValidSRI(validSha256)).toBe(true);
      expect(SecurityAdvisor.isValidSRI("sha384-abc")).toBe(true);
      expect(SecurityAdvisor.isValidSRI("invalid")).toBe(false);
    });

    it("should validate multi-hash correctly", () => {
      expect(SecurityAdvisor.isValidSRI(`${validSha256} sha384-abc`)).toBe(
        true,
      );
    });
  });

  describe("getSafeFetchOptions", () => {
    it("should return integrity options for valid SRI", () => {
      const options = SecurityAdvisor.getSafeFetchOptions(validSha256);
      expect(options.integrity).toBe(validSha256);
      expect(options.mode).toBe("cors");
      expect(options.credentials).toBe("omit");
    });

    it("should return empty object for invalid/missing SRI", () => {
      expect(SecurityAdvisor.getSafeFetchOptions()).toEqual({});
      expect(SecurityAdvisor.getSafeFetchOptions("invalid")).toEqual({});
    });
  });

  describe("verifySRI", () => {
    it("should return true for matching hash", async () => {
      const result = await SecurityAdvisor.verifySRI(testData, validSha256);
      expect(result).toBe(true);
    });

    it("should return false for mismatching hash", async () => {
      const result = await SecurityAdvisor.verifySRI(testData, invalidSha256);
      expect(result).toBe(false);
    });

    it("should handle multi-hash and prefer strongest algorithm", async () => {
      // Valid SHA256 but invalid SHA512. Since SHA512 is stronger, it should fail.
      const multi = `${validSha256} sha512-wrong`;
      const result = await SecurityAdvisor.verifySRI(testData, multi);
      expect(result).toBe(false);
    });
  });

  describe("getStatus", () => {
    it("should report status based on global flags", async () => {
      vi.stubGlobal("crossOriginIsolated", true);
      const status = await SecurityAdvisor.getStatus();
      expect(status.isCrossOriginIsolated).toBe(true);
      expect(status.canUseThreads).toBe(true);
    });

    it("should detect SRI support", async () => {
      const status = await SecurityAdvisor.getStatus();
      expect(status.sriSupported).toBe(true);
    });
  });
});
