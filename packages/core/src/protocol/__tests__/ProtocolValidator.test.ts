import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { ProtocolValidator } from "../ProtocolValidator.js";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("ProtocolValidator", () => {
  describe("assertNoInjection", () => {
    it("should not throw for safe strings", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection("safe string", "context"),
      ).not.toThrow();
    });

    it("should throw for strings with control characters", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection("injected\nstring", "context"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
      expect(() =>
        ProtocolValidator.assertNoInjection("injected\rstring", "context"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
      expect(() =>
        ProtocolValidator.assertNoInjection("injected\0string", "context"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should allow semicolon when allowSemicolon is true", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(
          "safe;string",
          "context",
          false,
          true,
        ),
      ).not.toThrow();
    });

    it("should throw for semicolon when allowSemicolon is false", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(
          "unsafe;string",
          "context",
          false,
          false,
        ),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should recursively check objects", () => {
      const safeObj = { a: "safe", b: { c: "also safe" } };
      expect(() =>
        ProtocolValidator.assertNoInjection(safeObj, "context", true),
      ).not.toThrow();

      const unsafeValueObj = { a: "safe", b: { c: "unsafe\n" } };
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeValueObj, "context", true),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );

      const unsafeKeyObj = { "unsafe\nkey": "safe value" };
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeKeyObj, "context", true),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should recursively check arrays", () => {
      const safeArr = ["safe", ["very safe"]];
      expect(() =>
        ProtocolValidator.assertNoInjection(safeArr, "context", true),
      ).not.toThrow();

      const unsafeArr = ["safe", ["unsafe\0"]];
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeArr, "context", true),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("循環参照を検知して拒否すること (Zenith 6.4)", () => {
      const circular: Record<string, unknown> = { a: "safe" };
      circular.self = circular;

      expect(() =>
        ProtocolValidator.assertNoInjection(circular, "context", true),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.nestedTooDeep" }),
      );
    });

    it("過度なネスト構造を検知して拒否すること", () => {
      // 32段階以上のネストを作成
      let deep: Record<string, unknown> = { val: "end" };
      for (let i = 0; i < 40; i++) {
        deep = { child: deep };
      }

      expect(() =>
        ProtocolValidator.assertNoInjection(deep, "context", true),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.nestedTooDeep" }),
      );
    });
  });
});
