import { describe, it, expect } from "vitest";
import { GTPParser } from "../GTPParser.js";
import { Move } from "@multi-game-engines/core";

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
  });
});
