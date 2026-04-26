/**
 * Shogi (SFEN/USI) – official rules edge case tests.
 *
 * USI move formats:
 *   Normal:  [1-9][a-i][1-9][a-i]  (col/row  col/row, e.g. 7g7f)
 *   Promote: [1-9][a-i][1-9][a-i]+ (with trailing +)
 *   Drop:    [PLNSGRB]*[1-9][a-i]  (uppercase piece, star, destination)
 *   Special: resign | win | none | (none)
 *
 * SFEN: <board> <turn> <hand> <move-counter>
 *   - turn: b (Sente/Black) | w (Gote/White)
 *   - hand: "-" or combinations like "2P3p" (uppercase=Sente, lowercase=Gote)
 *   - move-counter: integer >= 1
 */
import { describe, it, expect } from "vitest";
import {
  createShogiMove,
  createSFEN,
  parseSFEN,
  isValidShogiPiece,
  isShogiHandKey,
  SFEN,
} from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

// ---------------------------------------------------------------------------
// createShogiMove – all valid formats
// ---------------------------------------------------------------------------
describe("createShogiMove – valid inputs", () => {
  it("normal move: 7g7f", () => expect(createShogiMove("7g7f")).toBe("7g7f"));
  it("normal move with promotion: 8h2b+", () =>
    expect(createShogiMove("8h2b+")).toBe("8h2b+"));
  it("column boundary 1a to 9i", () => {
    expect(createShogiMove("1a1b")).toBe("1a1b");
    expect(createShogiMove("9i9h")).toBe("9i9h");
  });
  it("drop move – all valid piece types: P L N S G R B", () => {
    for (const p of ["P", "L", "N", "S", "G", "R", "B"]) {
      expect(createShogiMove(`${p}*3d`)).toBe(`${p}*3d`);
    }
  });
  it("special move: resign", () =>
    expect(createShogiMove("resign")).toBe("resign"));
  it("special move: win", () => expect(createShogiMove("win")).toBe("win"));
  it("special move: none", () => expect(createShogiMove("none")).toBe("none"));
  it("special move: (none)", () =>
    expect(createShogiMove("(none)")).toBe("(none)"));
});

describe("createShogiMove – invalid inputs", () => {
  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createShogiMove("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createShogiMove("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string input", () => {
    expect(() => createShogiMove(null as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for control character \\n", () => {
    expect(() => createShogiMove("7g7f\nstop")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for null byte injection", () => {
    expect(() => createShogiMove("7g7f\0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for column 0 (out of range)", () => {
    expect(() => createShogiMove("0g7f")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for invalid rank j", () => {
    expect(() => createShogiMove("7j7f")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for lowercase drop piece 'p*3d'", () => {
    expect(() => createShogiMove("p*3d")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for invalid drop piece 'K*3d' (King cannot be dropped)", () => {
    expect(() => createShogiMove("K*3d")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 'RESIGN' (must be lowercase)", () => {
    expect(() => createShogiMove("RESIGN")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for move with double-plus '7g7f++'", () => {
    expect(() => createShogiMove("7g7f++")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// createSFEN – valid inputs
// ---------------------------------------------------------------------------
describe("createSFEN – valid inputs", () => {
  const INITIAL_SFEN =
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

  it("accepts initial position", () => {
    expect(() => createSFEN(INITIAL_SFEN)).not.toThrow();
  });

  it("accepts hand with Sente pieces '2P'", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "b 2P 1")),
    ).not.toThrow();
  });

  it("accepts hand with Gote pieces '3p'", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "b 3p 1")),
    ).not.toThrow();
  });

  it("accepts hand with mixed pieces '2P3pB'", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "b 2P3pB 1")),
    ).not.toThrow();
  });

  it("accepts hand with single piece count implied '1P' = 'P'", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "b P 1")),
    ).not.toThrow();
  });

  it("accepts turn 'w' (Gote)", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "w - 1")),
    ).not.toThrow();
  });

  it("accepts move counter 999", () => {
    expect(() =>
      createSFEN(INITIAL_SFEN.replace("b - 1", "b - 999")),
    ).not.toThrow();
  });
});

describe("createSFEN – invalid inputs", () => {
  it("throws for empty string", () => {
    expect(() => createSFEN("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for '!' in SFEN", () => {
    expect(() =>
      createSFEN(
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1!",
      ),
    ).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for 3-field SFEN (missing move counter)", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 b -")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidSFENStructure",
      }),
    );
  });

  it("throws VALIDATION_ERROR for 5-field SFEN", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 b - 1 extra")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for turn 'B' (must be lowercase 'b')", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 B - 1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for invalid hand 'Z'", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 b Z 1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for move counter 0", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 b - 0")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidSFENMoveCounter",
      }),
    );
  });

  it("throws VALIDATION_ERROR for negative move counter", () => {
    expect(() => createSFEN("9/9/9/9/9/9/9/9/9 b - -1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// parseSFEN – board structure
// ---------------------------------------------------------------------------
describe("parseSFEN – board parsing", () => {
  it("parses all-empty board correctly (all null)", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b - 1");
    const { board } = parseSFEN(sfen);
    expect(board).toHaveLength(9);
    expect(board.every((row) => row.every((sq) => sq === null))).toBe(true);
  });

  it("parses promoted pieces in first rank (9 promoted pieces)", () => {
    // 9 promoted pieces fill rank 0 (+P+L+N+S+B+R+p+l+n), 8 empty ranks follow
    const sfen = createSFEN("+P+L+N+S+B+R+p+l+n/9/9/9/9/9/9/9/9 b - 1");
    const { board } = parseSFEN(sfen);
    expect(board[0]![0]).toBe("+P");
    expect(board[0]![5]).toBe("+R");
    expect(board[0]![6]).toBe("+p");
  });

  it("parses hand correctly for multi-digit count '18P'", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b 18P 1");
    const { hand } = parseSFEN(sfen);
    expect(hand.P).toBe(18);
  });

  it("parses hand correctly: all 14 piece types", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b PLNSGBRplnsgbr 1");
    const { hand } = parseSFEN(sfen);
    for (const p of [
      "P",
      "L",
      "N",
      "S",
      "G",
      "B",
      "R",
      "p",
      "l",
      "n",
      "s",
      "g",
      "b",
      "r",
    ] as const) {
      expect(hand[p]).toBe(1);
    }
  });

  it("parses hand '-' as all zeros", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b - 1");
    const { hand } = parseSFEN(sfen);
    expect(Object.values(hand).every((v) => v === 0)).toBe(true);
  });

  it("throws for 8 ranks (one rank missing)", () => {
    const fen = "9/9/9/9/9/9/9/9 b - 1" as unknown as SFEN;
    expect(() => parseSFEN(fen)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidSfenRanks" }),
    );
  });

  it("throws for rank with invalid promoted piece '+Z'", () => {
    const fen = "9/9/9/9/9/9/9/9/+Z8 b - 1" as unknown as SFEN;
    expect(() => parseSFEN(fen)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidSfenPiece" }),
    );
  });

  it("throws for rank that is too wide (count > 9)", () => {
    const fen = "9/9/9/9/9/9/9/9/P9 b - 1" as unknown as SFEN;
    expect(() => parseSFEN(fen)).toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.invalidSfenRankWidth",
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// isValidShogiPiece / isShogiHandKey
// ---------------------------------------------------------------------------
describe("isValidShogiPiece", () => {
  it("accepts all 14 regular pieces (7 per side)", () => {
    for (const p of [
      "P",
      "L",
      "N",
      "S",
      "G",
      "B",
      "R",
      "K",
      "p",
      "l",
      "n",
      "s",
      "g",
      "b",
      "r",
      "k",
    ]) {
      expect(isValidShogiPiece(p)).toBe(true);
    }
  });

  it("accepts all 12 promoted pieces (no promoted Gold/King)", () => {
    for (const p of [
      "+P",
      "+L",
      "+N",
      "+S",
      "+B",
      "+R",
      "+p",
      "+l",
      "+n",
      "+s",
      "+b",
      "+r",
    ]) {
      expect(isValidShogiPiece(p)).toBe(true);
    }
  });

  it("rejects promoted Gold '+G' (no promotion for Gold)", () => {
    expect(isValidShogiPiece("+G")).toBe(false);
    expect(isValidShogiPiece("+g")).toBe(false);
  });

  it("rejects promoted King '+K'", () => {
    expect(isValidShogiPiece("+K")).toBe(false);
  });

  it("rejects empty string, numbers, and invalid chars", () => {
    for (const p of ["", "X", "1", "++P", "PL"]) {
      expect(isValidShogiPiece(p)).toBe(false);
    }
  });
});

describe("isShogiHandKey", () => {
  it("accepts all 14 capturable piece types (no King)", () => {
    for (const p of [
      "P",
      "L",
      "N",
      "S",
      "G",
      "B",
      "R",
      "p",
      "l",
      "n",
      "s",
      "g",
      "b",
      "r",
    ]) {
      expect(isShogiHandKey(p)).toBe(true);
    }
  });

  it("rejects King 'K'/'k' (cannot be captured)", () => {
    expect(isShogiHandKey("K")).toBe(false);
    expect(isShogiHandKey("k")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isShogiHandKey(null)).toBe(false);
    expect(isShogiHandKey(undefined)).toBe(false);
    expect(isShogiHandKey(1)).toBe(false);
  });
});
