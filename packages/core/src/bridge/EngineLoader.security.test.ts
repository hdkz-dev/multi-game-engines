import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineLoader } from "./EngineLoader.js";
import { IFileStorage, EngineErrorCode } from "../types.js";
import { EngineError } from "../errors/EngineError.js";

describe("EngineLoader Security", () => {
  let storage: IFileStorage;
  let loader: EngineLoader;

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

  describe("validateWorkerUrl", () => {
    // 2026 Best Practice: private メソッドへのアクセスのための型ヘルパー
    const callValidate = (url: string) => {
      (
        loader as unknown as { validateWorkerUrl(u: string, id?: string): void }
      ).validateWorkerUrl(url);
    };

    it("should allow same-origin URLs", () => {
      const url = "https://app.example.com/worker.js";
      // Should not throw
      callValidate(url);
    });

    it("should allow blob: URLs", () => {
      const url = "blob:https://app.example.com/uuid";
      callValidate(url);
    });

    it("should allow exact localhost", () => {
      callValidate("http://localhost/worker.js");
      callValidate("http://127.0.0.1/worker.js");
    });

    it("should throw SECURITY_ERROR for cross-origin URLs", () => {
      const url = "https://malicious.com/worker.js";
      try {
        callValidate(url);
        throw new Error("Should have thrown");
      } catch (e) {
        const err = e as EngineError;
        expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
        expect(err.message).toContain(
          "Cross-origin Worker scripts are prohibited",
        );
      }
    });

    it("should throw SECURITY_ERROR for spoofed localhost", () => {
      const url = "https://localhost.evil.com/worker.js";
      try {
        callValidate(url);
        throw new Error("Should have thrown");
      } catch (e) {
        const err = e as EngineError;
        expect(err.code).toBe(EngineErrorCode.SECURITY_ERROR);
      }
    });
  });
});
