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

  it("should parse mate scores correctly", () => {
    const line = "info depth 5 score mate 3";
    const info = parser.parseInfo(line);
    expect(info?.score).toBe(30000);
  });

  it("should parse bestmove lines correctly", () => {
    const line = "bestmove e2e4 ponder e7e5";
    const result = parser.parseResult(line);
    
    expect(result).toBeDefined();
    expect(result?.bestMove).toBe("e2e4");
    expect(result?.ponder).toBe("e7e5");
  });

  it("should create correct search commands", () => {
    const options = {
      // 意味のあるブランド型へのキャストに変更
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN,
      depth: 15,
      time: 1000,
    };
    const cmd = parser.createSearchCommand(options);
    expect(cmd).toContain("position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(cmd).toContain("go depth 15 movetime 1000");
  });
});
