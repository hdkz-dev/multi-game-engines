import { describe, it, expect } from "vitest";
import { MahjongJSONParser } from "../protocols/MahjongJSONParser";
import { MahjongTile, Move } from "../types";

describe("MahjongJSONParser", () => {
  const parser = new MahjongJSONParser();

  it("JSON 形式の思考状況をパースできること", () => {
    const data = JSON.stringify({
      type: "info",
      depth: 5,
      score: 100,
      evaluations: [
        { move: "1m", ev: 0.5, prob: 0.8 },
        { move: "chun", ev: -0.2, prob: 0.1 }
      ]
    });
    
    const info = parser.parseInfo(data);
    expect(info).not.toBeNull();
    expect(info?.depth).toBe(5);
    expect(info?.evaluations?.[0].move).toBe("1m" as Move);
  });

  it("JSON 形式の最終結果をパースできること", () => {
    const data = JSON.stringify({
      type: "result",
      bestMove: "nan",
      ponder: "chun"
    });
    
    const result = parser.parseResult(data);
    expect(result?.bestMove).toBe("nan" as Move);
    expect(result?.ponder).toBe("chun" as Move);
  });

  it("探索コマンドを正しく JSON 文字列化できること", () => {
    const options = {
      hand: ["1m", "2m", "3m"] as MahjongTile[],
      dora: ["chun"] as MahjongTile[]
    };
    const cmd = parser.createSearchCommand(options);
    const json = JSON.parse(cmd);
    expect(json.type).toBe("search");
    expect(json.hand).toEqual(["1m", "2m", "3m"]);
  });
});
