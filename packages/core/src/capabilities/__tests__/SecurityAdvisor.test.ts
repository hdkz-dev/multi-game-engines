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

  describe("safeFetch", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true } as Response),
      );
    });

    it("should allow HTTPS URLs", async () => {
      await expect(
        SecurityAdvisor.safeFetch("https://example.com/engine.wasm"),
      ).resolves.toBeDefined();
    });

    it("should allow HTTP for localhost", async () => {
      await expect(
        SecurityAdvisor.safeFetch("http://localhost:8080/engine"),
      ).resolves.toBeDefined();
    });

    it("should allow HTTP for 127.0.0.1", async () => {
      await expect(
        SecurityAdvisor.safeFetch("http://127.0.0.1:3000/api"),
      ).resolves.toBeDefined();
    });

    it("should allow HTTP for [::1]", async () => {
      await expect(
        SecurityAdvisor.safeFetch("http://[::1]:8080/engine"),
      ).resolves.toBeDefined();
    });

    it("should allow HTTP for *.localhost subdomains (Portless)", async () => {
      await expect(
        SecurityAdvisor.safeFetch("http://myapp.localhost:3000/engine"),
      ).resolves.toBeDefined();
      await expect(
        SecurityAdvisor.safeFetch("http://api.engine.localhost:8080/v1"),
      ).resolves.toBeDefined();
    });

    it("should reject HTTP for remote hosts", async () => {
      await expect(
        SecurityAdvisor.safeFetch("http://example.com/engine.wasm"),
      ).rejects.toThrow(/Insecure protocol/);
    });

    it("should reject FTP protocol", async () => {
      await expect(
        SecurityAdvisor.safeFetch("ftp://example.com/engine.wasm"),
      ).rejects.toThrow(/Insecure protocol/);
    });
  });

  describe("assertSRI", () => {
    it("should resolve when the hash matches", async () => {
      await expect(
        SecurityAdvisor.assertSRI(testData, validSha256),
      ).resolves.toBeUndefined();
    });

    it("should throw EngineError with SRI_MISMATCH when the hash does not match", async () => {
      await expect(
        SecurityAdvisor.assertSRI(testData, invalidSha256),
      ).rejects.toThrow(/SRI hash verification failed/);
    });
  });

  describe("getStatus (header diagnostics)", () => {
    it("should add missingHeaders entries when COOP/COEP are not on the response", async () => {
      vi.stubGlobal("window", { location: { href: "https://example.test/" } });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          headers: { get: () => null },
        } as unknown as Response),
      );
      vi.stubGlobal("crossOriginIsolated", false);

      const status = await SecurityAdvisor.getStatus();
      expect(status.missingHeaders).toEqual([
        "cross-origin-opener-policy",
        "cross-origin-embedder-policy",
      ]);
    });

    it("should leave missingHeaders undefined when both headers are present", async () => {
      vi.stubGlobal("window", { location: { href: "https://example.test/" } });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          headers: {
            get: (name: string) =>
              name === "cross-origin-opener-policy"
                ? "same-origin"
                : "require-corp",
          },
        } as unknown as Response),
      );

      const status = await SecurityAdvisor.getStatus();
      expect(status.missingHeaders).toBeUndefined();
    });

    it("should swallow fetch failures and still return a status", async () => {
      vi.stubGlobal("window", { location: { href: "https://example.test/" } });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("network down")),
      );

      const status = await SecurityAdvisor.getStatus();
      expect(status).toBeDefined();
      expect(status.sriSupported).toBe(true);
    });

    it("should skip the HEAD request entirely outside browser context", async () => {
      vi.stubGlobal("window", undefined);
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      await SecurityAdvisor.getStatus();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should report sriSupported false when crypto.subtle is unavailable", async () => {
      vi.stubGlobal("crypto", undefined);
      const status = await SecurityAdvisor.getStatus();
      expect(status.sriSupported).toBe(false);
      expect(status.sriEnabled).toBe(false);
    });
  });

  describe("getRemediationAdvice", () => {
    it("should include COOP and COEP guidance with platform examples", () => {
      const advice = SecurityAdvisor.getRemediationAdvice();
      expect(advice).toMatch(/Cross-Origin-Opener-Policy/);
      expect(advice).toMatch(/Cross-Origin-Embedder-Policy/);
      expect(advice).toMatch(/Vercel/);
      expect(advice).toMatch(/Cloudflare/);
      expect(advice).toMatch(/Netlify/);
    });
  });
});
