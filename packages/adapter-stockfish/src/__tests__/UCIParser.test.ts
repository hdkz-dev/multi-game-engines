import { describe, it, expect } from "vitest";
import { UCIParser, FEN } from "../UCIParser.js";

describe("UCIParser", () => {
  const parser = new UCIParser();

  it("should parse info depth correctly", () => {
    const info = parser.parseInfo("info depth 20");
    expect(info?.raw).toBe("info depth 20");
    expect(info?.depth).toBe(20);
  });

  it("should parse info with score and pv", () => {
    const info = parser.parseInfo(
      "info depth 15 score cp 30 nps 1000000 time 500 pv e2e4 e7e5",
    );
    expect(info?.depth).toBe(15);
    expect(info?.score).toBe(30);
    expect(info?.nps).toBe(1000000);
    expect(info?.time).toBe(500);
    expect(info?.pv).toEqual(["e2e4", "e7e5"]);
  });

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

  it("should return null for non-info lines", () => {
    expect(parser.parseInfo("bestmove e2e4")).toBeNull();
  });

  it("should return null for non-bestmove lines", () => {
    expect(parser.parseResult("info depth 20")).toBeNull();
  });

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
