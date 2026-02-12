import { describe, it, expect } from "vitest";
import { USIParser } from "../protocols/USIParser";
import { SFEN } from "../types";

describe("USIParser", () => {
  const parser = new USIParser();

  it("info 行を正しく解析できること", () => {
    const line = "info depth 10 score cp 50 nodes 100000 nps 10000 time 500 pv 7g7f 3c3d";
    const info = parser.parseInfo(line);
    
    expect(info).toBeDefined();
    expect(info?.depth).toBe(10);
    expect(info?.score).toBe(50);
    expect(info?.time).toBe(500);
    expect(info?.pv).toEqual(["7g7f", "3c3d"]);
  });

  it("should parse mate scores correctly", () => {
    const line = "info depth 5 score mate 2 nodes 100";
    const info = parser.parseInfo(line);
    expect(info?.score).toBe(200000); // 2 * 100000
  });

  it("bestmove 行を正しく解析できること", () => {
    const line = "bestmove 7g7f ponder 3c3d";
    const result = parser.parseResult(line);
    
    expect(result).toBeDefined();
    expect(result?.bestMove).toBe("7g7f");
    expect(result?.ponder).toBe("3c3d");
  });

  it("探索コマンドを正しく生成できること", () => {
    const options = {
      sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1" as SFEN,
      depth: 5,
      btime: 1000,
      wtime: 2000,
      byoyomi: 100,
    };
    
    const cmds = parser.createSearchCommand(options);
    expect(cmds[0]).toBe("position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");
    expect(cmds[1]).toBe("go depth 5");
  });

  it("時間制御コマンドを正しく生成できること (depthなし)", () => {
    const options = {
      sfen: "startpos" as SFEN,
      btime: 1000,
      wtime: 2000,
      byoyomi: 100,
    };
    
    const cmds = parser.createSearchCommand(options);
    expect(cmds[1]).toBe("go btime 1000 wtime 2000 byoyomi 100");
  });
});
