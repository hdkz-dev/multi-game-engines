import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineLoader } from "../EngineLoader.js";
import { IFileStorage, EngineErrorCode } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

describe("EngineLoader Security", () => {
  let storage: IFileStorage;
  let loader: EngineLoader;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    storage = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };
    loader = new EngineLoader(storage);

    // 2026 Best Practice: Node.js 環境での完全なブラウザ API モック
    vi.stubGlobal("window", {
      location: {
        href: "https://app.example.com/index.html",
        origin: "https://app.example.com",
      },
    });

    // globalThis.URL はそのまま使いつつ、base のデフォルトをモック環境に合わせる
    const OriginalURL = globalThis.URL;
    vi.stubGlobal(
      "URL",
      class extends OriginalURL {
        constructor(url: string | URL, base?: string | URL) {
          super(url, base || "https://app.example.com");
        }
        static createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
        static revokeObjectURL = vi.fn();
      },
    );
  });

  describe("validateResourceUrl", () => {
    // 2026 Best Practice: private メソッドへのアクセスのための型ヘルパー
    const callValidate = (url: string, sri?: string, unsafe?: boolean, isProd = false) => {
      // Mock the production state
      (loader as unknown as { isProduction: boolean }).isProduction = isProd;
      (
        loader as unknown as { validateResourceUrl(c: unknown, id: string): void }
      ).validateResourceUrl({ url, type: "worker-js", sri, __unsafeNoSRI: unsafe }, "test-id");
    };

    it("should allow https URLs with SRI", () => {
      const url = "https://app.example.com/worker.js";
      // Should not throw
      callValidate(url, "sha384-dummy");
    });

    it("should allow http exact localhost", () => {
      callValidate("http://localhost/worker.js", "sha384-dummy");
      callValidate("http://127.0.0.1/worker.js", "sha384-dummy");
    });

    it("should throw SECURITY_ERROR for non-localhost http", () => {
      const url = "http://malicious.com/worker.js";
      let thrown: unknown;
      try {
        callValidate(url, "sha384-dummy");
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
      const url = "https://app.example.com/worker.js";
      let thrown: unknown;
      try {
        callValidate(url, undefined, false);
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
      const url = "https://app.example.com/worker.js";
      let thrown: unknown;
      try {
        callValidate(url, undefined, true, true);
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(EngineError);
      if (thrown instanceof EngineError) {
        expect(thrown.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(thrown.message).toContain("SRI bypass (__unsafeNoSRI) is not allowed in production.");
      }
    });
  });
});
