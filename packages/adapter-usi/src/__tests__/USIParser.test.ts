import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { USIParser } from "../USIParser.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import { createPositionId } from "@multi-game-engines/core";

describe("USIParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new USIParser();

  describe("parseInfo", () => {
    it("should parse score cp as standardized object", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv 7g7f",
        createPositionId("pos1"),
      );
      expect(info?.score).toMatchObject({
        cp: 50,
        unit: "cp",
        normalized: expect.any(Number),
      });
      expect(info?.positionId).toBe("pos1");
    });

    it("should parse mate score with normalization", () => {
      const info = parser.parseInfo("info score mate +");
      expect(info?.score?.normalized).toBe(0.99);
    });

    it("should parse pv with multiple moves", () => {
      const info = parser.parseInfo("info depth 10 pv 7g7f 3c3d 8h2b+");
      expect(info?.pv).toEqual(["7g7f", "3c3d", "8h2b+"]);
    });

    it("should skip invalid PV moves that make createShogiMove throw (catch block)", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 30 pv 7g7f AAAA 3c3d",
      );
      expect(info?.pv).not.toContain("AAAA");
      expect(info?.pv).toContain("7g7f");
    });
  });

  describe("parseResult", () => {
    it("should parse bestmove correctly", () => {
      const result = parser.parseResult("bestmove 7g7f");
      expect(result?.bestMove).toBe("7g7f");
    });

    it("should handle bestmove none correctly", () => {
      const result = parser.parseResult("bestmove none");
      expect(result?.bestMove).toBeNull();
    });

    it("should handle bestmove (none) correctly", () => {
      const result = parser.parseResult("bestmove (none)");
      expect(result?.bestMove).toBeNull();
    });

    it("should parse bestmove with ponder", () => {
      const result = parser.parseResult("bestmove 7g7f ponder 8c8d");
      expect(result?.bestMove).toBe("7g7f");
      expect(result?.ponder).toBe("8c8d");
    });

    it("should throw EngineError for malformed bestmove", () => {
      expect(() => parser.parseResult("bestmove")).toThrow();
    });
  });

  describe("parseInfo — null cases", () => {
    it("should return null for non-info line", () => {
      expect(parser.parseInfo("id name YaneuraOu")).toBeNull();
    });
  });

  describe("translateError", () => {
    it("should translate NNUE load failure", () => {
      const key = parser.translateError("NNUEファイルの読み込みに失敗しました");
      expect(key).toBe("engine.errors.resourceLoadUnknown");
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
      // Intentional bypass using casting to test parser's internal check
      const maliciousSfen =
        "startpos\nquit" as unknown as import("@multi-game-engines/domain-shogi").SFEN;
      expect(() => parser.createSearchCommand({ sfen: maliciousSfen })).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it.each(["\r", "\t", "\0"])(
      "should throw error for control character %j in SFEN",
      (char) => {
        // Use casting to bypass domain validation and reach the parser's check
        const maliciousSfen =
          `lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL${char}b - 1` as unknown as import("@multi-game-engines/domain-shogi").SFEN;
        expect(() =>
          parser.createSearchCommand({
            sfen: maliciousSfen,
          }),
        ).toThrow(
          expect.objectContaining({
            i18nKey: "engine.errors.injectionDetected",
          }),
        );
      },
    );

    it("should throw error for injection in custom fields (index signature)", () => {
      expect(() =>
        parser.createSearchCommand({
          "malicious\nkey": "value",
        }),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should throw error for nested injection", () => {
      expect(() =>
        parser.createSearchCommand({
          nested: {
            "evil\r\nkey": "data",
          },
        }),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should create ponder command without infinite", () => {
      const commands = parser.createSearchCommand({ ponder: true });
      expect(commands).toEqual(["position startpos", "go ponder"]);
    });

    it("should include movetime when movetime option is set", () => {
      const commands = parser.createSearchCommand({ movetime: 3000 });
      expect(commands[1]).toContain("movetime 3000");
    });

    it("should include nodes when nodes option is set", () => {
      const commands = parser.createSearchCommand({ nodes: 1000000 });
      expect(commands[1]).toContain("nodes 1000000");
    });
  });

  describe("createOptionCommand", () => {
    it("should create valid option command", () => {
      expect(parser.createOptionCommand("Hash", 128)).toBe(
        "setoption name Hash value 128",
      );
    });

    it("should throw on injection in option name", () => {
      expect(() => parser.createOptionCommand("Hash\nquit", 128)).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should throw on injection in option value", () => {
      // Testing injection via string value
      expect(() => parser.createOptionCommand("Hash", "128\nquit")).toThrow(
        /Potential command injection/,
      );
    });
  });

  describe("parseInfo – currmove and additional cases", () => {
    it("should parse currmove token for valid shogi move", () => {
      const info = parser.parseInfo("info depth 5 currmove 7g7f score cp 30");
      expect(info?.currMove).toBe("7g7f");
    });

    it("should skip invalid currmove token and continue parsing", () => {
      const info = parser.parseInfo(
        "info depth 5 currmove INVALID_MOVE score cp 30",
      );
      expect(info?.currMove).toBeUndefined();
      expect(info?.depth).toBe(5);
    });

    it("should return null for non-string input", () => {
      expect(parser.parseInfo({ type: "info" })).toBeNull();
    });

    it("should parse mate - score", () => {
      const info = parser.parseInfo("info score mate -");
      expect(info?.score?.normalized).toBe(-0.99);
    });

    it("should parse all numeric tokens together", () => {
      const info = parser.parseInfo(
        "info depth 12 seldepth 15 time 250 nodes 50000 nps 200000 hashfull 5 multipv 1 score cp 30",
      );
      expect(info?.depth).toBe(12);
      expect(info?.seldepth).toBe(15);
      expect(info?.time).toBe(250);
      expect(info?.nodes).toBe(50000);
      expect(info?.nps).toBe(200000);
      expect(info?.hashfull).toBe(5);
      expect(info?.multipv).toBe(1);
    });
  });

  describe("parseResult – additional cases", () => {
    it("should throw EngineError for 'bestmove' with no move token", () => {
      expect(() => parser.parseResult("bestmove")).toThrow();
    });

    it("should set ponder to null when ponder injection is detected", () => {
      const result = parser.parseResult("bestmove 7g7f ponder bad\0move");
      expect(result?.bestMove).toBe("7g7f");
      expect(result?.ponder).toBeNull();
    });

    it("should set ponder to null when ponder token is 'none'", () => {
      const result = parser.parseResult("bestmove 7g7f ponder none");
      expect(result?.bestMove).toBe("7g7f");
      expect(result?.ponder).toBeNull();
    });

    it("should set ponder to null when ponder token is '(none)'", () => {
      const result = parser.parseResult("bestmove 7g7f ponder (none)");
      expect(result?.bestMove).toBe("7g7f");
      expect(result?.ponder).toBeNull();
    });
  });

  describe("createStopCommand", () => {
    it("should return 'stop'", () => {
      expect(parser.createStopCommand()).toBe("stop");
    });
  });

  describe("translateError – additional cases", () => {
    it("should translate English NNUE not found", () => {
      const key = parser.translateError("Error: NNUE file not found");
      expect(key).toBe("engine.errors.missingSources");
    });

    it("should return null for unknown error", () => {
      expect(parser.translateError("Generic engine error")).toBeNull();
    });
  });
});
