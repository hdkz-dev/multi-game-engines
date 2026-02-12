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
    const line = "info depth 5 score mate 3 nodes 100";
    const info = parser.parseInfo(line);
    expect(info?.score).toBe(30000); // 3 * 10000
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

  it("should parse bestmove and ponder correctly", () => {
    const line = "bestmove e2e4 ponder e7e5";
    const result = parser.parseResult(line);
    expect(result?.bestMove).toBe("e2e4");
    expect(result?.ponder).toBe("e7e5");
  });

  it("should prevent UCI command injection in FEN by filtering restricted characters", () => {
    // 改行、セミコロン、ヌル文字を含む悪意のある FEN 文字列
    const maliciousFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1\nquit; \0" as FEN;
    const cmds = parser.createSearchCommand({ fen: maliciousFen });
    
    // 全ての不正な文字が削除されていることを確認
    expect(cmds[0]).not.toContain("\n");
    expect(cmds[0]).not.toContain(";");
    expect(cmds[0]).not.toContain("\0");
    expect(cmds[0]).toBe("position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1quit ");
  });
});
