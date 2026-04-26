import { describe, it, expect } from "vitest";
import { JanggiParser } from "../JanggiParser.js";
import {
  createPositionId,
  createPositionString,
} from "@multi-game-engines/core";

describe("JanggiParser", () => {
  const parser = new JanggiParser();

  describe("createSearchCommand", () => {
    it("should return ['go'] when no position is provided", () => {
      const cmd = parser.createSearchCommand({} as never);
      expect(cmd).toEqual(["go"]);
    });

    it("should include position command when position is set", () => {
      const position = createPositionString("startpos");
      const cmd = parser.createSearchCommand({ position } as never);
      expect(cmd).toEqual([`position ${position}`, "go"]);
    });

    it("should throw on injection in search options", () => {
      expect(() =>
        parser.createSearchCommand({ position: "startpos\nstop" } as never),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });

  describe("createStopCommand", () => {
    it("should return 'stop'", () => {
      expect(parser.createStopCommand()).toBe("stop");
    });
  });

  describe("createOptionCommand", () => {
    it("should format setoption command correctly", () => {
      const cmd = parser.createOptionCommand("Hash", 128);
      expect(cmd).toBe("setoption name Hash value 128");
    });

    it("should format string value options", () => {
      const cmd = parser.createOptionCommand("BookFile", "/path/to/book.bin");
      expect(cmd).toBe("setoption name BookFile value /path/to/book.bin");
    });

    it("should throw on injection in option name or value", () => {
      expect(() => parser.createOptionCommand("Hash\nstop", 128)).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    });
  });

  describe("parseInfo", () => {
    it("should parse score cp", () => {
      const info = parser.parseInfo(
        "info depth 10 score cp 50 pv a0a1",
        createPositionId("pos1"),
      );
      expect(info?.score).toMatchObject({
        cp: 50,
        unit: "cp",
        normalized: expect.any(Number),
      });
      expect(info?.positionId).toBe("pos1");
    });

    it("should parse score mate", () => {
      const info = parser.parseInfo(
        "info depth 5 score mate 3 pv a0a1",
        createPositionId("pos1"),
      );
      expect(info?.score).toMatchObject({
        mate: 3,
        unit: "mate",
        normalized: expect.any(Number),
      });
    });

    it("should parse depth, nodes, nps", () => {
      const info = parser.parseInfo(
        "info depth 12 nodes 50000 nps 100000 score cp 10",
        createPositionId("pos2"),
      );
      expect(info?.depth).toBe(12);
      expect(info?.nodes).toBe(50000);
      expect(info?.nps).toBe(100000);
    });

    it("should return null for non-string data", () => {
      expect(parser.parseInfo({ type: "info" })).toBeNull();
    });

    it("should return null for non-info lines", () => {
      expect(parser.parseInfo("bestmove a0a1")).toBeNull();
    });

    it("should parse pv moves", () => {
      const info = parser.parseInfo(
        "info depth 5 score cp 10 pv a0a1 b1c1",
        createPositionId("pos1"),
      );
      expect(info?.pv).toHaveLength(2);
    });
  });

  describe("parseInfo – PV catch block", () => {
    it("should skip PV moves that make createJanggiMove throw (catch block)", () => {
      const info = parser.parseInfo(
        "info depth 5 score cp 10 pv a0a1 INVALID_MOVE",
      );
      expect(info?.pv).not.toContain("INVALID_MOVE");
      expect(info?.pv).toContain("a0a1");
    });
  });

  describe("parseResult", () => {
    it("should parse bestmove", () => {
      const result = parser.parseResult("bestmove a0a1");
      expect(result?.bestMove).toBe("a0a1");
    });

    it("should return null for non-string data", () => {
      expect(parser.parseResult({ type: "result" })).toBeNull();
    });

    it("should return null for non-bestmove lines", () => {
      expect(parser.parseResult("info depth 10")).toBeNull();
    });
  });
});
