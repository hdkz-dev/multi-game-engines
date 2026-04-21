/**
 * Mahjong – official rules edge case tests.
 *
 * Move format: [1-9][mpsz] | tsumo | ron | riichi | chi | pon | kan | kakan | nuki | none
 *   - [1-9][m]: manzu (characters 1m-9m)
 *   - [1-9][p]: pinzu (circles 1p-9p)
 *   - [1-9][s]: souzu (bamboo 1s-9s)
 *   - [1-9][z]: honor tiles (1z-7z = East/South/West/North/Haku/Hatsu/Chun)
 *     Note: 8z-9z are invalid in Japanese Mahjong but the regex [1-9][z]
 *     allows them — this test documents implementation behavior.
 *
 * validateMahjongBoard recursion depth limit = 10 (throws at depth > 10).
 */
import { describe, it, expect } from "vitest";
import {
  createMahjongMove,
  validateMahjongBoard,
  MAHJONG_MOVE_REGEX,
} from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createMahjongMove – valid tiles
// ---------------------------------------------------------------------------
describe("createMahjongMove – all valid tile types", () => {
  it("accepts all 9 manzu tiles (1m-9m)", () => {
    for (let n = 1; n <= 9; n++) {
      expect(createMahjongMove(`${n}m`)).toBe(`${n}m`);
    }
  });

  it("accepts all 9 pinzu tiles (1p-9p)", () => {
    for (let n = 1; n <= 9; n++) {
      expect(createMahjongMove(`${n}p`)).toBe(`${n}p`);
    }
  });

  it("accepts all 9 souzu tiles (1s-9s)", () => {
    for (let n = 1; n <= 9; n++) {
      expect(createMahjongMove(`${n}s`)).toBe(`${n}s`);
    }
  });

  it("accepts honor tiles 1z-7z (valid in Japanese Mahjong)", () => {
    for (let n = 1; n <= 7; n++) {
      expect(createMahjongMove(`${n}z`)).toBe(`${n}z`);
    }
  });

  it("accepts 8z and 9z (implementation allows [1-9][z])", () => {
    // These are outside standard Japanese Mahjong but the regex accepts them
    expect(createMahjongMove("8z")).toBe("8z");
    expect(createMahjongMove("9z")).toBe("9z");
  });
});

describe("createMahjongMove – all valid action words", () => {
  const actions = [
    "tsumo",
    "ron",
    "riichi",
    "chi",
    "pon",
    "kan",
    "kakan",
    "nuki",
    "none",
  ];
  for (const action of actions) {
    it(`accepts '${action}'`, () => {
      expect(createMahjongMove(action)).toBe(action);
    });
  }
});

// ---------------------------------------------------------------------------
// createMahjongMove – invalid inputs
// ---------------------------------------------------------------------------
describe("createMahjongMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for '0m' (row 0 not valid)", () => {
    expect(() => createMahjongMove("0m")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for '10m' (two-digit number not valid)", () => {
    expect(() => createMahjongMove("10m")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createMahjongMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createMahjongMove("  ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character injection", () => {
    expect(() => createMahjongMove("1m\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for uppercase action 'TSUMO'", () => {
    expect(() => createMahjongMove("TSUMO")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for invalid suit '1x'", () => {
    expect(() => createMahjongMove("1x")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createMahjongMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// MAHJONG_MOVE_REGEX constant
// ---------------------------------------------------------------------------
describe("MAHJONG_MOVE_REGEX – spot checks", () => {
  it("matches all valid tiles and actions", () => {
    expect(MAHJONG_MOVE_REGEX.test("1m")).toBe(true);
    expect(MAHJONG_MOVE_REGEX.test("9z")).toBe(true);
    expect(MAHJONG_MOVE_REGEX.test("tsumo")).toBe(true);
    expect(MAHJONG_MOVE_REGEX.test("none")).toBe(true);
  });

  it("does not match empty, invalid or partial strings", () => {
    expect(MAHJONG_MOVE_REGEX.test("")).toBe(false);
    expect(MAHJONG_MOVE_REGEX.test("0m")).toBe(false);
    expect(MAHJONG_MOVE_REGEX.test("10m")).toBe(false);
    expect(MAHJONG_MOVE_REGEX.test("1x")).toBe(false);
    expect(MAHJONG_MOVE_REGEX.test("TSUMO")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateMahjongBoard – depth and structure
// ---------------------------------------------------------------------------
describe("validateMahjongBoard – recursion depth", () => {
  it("accepts structure where leaf strings reach depth 10 (depth > 10 throws)", () => {
    // buildNested(n) builds n wrappers; the leaf string is reached at depth n+1.
    // MAX_DEPTH=10: depth > 10 throws. So leaf at depth 10 is fine (9 wrappers).
    const buildNested = (depth: number): Record<string, unknown> => {
      if (depth === 0) return { tile: "1m" };
      return { child: buildNested(depth - 1) };
    };
    expect(() => validateMahjongBoard(buildNested(9))).not.toThrow();
  });

  it("throws VALIDATION_ERROR for structure whose leaf reaches depth 11 (10 wrappers)", () => {
    const buildNested = (depth: number): Record<string, unknown> => {
      if (depth === 0) return { tile: "1m" };
      return { child: buildNested(depth - 1) };
    };
    expect(() => validateMahjongBoard(buildNested(10))).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.nestedTooDeep",
      }),
    );
  });
});

describe("validateMahjongBoard – value types", () => {
  it("passes for numbers in board (not validated as strings)", () => {
    expect(() => validateMahjongBoard({ score: 100 })).not.toThrow();
  });

  it("passes for booleans in board", () => {
    expect(() => validateMahjongBoard({ riichi: true })).not.toThrow();
  });

  it("passes for null values in board", () => {
    expect(() => validateMahjongBoard({ lastDraw: null })).not.toThrow();
  });

  it("passes for empty array", () => {
    expect(() => validateMahjongBoard([])).not.toThrow();
  });

  it("passes for deeply nested clean strings", () => {
    expect(() =>
      validateMahjongBoard({
        hand: ["1m", "2p", "3s"],
        discards: { p1: ["7z", "1m"], p2: ["9s"] },
        dora: "5m",
      }),
    ).not.toThrow();
  });

  it("throws SECURITY_ERROR for injection in deeply nested array element", () => {
    expect(() =>
      validateMahjongBoard({
        p1: {
          hand: ["1m", "bad\0tile"],
        },
      }),
    ).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for injection in deeply nested object value", () => {
    expect(() =>
      validateMahjongBoard({
        meta: { comment: "stop\nengine" },
      }),
    ).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("passes for top-level array of tiles", () => {
    expect(() => validateMahjongBoard(["1m", "2p", "3s", "4z"])).not.toThrow();
  });
});
