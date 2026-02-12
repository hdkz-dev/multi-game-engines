import { describe, it, expect } from "vitest";
import { GTPParser } from "../protocols/GTPParser";
import { Move, SGF } from "../types";

describe("GTPParser", () => {
  const parser = new GTPParser();

  it("GTP の最終結果を正しくパースできること", () => {
    const line = "= q16";
    const result = parser.parseResult(line);
    expect(result).not.toBeNull();
    expect(result?.bestMove).toBe("q16" as Move);
  });

  it("lz-analyze 形式の思考状況をパースできること", () => {
    const line = "info move q16 visits 1000 winrate 0.55";
    const info = parser.parseInfo(line);
    expect(info).not.toBeNull();
    expect(info?.visits).toBe(1000);
    expect(info?.winrate).toBe(0.55);
    expect(info?.score).toBe(Math.round((0.55 - 0.5) * 2000));
  });

  it("不正な形式の行は無視すること", () => {
    expect(parser.parseInfo("unknown command")).toBeNull();
    expect(parser.parseResult("? error")).toBeNull();
  });

  it("探索コマンドを正しく生成できること", () => {
    const options = { sgf: "(;SZ[19]...) " as SGF };
    const commands = parser.createSearchCommand(options);
    expect(commands).toContain("loadsgf (;SZ[19]...) ");
    expect(commands).toContain("lz-analyze 50");
  });
});
