import { describe, it, expect } from "vitest";
import { EngineLoader } from "../EngineLoader.js";
import { EngineErrorCode } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

describe("EngineLoader Security", () => {
  const loader = new EngineLoader();

  const callValidate = (
    url: string,
    sri?: string,
    unsafe?: boolean,
    forceProd?: boolean,
  ) => {
    // 物理的整合性: プライベートメソッドをテストから呼び出し
    const config = {
      url,
      type: "worker-js" as const,
      sri,
      __unsafeNoSRI: unsafe,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (loader as any).validateResourceUrl(
      config,
      "test-engine",
      forceProd,
    );
  };

  describe("validateResourceUrl", () => {
    it("should allow https URLs with SRI", () => {
      expect(() =>
        callValidate("https://example.com/e.js", "sha256-abc"),
      ).not.toThrow();
    });

    it("should throw SECURITY_ERROR for all http including localhost", () => {
      expect(() => callValidate("http://localhost/e.js", "sha256-abc")).toThrow(
        /Insecure connection \(HTTP\)/,
      );
      expect(() => callValidate("http://127.0.0.1/e.js", "sha256-abc")).toThrow(
        /Insecure connection \(HTTP\)/,
      );
    });

    it("should throw SECURITY_ERROR for non-localhost http", () => {
      let thrown: unknown;
      try {
        callValidate("http://malicious.com/worker.js", "sha256-abc");
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(EngineError);
      if (thrown instanceof EngineError) {
        expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(thrown.message).toContain("Insecure connection (HTTP)");
      }
    });

    it("should throw SECURITY_ERROR if SRI is missing and unsafe flag is false", () => {
      let thrown: unknown;
      try {
        callValidate("https://app.example.com/worker.js");
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(EngineError);
      if (thrown instanceof EngineError) {
        expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(thrown.message).toContain("SRI hash is required");
      }
    });

    it("should throw SECURITY_ERROR if unsafe flag is used in production", () => {
      let thrown: unknown;
      try {
        // 物理的修正: forceProd=true を渡して確実にエラーを誘発
        callValidate(
          "https://app.example.com/worker.js",
          undefined,
          true,
          true,
        );
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(EngineError);
      if (thrown instanceof EngineError) {
        expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(thrown.message).toContain(
          "SRI bypass (__unsafeNoSRI) is not allowed in production.",
        );
      }
    });
  });
});
