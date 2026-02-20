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
      ).toThrow(/Potential command injection/);
      expect(() =>
        ProtocolValidator.assertNoInjection("injected\rstring", "context"),
      ).toThrow(/Potential command injection/);
      expect(() =>
        ProtocolValidator.assertNoInjection("injected\0string", "context"),
      ).toThrow(/Potential command injection/);
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
      ).toThrow(/Potential command injection/);
    });

    it("should recursively check objects", () => {
      const safeObj = { a: "safe", b: { c: "also safe" } };
      expect(() =>
        ProtocolValidator.assertNoInjection(safeObj, "context", true),
      ).not.toThrow();

      const unsafeValueObj = { a: "safe", b: { c: "unsafe\n" } };
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeValueObj, "context", true),
      ).toThrow(/Potential command injection/);

      const unsafeKeyObj = { "unsafe\nkey": "safe value" };
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeKeyObj, "context", true),
      ).toThrow(/Potential command injection/);
    });

    it("should recursively check arrays", () => {
      const safeArr = ["safe", ["very safe"]];
      expect(() =>
        ProtocolValidator.assertNoInjection(safeArr, "context", true),
      ).not.toThrow();

      const unsafeArr = ["safe", ["unsafe\0"]];
      expect(() =>
        ProtocolValidator.assertNoInjection(unsafeArr, "context", true),
      ).toThrow(/Potential command injection/);
    });
  });
});
