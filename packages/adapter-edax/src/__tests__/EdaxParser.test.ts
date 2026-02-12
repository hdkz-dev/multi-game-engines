import { describe, it, expect } from "vitest";
import { EdaxParser } from "../EdaxParser.js";
import { Move } from "@multi-game-engines/core";

describe("EdaxParser", () => {
  const parser = new EdaxParser();

  it("Edax の思考状況を正しくパースできること", () => {
    const line = "Depth: 12  Mid: +4  move: c3";
    const info = parser.parseInfo(line);
    expect(info?.depth).toBe(12);
    expect(info?.score).toBe(4);
  });
});
