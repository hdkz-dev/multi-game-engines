import { describe, it, expect } from "vitest";
import { UCIParser, FEN } from "../UCIParser.js";
import { createFEN } from "@multi-game-engines/core";

describe("UCIParser", () => {
  const parser = new UCIParser();

  // ─── parseInfo: 構造化スコア ───────────────────────

  describe("parseInfo - score", () => {
    it("should parse positive cp score as structured object", () => {
      const info = parser.parseInfo(
        "info depth 15 score cp 30 nps 1000000 time 500 pv e2e4 e7e5",
      );
      expect(info?.depth).toBe(15);
      expect(info?.score).toEqual({ cp: 30 });
      expect(info?.nps).toBe(1000000);
      expect(info?.time).toBe(500);
      expect(info?.pv).toEqual(["e2e4", "e7e5"]);
    });

    it("should parse negative cp score correctly", () => {
      const info = parser.parseInfo("info depth 10 score cp -50");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ cp: -50 });
    });

    it("should parse zero cp score correctly", () => {
      const info = parser.parseInfo("info depth 1 score cp 0");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ cp: 0 });
    });

    it("should parse positive mate score as structured { mate } object", () => {
      const info = parser.parseInfo("info score mate 5");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ mate: 5 });
    });

    it("should parse negative mate score (opponent winning)", () => {
      const info = parser.parseInfo("info score mate -3");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ mate: -3 });
    });

    it("should default score to { cp: 0 } when no score token present", () => {
      const info = parser.parseInfo("info depth 20");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ cp: 0 });
    });
  });

  // ─── parseInfo: その他のフィールド ─────────────────

  describe("parseInfo - fields", () => {
    it("should parse depth and raw correctly", () => {
      const info = parser.parseInfo("info depth 20");
      expect(info?.raw).toBe("info depth 20");
      expect(info?.depth).toBe(20);
    });

    it("should parse seldepth correctly", () => {
      const info = parser.parseInfo("info depth 15 seldepth 28");
      expect(info!.seldepth).toBe(28);
    });

    it("should parse hashfull correctly", () => {
      const info = parser.parseInfo("info depth 10 hashfull 500");
      expect(info!.hashfull).toBe(500);
    });

    it("should parse multipv correctly", () => {
      const info = parser.parseInfo(
        "info depth 10 multipv 2 score cp 40 pv d2d4",
      );
      expect(info!.multipv).toBe(2);
    });

    it("should parse nodes correctly", () => {
      const info = parser.parseInfo("info nodes 1000");
      expect(info!.nodes).toBe(1000);
    });

    it("should handle nodes with no value correctly", () => {
      const info = parser.parseInfo("info nodes");
      expect(info!.nodes).toBe(0);
    });

    it("should handle nodes with invalid value correctly", () => {
      const info = parser.parseInfo("info nodes abc");
      expect(info!.nodes).toBe(0);
    });
  });

  // ─── parseResult ────────────────────────────────────

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove e2e4");
      expect(result?.raw).toBe("bestmove e2e4");
      expect(result?.bestMove).toBe("e2e4");
    });

    it("should parse bestmove with ponder", () => {
      const result = parser.parseResult("bestmove e2e4 ponder e7e5");
      expect(result?.bestMove).toBe("e2e4");
      expect(result?.ponder).toBe("e7e5");
    });

    it("should return null for non-bestmove lines", () => {
      expect(parser.parseResult("info depth 20")).toBeNull();
    });
  });

  // ─── parseInfo: エッジケース ────────────────────────

  describe("parseInfo - edge cases", () => {
    it("should return null for non-info lines", () => {
      expect(parser.parseInfo("bestmove e2e4")).toBeNull();
    });

    it("should return null for non-string inputs", () => {
      expect(
        parser.parseInfo(new Uint8Array([1, 2, 3]) as unknown as string),
      ).toBeNull();
      expect(parser.parseResult({} as unknown as string)).toBeNull();
    });

    it("should return null for invalid bestmove format", () => {
      expect(parser.parseResult("bestmove invalid_format")).toBeNull();
    });

    it("should parse info with tokens after pv", () => {
      const line = "info depth 10 pv e2e4 e7e5 score cp 20 nps 1000";
      const info = parser.parseInfo(line);
      expect(info).not.toBeNull();
      if (info) {
        expect(info.depth).toBe(10);
        expect(info.pv).toEqual(["e2e4", "e7e5"]);
        expect(info.score).toEqual({ cp: 20 });
        expect(info.nps).toBe(1000);
      }
    });

    it("should skip invalid moves in PV", () => {
      const line = "info pv e2e4 invalid e7e5";
      const info = parser.parseInfo(line);
      expect(info).not.toBeNull();
      expect(info!.pv).toEqual(["e2e4", "e7e5"]);
    });

    it("should handle bestmove (none) correctly", () => {
      const line = "bestmove (none)";
      const result = parser.parseResult(line);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.bestMove).toBe("(none)");
      }
    });
  });

  // ─── createSearchCommand ──────────────────────────

  describe("createSearchCommand", () => {
    it("should create valid search command with FEN", () => {
      const commands = parser.createSearchCommand({
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN,
        depth: 20,
      });
      expect(commands).toEqual([
        "position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "go depth 20",
      ]);
    });

    it("should create valid search command with startpos", () => {
      const commands = parser.createSearchCommand({
        fen: "startpos" as FEN,
        nodes: 1000,
      });
      expect(commands).toEqual(["position startpos", "go nodes 1000"]);
    });

    it("should throw error for injection in FEN", () => {
      expect(() =>
        parser.createSearchCommand({ fen: "startpos\nquit" as FEN }),
      ).toThrow(/command injection/);
    });
  });

  // ─── createOptionCommand ──────────────────────────

  describe("createOptionCommand", () => {
    it("should create valid option command", () => {
      expect(parser.createOptionCommand("Threads", 4)).toBe(
        "setoption name Threads value 4",
      );
    });

    it("should throw error for injection in option name or value", () => {
      expect(() => parser.createOptionCommand("Threads\nquit", 4)).toThrow(
        /command injection/,
      );
      expect(() => parser.createOptionCommand("Threads", "4\nquit")).toThrow(
        /command injection/,
      );
    });
  });
});

// ─── createFEN ファクトリ ───────────────────────────

describe("createFEN", () => {
  it("should return a branded FEN string for valid input", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
  });

  it("should throw for empty string", () => {
    expect(() => createFEN("")).toThrow();
  });

  it("should throw for non-string input", () => {
    expect(() => createFEN(undefined as unknown as string)).toThrow();
  });
});
