import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { UCIParser } from "../UCIParser.js";
import { createFEN } from "@multi-game-engines/domain-chess";

describe("UCIParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new UCIParser();

  describe("parseInfo", () => {
    it("should parse positive cp score as structured object", () => {
      const info = parser.parseInfo("info depth 10 score cp 50 pv e2e4");
      expect(info?.score).toEqual({ cp: 50 });
    });

    it("should parse pv moves", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv e2e4 e7e5 g1f3",
      );
      expect(info?.pv).toEqual(["e2e4", "e7e5", "g1f3"]);
    });

    it("should skip invalid moves in PV", () => {
      // "invalid" will be skipped by this.createMove
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv e2e4 invalid g1f3",
      );
      expect(info?.pv).toEqual(["e2e4", "g1f3"]);
    });

    it("should parse negative cp score", () => {
      const info = parser.parseInfo("info depth 8 score cp -120 pv d7d5");
      expect(info?.score).toEqual({ cp: -120 });
    });

    it("should parse mate score", () => {
      const info = parser.parseInfo("info depth 5 score mate 3 pv e2e4");
      expect(info?.score).toEqual({ mate: 3 });
    });

    it("should parse negative mate score", () => {
      const info = parser.parseInfo("info depth 5 score mate -2 pv d7d5");
      expect(info?.score).toEqual({ mate: -2 });
    });

    it("should parse info line without PV", () => {
      const info = parser.parseInfo("info depth 10 score cp 50");
      expect(info?.score).toEqual({ cp: 50 });
      expect(info?.pv).toBeUndefined();
    });
  });

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove e2e4");
      expect(result?.bestMove).toBe("e2e4");
    });

    it("should handle bestmove none correctly", () => {
      const result = parser.parseResult("bestmove none");
      expect(result).not.toBeNull();
      expect(result!.bestMove).toBeNull();
    });

    it("should handle bestmove (none) correctly", () => {
      const result = parser.parseResult("bestmove (none)");
      expect(result?.bestMove).toBeNull();
    });

    it("should handle bestmove 0000 correctly", () => {
      const result = parser.parseResult("bestmove 0000");
      expect(result?.bestMove).toBeNull();
    });
  });

  describe("createSearchCommand", () => {
    it("should create valid search command with FEN", () => {
      const fen = createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      const commands = parser.createSearchCommand({ fen, depth: 10 });
      expect(commands).toEqual([`position fen ${fen}`, "go depth 10"]);
    });

    it("should throw error for injection in FEN", () => {
      // Intentional bypass using casting to test parser's internal check
      const maliciousFen =
        "startpos\nquit" as unknown as import("@multi-game-engines/domain-chess").FEN;
      expect(() => parser.createSearchCommand({ fen: maliciousFen })).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it.each(["\r", "\t", "\0"])(
      "should throw error for control character %j in FEN",
      (char) => {
        // Use casting to bypass domain validation and reach the parser's check
        const maliciousFen =
          `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR${char}w KQkq - 0 1` as unknown as import("@multi-game-engines/domain-chess").FEN;
        expect(() =>
          parser.createSearchCommand({
            fen: maliciousFen,
          }),
        ).toThrow(
          expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
        );
      },
    );

    it("should throw error for injection in custom fields (index signature)", () => {
      expect(() =>
        parser.createSearchCommand({
          fen: createFEN(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
          // Using index signature to pass malicious data safely in TS
          "malicious\nkey": "value",
        }),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should throw error for nested injection", () => {
      expect(() =>
        parser.createSearchCommand({
          fen: createFEN(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
          nested: {
            "evil\r\nkey": "data",
          },
        }),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });
});
