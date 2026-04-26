import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { UCIParser } from "../UCIParser.js";
import { createFEN } from "@multi-game-engines/domain-chess";
import { createPositionId } from "@multi-game-engines/core";

describe("UCIParser", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const parser = new UCIParser();

  describe("parseInfo", () => {
    it("should parse positive cp score as standardized object", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv e2e4",
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
      const info = parser.parseInfo("info depth 5 score mate 3 pv e2e4");
      expect(info?.score).toMatchObject({
        mate: 3,
        unit: "mate",
        normalized: 0.99,
      });
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
      expect(info?.score).toMatchObject({ cp: -120, unit: "cp" });
    });

    it("should parse negative mate score", () => {
      const info = parser.parseInfo("info depth 5 score mate -2 pv d7d5");
      expect(info?.score).toMatchObject({
        mate: -2,
        unit: "mate",
        normalized: -0.99,
      });
    });

    it("should parse info line without PV", () => {
      const info = parser.parseInfo("info depth 10 score cp 50");
      expect(info?.score).toMatchObject({ cp: 50 });
      expect(info?.pv).toBeUndefined();
    });
  });

  describe("translateError", () => {
    it("should translate NNUE not found error", () => {
      const key = parser.translateError("Error: NNUE file not found");
      expect(key).toBe("engine.errors.missingSources");
    });

    it("should return null for unknown error", () => {
      const key = parser.translateError("Some weird engine error");
      expect(key).toBeNull();
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
          expect.objectContaining({
            i18nKey: "engine.errors.injectionDetected",
          }),
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

    it("should throw INTERNAL_ERROR when fen is not provided", () => {
      expect(() =>
        parser.createSearchCommand(
          {} as Parameters<typeof parser.createSearchCommand>[0],
        ),
      ).toThrow(expect.objectContaining({ code: "INTERNAL_ERROR" }));
    });

    it("should prefix position command with 'position fen'", () => {
      const fen = createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      const commands = parser.createSearchCommand({ fen, depth: 5 });
      expect(commands[0]).toMatch(/^position fen /);
    });

    it("should include movetime when time option is set", () => {
      const fen = createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      const commands = parser.createSearchCommand({ fen, time: 2000 });
      expect(commands[1]).toBe("go movetime 2000");
    });

    it("should include nodes when nodes option is set", () => {
      const fen = createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      const commands = parser.createSearchCommand({ fen, nodes: 500000 });
      expect(commands[1]).toBe("go nodes 500000");
    });

    it("should combine depth, time, and nodes in go command", () => {
      const fen = createFEN(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      const commands = parser.createSearchCommand({
        fen,
        depth: 10,
        time: 1000,
        nodes: 100000,
      });
      expect(commands[1]).toContain("depth 10");
      expect(commands[1]).toContain("movetime 1000");
      expect(commands[1]).toContain("nodes 100000");
    });
  });

  describe("createOptionCommand", () => {
    it("should create valid setoption command", () => {
      expect(parser.createOptionCommand("Hash", 256)).toBe(
        "setoption name Hash value 256",
      );
    });

    it("should create setoption command with boolean value", () => {
      expect(parser.createOptionCommand("Ponder", true)).toBe(
        "setoption name Ponder value true",
      );
    });

    it("should throw on injection in option name", () => {
      expect(() => parser.createOptionCommand("Hash\nquit", 256)).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });

    it("should throw on injection in option value", () => {
      expect(() => parser.createOptionCommand("Hash", "256\nstop")).toThrow(
        /Potential command injection/,
      );
    });
  });

  describe("parseInfo – additional tokens", () => {
    it("should parse hashfull token", () => {
      const info = parser.parseInfo("info depth 10 hashfull 500 score cp 30");
      expect(info?.hashfull).toBe(500);
    });

    it("should parse seldepth token", () => {
      const info = parser.parseInfo("info depth 10 seldepth 14 score cp 30");
      expect(info?.seldepth).toBe(14);
    });

    it("should parse multipv token", () => {
      const info = parser.parseInfo(
        "info depth 10 multipv 2 score cp 20 pv d2d4",
      );
      expect(info?.multipv).toBe(2);
    });

    it("should parse nps token", () => {
      const info = parser.parseInfo("info depth 10 nps 1500000 score cp 30");
      expect(info?.nps).toBe(1500000);
    });

    it("should parse nodes token", () => {
      const info = parser.parseInfo("info depth 10 nodes 200000 score cp 30");
      expect(info?.nodes).toBe(200000);
    });

    it("should parse time token", () => {
      const info = parser.parseInfo("info depth 10 time 500 score cp 30");
      expect(info?.time).toBe(500);
    });

    it("should return null for non-string input", () => {
      expect(parser.parseInfo({ type: "info" })).toBeNull();
    });

    it("should return null for line not starting with 'info '", () => {
      expect(parser.parseInfo("bestmove e2e4")).toBeNull();
      expect(parser.parseInfo("id name Engine")).toBeNull();
    });

    it("should skip '0000' null move in PV", () => {
      const info = parser.parseInfo(
        "info depth 5 score cp 10 pv e2e4 0000 g1f3",
      );
      expect(info?.pv).not.toContain("0000");
      expect(info?.pv).toContain("e2e4");
    });

    it("should stop PV collection at next UCI info token", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 30 pv e2e4 e7e5 multipv 1",
      );
      expect(info?.pv?.length).toBe(2);
    });
  });

  describe("parseResult – additional cases", () => {
    it("should parse valid ponder move", () => {
      const result = parser.parseResult("bestmove e2e4 ponder e7e5");
      expect(result?.bestMove).toBe("e2e4");
      expect(result?.ponder).toBe("e7e5");
    });

    it("should set ponder to null when ponder is 'none'", () => {
      const result = parser.parseResult("bestmove e2e4 ponder none");
      expect(result?.ponder).toBeNull();
    });

    it("should set ponder to null when ponder is '(none)'", () => {
      const result = parser.parseResult("bestmove e2e4 ponder (none)");
      expect(result?.ponder).toBeNull();
    });

    it("should set ponder to null for invalid ponder move format", () => {
      const result = parser.parseResult("bestmove e2e4 ponder invalid_move!!");
      expect(result?.bestMove).toBe("e2e4");
      expect(result?.ponder).toBeNull();
    });

    it("should return null for non-string input", () => {
      expect(parser.parseResult({ type: "bestmove" })).toBeNull();
    });

    it("should return null for invalid bestmove format", () => {
      expect(parser.parseResult("bestmove invalid_move!!")).toBeNull();
    });

    it("should return null for line not starting with 'bestmove '", () => {
      expect(parser.parseResult("info depth 10")).toBeNull();
    });

    it("should set ponder to null when ponder token has injection characters (catch block)", () => {
      const result = parser.parseResult("bestmove e2e4 ponder \x00poison");
      expect(result?.bestMove).toBe("e2e4");
      expect(result?.ponder).toBeNull();
    });
  });

  describe("createStopCommand", () => {
    it("should return 'stop'", () => {
      expect(parser.createStopCommand()).toBe("stop");
    });
  });

  describe("translateError – additional cases", () => {
    it("should translate 'invalid option' error", () => {
      const key = parser.translateError("Error: invalid option value");
      expect(key).toBe("parsers.generic.invalidOptionValue");
    });

    it("should return null for error message without known pattern", () => {
      expect(parser.translateError("Unknown engine error")).toBeNull();
    });
  });
});
