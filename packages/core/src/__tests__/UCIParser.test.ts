import { describe, it, expect } from "vitest";
import { UCIParser } from "../protocols/UCIParser";
import { FEN } from "../types";

describe("UCIParser", () => {
  const parser = new UCIParser();

  it("should parse info lines correctly", () => {
    const line = "info depth 10 score cp 50 nps 100000 time 500 pv e2e4 e7e5";
    const info = parser.parseInfo(line);
    
    expect(info).toBeDefined();
    expect(info?.depth).toBe(10);
    expect(info?.score).toBe(50);
    expect(info?.nps).toBe(100000);
    expect(info?.time).toBe(500);
    expect(info?.pv).toEqual(["e2e4", "e7e5"]);
  });

  it("should handle incomplete info lines without crashing", () => {
    const line = "info depth";
    const info = parser.parseInfo(line);
    expect(info?.depth).toBe(0);
  });

  it("should create correct search command array", () => {
    const options = {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN,
      depth: 15,
      time: 1000,
    };
    const cmds = parser.createSearchCommand(options);
    expect(Array.isArray(cmds)).toBe(true);
    expect(cmds[0]).toBe("position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(cmds[1]).toBe("go depth 15 movetime 1000");
  });

  it("should prevent UCI command injection in FEN", () => {
    const options = {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1\nstop" as FEN,
    };
    const cmds = parser.createSearchCommand(options);
    expect(cmds[0]).not.toContain("\n");
    expect(cmds[0]).toBe("position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1stop");
  });
});
