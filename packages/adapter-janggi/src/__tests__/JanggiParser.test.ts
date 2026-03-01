import { describe, it, expect, vi } from "vitest";
import { JanggiParser } from "../JanggiParser.js";
import { PositionId } from "@multi-game-engines/core";

describe("JanggiParser", () => {
  const parser = new JanggiParser();

  describe("parseInfo", () => {
    it("should parse score cp", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv a0a1",
        "pos1" as PositionId,
      );
      expect(info?.score).toMatchObject({
        cp: 50,
        unit: "cp",
        normalized: expect.any(Number),
      });
      expect(info?.positionId).toBe("pos1");
    });
  });

  describe("parseResult", () => {
    it("should parse bestmove", () => {
      const result = parser.parseResult("bestmove a0a1");
      expect(result?.bestMove).toBe("a0a1");
    });
  });
});
