import { describe, it, expect } from "vitest";
import { EdaxParser } from "../protocols/EdaxParser";
import { Move, OthelloBoard } from "../types";

describe("EdaxParser", () => {
  const parser = new EdaxParser();

  it("Edax の思考状況を正しくパースできること (中盤)", () => {
    const line = "Depth: 12  Mid: +4  move: c3";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    expect(info?.depth).toBe(12);
    expect(info?.score).toBe(4);
    expect(info?.isExact).toBe(false);
    expect(info?.pv).toEqual(["c3"]);
  });

  it("Edax の思考状況を正しくパースできること (終盤)", () => {
    const line = "Depth: 20  Exact: -2  move: f5";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    expect(info?.score).toBe(-2);
    expect(info?.isExact).toBe(true);
  });

  it("最終結果をパースできること", () => {
    expect(parser.parseResult("= c3")?.bestMove).toBe("c3" as Move);
    expect(parser.parseResult("F5")?.bestMove).toBe("f5" as Move);
  });

  it("探索コマンドを生成できること", () => {
    const options = { 
      board: "---------------------------OX------XO---------------------------" as OthelloBoard,
      isBlack: true,
      depth: 15
    };
    const commands = parser.createSearchCommand(options);
    expect(commands).toContain("setboard ---------------------------OX------XO--------------------------- B");
    expect(commands).toContain("go 15");
  });
});
