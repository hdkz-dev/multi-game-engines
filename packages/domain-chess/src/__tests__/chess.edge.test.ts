/**
 * Chess (FEN) - official rules edge case tests.
 *
 * Official FEN spec:
 *   <board> <color> <castling> <en-passant> <halfmove> <fullmove>
 *   - color: w | b
 *   - castling: K, Q, k, q (no duplicates) or -
 *   - en passant: - or [a-h][36] only (rank 3 after White's double-pawn push, rank 6 after Black's)
 *   - halfmove clock: integer >= 0
 *   - fullmove: integer >= 1
 *   - startpos: special alias
 */
import { describe, it, expect } from "vitest";
import { createFEN, parseFEN, isValidChessPiece, FEN } from "../index.js";
import { EngineErrorCode } from "@multi-game-engines/core";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ---------------------------------------------------------------------------
// createFEN – valid inputs
// ---------------------------------------------------------------------------
describe("createFEN – valid inputs", () => {
  it("accepts the initial position", () => {
    expect(() => createFEN(INITIAL)).not.toThrow();
  });

  it("resolves 'startpos' alias to the full initial FEN", () => {
    const fen = createFEN("startpos");
    expect(fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
  });

  it("accepts 'startpos' with leading/trailing spaces", () => {
    expect(() => createFEN("  startpos  ")).not.toThrow();
  });

  it("accepts all four castling rights 'KQkq'", () => {
    expect(() => createFEN(`${INITIAL.replace("KQkq", "KQkq")}`)).not.toThrow();
  });

  it("accepts only K castling right", () => {
    expect(() => createFEN(INITIAL.replace("KQkq", "K"))).not.toThrow();
  });

  it("accepts '-' for no castling rights", () => {
    expect(() => createFEN(INITIAL.replace("KQkq", "-"))).not.toThrow();
  });

  it("accepts en passant on rank 3 (e.g., e3)", () => {
    expect(() =>
      createFEN("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"),
    ).not.toThrow();
  });

  it("accepts en passant on rank 6 (e.g., d6)", () => {
    expect(() =>
      createFEN(
        "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1",
      ),
    ).not.toThrow();
  });

  it("accepts halfmove clock = 0", () => {
    expect(() => createFEN(INITIAL)).not.toThrow();
  });

  it("accepts large halfmove clock (e.g., 100 for 50-move rule tracking)", () => {
    expect(() => createFEN(INITIAL.replace("0 1", "100 1"))).not.toThrow();
  });

  it("accepts fullmove = 1 (minimum)", () => {
    expect(() => createFEN(INITIAL)).not.toThrow();
  });

  it("accepts large fullmove number (e.g., 200)", () => {
    expect(() => createFEN(INITIAL.replace("0 1", "0 200"))).not.toThrow();
  });

  it("accepts black-to-move FEN", () => {
    expect(() =>
      createFEN("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// createFEN – invalid inputs
// ---------------------------------------------------------------------------
describe("createFEN – invalid inputs", () => {
  it("throws VALIDATION_ERROR for empty string", () => {
    expect(() => createFEN("")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for whitespace-only string", () => {
    expect(() => createFEN("   ")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for non-string (number)", () => {
    expect(() => createFEN(42 as unknown as string)).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for illegal characters (e.g., '!')", () => {
    expect(() =>
      createFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1!"),
    ).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws SECURITY_ERROR for semicolon injection attempt", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - 0 1; quit")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.SECURITY_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR when field count is 5 (missing fullmove)", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - 0")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENStructure",
      }),
    );
  });

  it("throws VALIDATION_ERROR when field count is 7", () => {
    // All digits are valid chars, so char check passes; 7 fields → structure error
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - 0 1 0")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for invalid active color 'a' (in allowlist but not w/b)", () => {
    // 'a' passes the char allowlist but fails /^[wb]$/ for turn field
    expect(() => createFEN("8/8/8/8/8/8/8/8 a - - 0 1")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENTurn",
      }),
    );
  });

  it("throws VALIDATION_ERROR for invalid active color 'B' (uppercase, in allowlist)", () => {
    // 'B' (bishop) passes char allowlist but fails /^[wb]$/ for turn field
    expect(() => createFEN("8/8/8/8/8/8/8/8 B - - 0 1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for duplicate castling rights 'KKqk'", () => {
    expect(() =>
      createFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KKqk - 0 1"),
    ).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENCastling",
      }),
    );
  });

  it("throws VALIDATION_ERROR for castling with 5 chars 'KQkqK'", () => {
    expect(() =>
      createFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqK - 0 1"),
    ).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENCastling",
      }),
    );
  });

  it("throws VALIDATION_ERROR for invalid en passant square 'e4' (must be rank 3 or 6)", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - e4 0 1")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENEnPassant",
      }),
    );
  });

  it("throws VALIDATION_ERROR for invalid en passant 'e7'", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - e7 0 1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for en passant on invalid rank 'e4' (only rank 3 or 6 allowed)", () => {
    // 'e4' passes char check but fails /^(?:-|[a-h][36])$/ en passant validation
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - e4 0 1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });

  it("throws VALIDATION_ERROR for negative halfmove clock '-1'", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - -1 1")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENHalfmove",
      }),
    );
  });

  it("throws VALIDATION_ERROR for non-integer halfmove 'h' (letter in allowlist, NaN)", () => {
    // 'h' is in the char allowlist ([a-h]) but Number('h') = NaN → !isInteger → throws
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - h 1")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENHalfmove",
      }),
    );
  });

  it("throws VALIDATION_ERROR for fullmove = 0", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - 0 0")).toThrow(
      expect.objectContaining({
        code: EngineErrorCode.VALIDATION_ERROR,
        i18nKey: "engine.errors.invalidFENFullmove",
      }),
    );
  });

  it("throws VALIDATION_ERROR for negative fullmove '-1'", () => {
    expect(() => createFEN("8/8/8/8/8/8/8/8 w - - 0 -1")).toThrow(
      expect.objectContaining({ code: EngineErrorCode.VALIDATION_ERROR }),
    );
  });
});

// ---------------------------------------------------------------------------
// parseFEN – valid positions
// ---------------------------------------------------------------------------
describe("parseFEN – valid positions", () => {
  it("parses initial position board correctly (rank 8 = board[0])", () => {
    const fen = createFEN(INITIAL);
    const { board, turn } = parseFEN(fen);
    expect(turn).toBe("w");
    // Rank 8: r n b q k b n r
    expect(board[0]).toEqual(["r", "n", "b", "q", "k", "b", "n", "r"]);
    // Rank 1: R N B Q K B N R
    expect(board[7]).toEqual(["R", "N", "B", "Q", "K", "B", "N", "R"]);
  });

  it("parses turn 'b' correctly", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    );
    expect(parseFEN(fen).turn).toBe("b");
  });

  it("parses all null squares in empty board '8/8/8/8/8/8/8/8'", () => {
    const fen = createFEN("8/8/8/8/8/8/8/8 w - - 0 1");
    const { board } = parseFEN(fen);
    expect(board.every((row) => row.every((sq) => sq === null))).toBe(true);
  });

  it("parses mixed empty and piece ranks correctly", () => {
    const fen = createFEN("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    const { board } = parseFEN(fen);
    // board[0] rank 8: e8 = index 4 = 'k'
    expect(board[0]![4]).toBe("k");
    // board[7] rank 1: e1 = index 4 = 'K'
    expect(board[7]![4]).toBe("K");
    // non-piece squares are null
    expect(board[0]![0]).toBeNull();
    expect(board[3]![3]).toBeNull();
  });

  it("correctly counts squares when rank has leading empty '3P4'", () => {
    const fen = createFEN("8/8/8/8/8/8/8/3P4 w - - 0 1");
    const { board } = parseFEN(fen);
    expect(board[7]![3]).toBe("P");
    expect(board[7]![0]).toBeNull();
    expect(board[7]![7]).toBeNull();
  });

  it("all 12 piece types are valid via isValidChessPiece", () => {
    for (const p of [
      "P",
      "N",
      "B",
      "R",
      "Q",
      "K",
      "p",
      "n",
      "b",
      "r",
      "q",
      "k",
    ]) {
      expect(isValidChessPiece(p)).toBe(true);
    }
  });

  it("rejects non-piece characters via isValidChessPiece", () => {
    for (const p of ["X", "z", "1", "+", ""]) {
      expect(isValidChessPiece(p)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// parseFEN – invalid FEN structures (bypassed createFEN)
// ---------------------------------------------------------------------------
describe("parseFEN – structural errors", () => {
  it("throws for 7 ranks (too many '/')", () => {
    const fen = "8/8/8/8/8/8/8 w - - 0 1" as unknown as FEN;
    expect(() => parseFEN(fen)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidFenRanks" }),
    );
  });

  it("throws when a rank has too many squares (rank width > 8)", () => {
    // '9' means 9 empty squares in rank 1 — overshoots
    const fen = "8/8/8/8/8/8/8/9 w - - 0 1" as unknown as FEN;
    expect(() => parseFEN(fen)).toThrow();
  });

  it("throws for invalid piece character 'X' in board", () => {
    const fen = "8/8/8/8/8/8/8/7X w - - 0 1" as unknown as FEN;
    expect(() => parseFEN(fen)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidFenChar" }),
    );
  });

  it("throws when rank is too narrow (board width < 8)", () => {
    // Rank 1 has only 7 squares: P7 = 1 piece + 7 empty = 8 but P6 = 7
    const fen = "8/8/8/8/8/8/8/P6 w - - 0 1" as unknown as FEN;
    expect(() => parseFEN(fen)).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.invalidFenRankWidth" }),
    );
  });
});
