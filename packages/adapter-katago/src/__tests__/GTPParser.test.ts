import { describe, it, expect } from "vitest";
import { GTPParser } from "../GTPParser.js";

describe("GTPParser", () => {
  const parser = new GTPParser();

  it("should parse info correctly", () => {
    const info = parser.parseInfo("= info depth 10");
    expect(info).toBeDefined();
  });

  it("should parse result correctly", () => {
    const result = parser.parseResult("= bestmove D4");
    expect(result).toBeDefined();
  });
});
