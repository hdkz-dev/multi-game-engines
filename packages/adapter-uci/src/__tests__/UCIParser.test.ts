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
  });

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove e2e4");
      expect(result?.bestMove).toBe("e2e4");
    });

    it("should handle bestmove (none) correctly", () => {
      const result = parser.parseResult("bestmove (none)");
      expect(result?.bestMove).toBe("(none)");
    });

    it("should handle bestmove none correctly", () => {
      const result = parser.parseResult("bestmove none");
      expect(result?.bestMove).toBe("none");
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
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parser.createSearchCommand({ fen: "startpos\nquit" as any }),
      ).toThrow(/Potential command injection/);
    });
  });
});
