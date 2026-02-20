import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { USIParser } from "../USIParser.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";

describe("USIParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new USIParser();

  describe("parseInfo", () => {
    it("should parse score cp as structured { cp } object", () => {
      const info = parser.parseInfo("info depth 10 score cp 50 pv 7g7f");
      expect(info?.score).toEqual({ cp: 50 });
    });

    it("should parse pv with multiple moves", () => {
      const info = parser.parseInfo("info depth 10 pv 7g7f 3c3d 8h2b+");
      expect(info?.pv).toEqual(["7g7f", "3c3d", "8h2b+"]);
    });
  });

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove 7g7f");
      expect(result?.bestMove).toBe("7g7f");
    });

    it("should handle bestmove none correctly", () => {
      const result = parser.parseResult("bestmove none");
      expect(result?.bestMove).toBe("none");
    });

    it("should handle bestmove (none) correctly", () => {
      const result = parser.parseResult("bestmove (none)");
      expect(result?.bestMove).toBe("(none)");
    });
  });

  describe("createSearchCommand", () => {
    it("should create valid search command with SFEN", () => {
      const sfen = createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      );
      const commands = parser.createSearchCommand({ sfen });
      expect(commands).toEqual([`position sfen ${sfen}`, "go infinite"]);
    });

    it("should create search command with limits", () => {
      const sfen = createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      );
      const commands = parser.createSearchCommand({
        sfen,
        depth: 15,
        time: 1000,
      });
      expect(commands).toEqual([
        `position sfen ${sfen}`,
        "go depth 15 btime 1000 wtime 1000",
      ]);
    });

    it("should throw error for injection in SFEN", () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parser.createSearchCommand({ sfen: "startpos\nquit" as any }),
      ).toThrow(/Potential command injection/);
    });
  });
});
