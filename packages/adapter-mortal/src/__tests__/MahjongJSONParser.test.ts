import { describe, it, expect } from "vitest";
import { MahjongJSONParser } from "../MahjongJSONParser.js";
import { Move } from "@multi-game-engines/core";

describe("MahjongJSONParser", () => {
  const parser = new MahjongJSONParser();

  it("JSON 形式の思考状況をパースできること", () => {
    const data = JSON.stringify({
      type: "info",
      evaluations: [{ move: "1m", ev: 0.5 }]
    });
    const info = parser.parseInfo(data);
    expect(info?.evaluations?.[0].move).toBe("1m" as Move);
  });
});
