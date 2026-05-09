import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  ProtocolValidator,
  createMove,
  createPositionString,
  createPositionId,
  createI18nKey,
} from "../ProtocolValidator.js";

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

    it("non-recursive モードで非文字列を拒否すること", () => {
      expect(() => ProtocolValidator.assertNoInjection(42, "context")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.illegalCharacters",
        }),
      );
      expect(() =>
        ProtocolValidator.assertNoInjection({ a: "x" }, "context"),
      ).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.illegalCharacters",
        }),
      );
    });

    it("non-recursive モードで null/undefined は通過すること", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(null, "context"),
      ).not.toThrow();
      expect(() =>
        ProtocolValidator.assertNoInjection(undefined, "context"),
      ).not.toThrow();
    });

    it("recursive モードでも null は通過すること", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(null, "context", true),
      ).not.toThrow();
    });

    it("recursive モードでプリミティブ (number/boolean) はスキップすること", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(
          { a: 42, b: true, c: "safe" },
          "context",
          true,
        ),
      ).not.toThrow();
    });

    it("DEL (\\x7f) や ASCII 制御文字を拒否すること", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection("ctrl\x7fchar", "context"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
      expect(() =>
        ProtocolValidator.assertNoInjection("ctrl\x01char", "context"),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("LOOSE モードでもセミコロン以外の制御文字は拒否すること", () => {
      expect(() =>
        ProtocolValidator.assertNoInjection(
          "loose\nbreak",
          "context",
          false,
          true,
        ),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("インジェクション検知時に remediation が含まれること", () => {
      try {
        ProtocolValidator.assertNoInjection("bad\nvalue", "ctx");
        throw new Error("should have thrown");
      } catch (e) {
        const err = e as { remediation?: string };
        expect(err.remediation).toMatch(/Remove control characters/);
        expect(err.remediation).toMatch(/;/);
      }
      try {
        ProtocolValidator.assertNoInjection("bad\nvalue", "ctx", false, true);
        throw new Error("should have thrown");
      } catch (e) {
        const err = e as { remediation?: string };
        expect(err.remediation).toMatch(/Remove control characters/);
        expect(err.remediation).not.toMatch(/;/);
      }
    });
  });

  describe("createMove", () => {
    it("正規の指し手を受理する", () => {
      expect(createMove("e2e4")).toBe("e2e4");
      expect(createMove("Nf3+")).toBe("Nf3+");
      expect(createMove("O-O-O")).toBe("O-O-O");
      expect(createMove("a1=Q")).toBe("a1=Q");
    });

    it("不正文字を含む指し手を拒否する", () => {
      expect(() => createMove("e2e4;rm -rf")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidMoveFormat",
        }),
      );
      expect(() => createMove("e2\ne4")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidMoveFormat",
        }),
      );
    });

    it("空文字や非文字列を拒否する", () => {
      expect(() => createMove("")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidMoveFormat",
        }),
      );
      expect(() => createMove(42 as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidMoveFormat",
        }),
      );
    });
  });

  describe("createPositionString", () => {
    it("正規の局面文字列を受理する", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      expect(createPositionString(fen)).toBe(fen);
    });

    it("空白のみの文字列を拒否する", () => {
      expect(() => createPositionString("   ")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionString",
        }),
      );
    });

    it("空文字を拒否する", () => {
      expect(() => createPositionString("")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionString",
        }),
      );
    });

    it("非文字列を拒否する", () => {
      expect(() => createPositionString(null as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionString",
        }),
      );
    });

    it("制御文字を含む文字列を拒否する", () => {
      expect(() => createPositionString("position\nwith\nnewlines")).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });

  describe("createPositionId", () => {
    it("正規の ID を受理する (英数 + - _ . :)", () => {
      expect(createPositionId("abc123")).toBe("abc123");
      expect(createPositionId("a-b_c.d:e")).toBe("a-b_c.d:e");
      expect(createPositionId("UPPER")).toBe("UPPER");
    });

    it("不正文字を含む ID を拒否する", () => {
      expect(() => createPositionId("abc def")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionId",
        }),
      );
      expect(() => createPositionId("abc/def")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionId",
        }),
      );
    });

    it("空文字を拒否する", () => {
      expect(() => createPositionId("")).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionId",
        }),
      );
    });

    it("非文字列を拒否する", () => {
      expect(() => createPositionId(undefined as unknown as string)).toThrow(
        expect.objectContaining({
          i18nKey: "engine.errors.invalidPositionId",
        }),
      );
    });
  });

  describe("createI18nKey", () => {
    it("正規のキーを受理する", () => {
      expect(createI18nKey("engine.errors.foo")).toBe("engine.errors.foo");
    });

    it("空文字や空白のみを拒否する", () => {
      expect(() => createI18nKey("")).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(/Invalid I18nKey/),
        }),
      );
      expect(() => createI18nKey("   ")).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(/Invalid I18nKey/),
        }),
      );
    });

    it("非文字列を拒否する", () => {
      expect(() => createI18nKey(123 as unknown as string)).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(/Invalid I18nKey/),
        }),
      );
    });
  });
});
