import { describe, it, expect } from "vitest";
import { GTPParser } from "../GTPParser.js";

describe("GTPParser", () => {
  const parser = new GTPParser();

  it("should parse info correctly", () => {
    const info = parser.parseInfo("info visits 100 winrate 0.55");
    expect(info).not.toBeNull();
    expect(info!.visits).toBe(100);
    expect(info!.winrate).toBe(0.55);
  });

  it("should parse result correctly", () => {
    const result = parser.parseResult("= D4");
    expect(result).not.toBeNull();
    expect(result!.bestMove).toBe("D4");
  });
});
