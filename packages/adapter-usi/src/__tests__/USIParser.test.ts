import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { USIParser } from "../USIParser.js";
import { createSFEN, SFEN } from "@multi-game-engines/domain-shogi";
import { EngineError } from "@multi-game-engines/core";

describe("USIParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const parser = new USIParser();

  // ─── parseInfo: 構造化スコア ───────────────────────

  describe("parseInfo - score", () => {
    it("should parse score cp as structured { cp } object", () => {
      const info = parser.parseInfo("info depth 10 score cp 100");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ cp: 100 });
      expect(info!.depth).toBe(10);
    });

    it("should parse negative cp score correctly", () => {
      const info = parser.parseInfo("info depth 5 score cp -150");
      expect(info).not.toBeNull();
      expect(info!.score).toEqual({ cp: -150 });
    });

    it("should parse zero cp score correctly", () => {
      const info = parser.parseInfo("info depth 8 score cp 0");
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
  });

  // ─── parseInfo: その他のフィールド ─────────────────

  describe("parseInfo - fields", () => {
    it("should parse seldepth correctly", () => {
      const info = parser.parseInfo("info depth 12 seldepth 20");
      expect(info!.seldepth).toBe(20);
    });

    it("should parse nodes correctly", () => {
      const info = parser.parseInfo("info depth 10 nodes 500000");
      expect(info!.nodes).toBe(500000);
    });

    it("should parse nps correctly", () => {
      const info = parser.parseInfo("info depth 10 nps 2000000");
      expect(info!.nps).toBe(2000000);
    });

    it("should parse time correctly", () => {
      const info = parser.parseInfo("info depth 10 time 1500");
      expect(info!.time).toBe(1500);
    });

    it("should parse hashfull correctly", () => {
      const info = parser.parseInfo("info depth 10 hashfull 500");
      expect(info!.hashfull).toBe(500);
    });

    it("should parse multipv correctly", () => {
      const info = parser.parseInfo("info depth 10 multipv 2");
      expect(info!.multipv).toBe(2);
    });

    it("should ignore cpuload correctly", () => {
      const info = parser.parseInfo("info depth 10 cpuload 80");
      expect(info).not.toHaveProperty("cpuload");
    });

    it("should parse multiple tokens correctly", () => {
      const info = parser.parseInfo(
        "info depth 20 hashfull 800 multipv 3 nodes 1000000 nps 500000",
      );
      expect(info!.depth).toBe(20);
      expect(info!.hashfull).toBe(800);
      expect(info!.multipv).toBe(3);
      expect(info!.nodes).toBe(1000000);
      expect(info!.nps).toBe(500000);
    });

    it("should parse pv with multiple moves", () => {
      const info = parser.parseInfo("info depth 10 pv 7g7f 3c3d 2g2f");
      expect(info!.pv).toEqual(["7g7f", "3c3d", "2g2f"]);
    });

    it("should preserve raw line", () => {
      const line = "info depth 10 score cp 50";
      const info = parser.parseInfo(line);
      expect(info!.raw).toBe(line);
    });
  });

  // ─── parseInfo: エッジケース ────────────────────────

  describe("parseInfo - edge cases", () => {
    it("should return null for non-info lines", () => {
      expect(parser.parseInfo("bestmove 7g7f")).toBeNull();
    });

    it("should return null for non-string input", () => {
      expect(parser.parseInfo(123 as unknown as string)).toBeNull();
    });

    it("should handle info with only depth (no score)", () => {
      const info = parser.parseInfo("info depth 15");
      expect(info).not.toBeNull();
      expect(info!.depth).toBe(15);
      // score should remain at default initialization
    });
  });

  // ─── parseResult ────────────────────────────────────

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove 7g7f");
      expect(result?.bestMove).toBe("7g7f");
    });

    it("should reject non-standard fullwidth asterisk in bestmove", () => {
      const result = parser.parseResult("bestmove 7g7f＊");
      expect(result).toBeNull();
    });

    it("should return null for non-bestmove lines", () => {
      expect(parser.parseResult("info depth 20")).toBeNull();
    });

    it("should handle bestmove none as null bestMove", () => {
      const result = parser.parseResult("bestmove none");
      expect(result).not.toBeNull();
      expect(result!.bestMove).toBeNull();
    });

    it("should handle bestmove (none) as null bestMove", () => {
      const result = parser.parseResult("bestmove (none)");
      expect(result).not.toBeNull();
      expect(result!.bestMove).toBeNull();
    });
  });

  // ─── createSearchCommand ────────────────────────────

  describe("createSearchCommand", () => {
    it("should throw error for injection in SFEN", () => {
      try {
        parser.createSearchCommand({
          sfen: "startpos\nquit" as unknown as SFEN, // 意図的に不正なキャスト
          depth: 10,
        });
        expect.fail("Should have thrown");
      } catch (e) {
        const err = e as EngineError;
        expect(err.message).toMatch(/Illegal characters detected/);
      }
    });

    it("should create valid search command with SFEN and depth", () => {
      const sfen = createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      );
      const commands = parser.createSearchCommand({ sfen, depth: 15 });
      expect(commands).toEqual([`position sfen ${sfen}`, "go depth 15"]);
    });
  });

  // ─── createOptionCommand ────────────────────────────

  describe("createOptionCommand", () => {
    it("should create valid option command", () => {
      expect(parser.createOptionCommand("USI_Hash", 256)).toBe(
        "setoption name USI_Hash value 256",
      );
    });

    it("should throw error for injection in option name", () => {
      expect(() => parser.createOptionCommand("USI_Hash\nquit", 256)).toThrow(
        /command injection/,
      );
    });

    it("should throw error for injection in option value", () => {
      expect(() => parser.createOptionCommand("USI_Hash", "256\nquit")).toThrow(
        /command injection/,
      );
    });
  });
});

// ─── createSFEN ファクトリ ──────────────────────────

describe("createSFEN", () => {
  it("should return a branded SFEN string for valid input", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    expect(sfen).toBe(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
  });

  it("should throw for an empty string", () => {
    expect(() => createSFEN("")).toThrow(/Invalid SFEN/);
  });

  it("should throw for a whitespace-only string", () => {
    expect(() => createSFEN("   ")).toThrow(/Invalid SFEN/);
  });

  it("should throw for non-string input", () => {
    expect(() => createSFEN(undefined as unknown as string)).toThrow(
      /Invalid SFEN/,
    );
  });
});
