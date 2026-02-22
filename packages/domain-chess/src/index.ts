import {
  EngineErrorCode,
  EngineError,
  PositionString,
} from "@multi-game-engines/core";

/**
 * Branded Type for FEN (Forsyth-Edwards Notation) strings.
 */
export type FEN = PositionString<"FEN">;

/**
 * チェスの駒識別子。
 */
export type ChessPiece =
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K"
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k";

/**
 * Parsed FEN result containing the 2D board array and turn metadata.
 */
export interface ParsedFEN {
  /** 8x8 grid of pieces. board[0] is Rank 8, board[7] is Rank 1. */
  board: (ChessPiece | null)[][];
  /** Whose turn it is: 'w' for White, 'b' for Black. */
  turn: "w" | "b";
}

/**
 * FEN 形式の文字列を厳密に検証し、Branded Type を返します。
 */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidFEN",
    });
  }
  const trimmedPos = pos.trim();
  if (trimmedPos === "startpos") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;
  }
  if (!/^[0-9a-hRNBQKPpnbrqkw/ -]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Illegal characters detected.",
      i18nKey: "engine.errors.illegalCharacters",
      remediation:
        "FEN should only contain digits [0-9], files [a-h], pieces [rnbqkpRNBQKP], active color [wb], '/', ' ', and '-'.",
    });
  }
  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 6) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN structure: Expected 6 fields, found ${fields.length}`,
      i18nKey: "engine.errors.invalidFENStructure",
    });
  }

  // 2nd field: Active color (w or b)
  if (!/^[wb]$/.test(fields[1]!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN turn: Expected "w" or "b", found "${fields[1]}"`,
      i18nKey: "engine.errors.invalidFEN", // Generic fallback if specific key missing
    });
  }

  // 4th field: En passant target square (- or a-h3/a-h6)
  if (!/^(?:-|[a-h][36])$/.test(fields[3]!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN en passant: "${fields[3]}"`,
      i18nKey: "engine.errors.invalidFEN",
    });
  }

  // 3rd field: Castling rights (K, Q, k, q or -)
  const castling = fields[2]!;
  const isValidCastling =
    /^(?:[KQkq]{1,4}|-)$/.test(castling) &&
    (castling === "-" || new Set(castling).size === castling.length);

  if (!isValidCastling) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN castling rights: "${castling}"`,
      i18nKey: "engine.errors.invalidFEN",
    });
  }

  // 5th field: Halfmove clock (>= 0)
  const halfmove = Number(fields[4]!);
  if (!Number.isInteger(halfmove) || halfmove < 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN halfmove clock: "${fields[4]}"`,
      i18nKey: "engine.errors.invalidFEN",
    });
  }

  // 6th field: Fullmove number (>= 1)
  const fullmove = Number(fields[5]!);
  if (!Number.isInteger(fullmove) || fullmove < 1) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN fullmove number: "${fields[5]}"`,
      i18nKey: "engine.errors.invalidFEN",
    });
  }

  return trimmedPos as FEN;
}

export function isValidChessPiece(char: string): char is ChessPiece {
  return /^[PNBRQKpnbrqk]$/.test(char);
}

/**
 * FEN 文字列を解析して 2D 盤面配列に変換します。
 */
export function parseFEN(fen: FEN): ParsedFEN {
  const parts = fen.trim().split(/\s+/);
  const position = parts[0]!;
  const turn = parts[1] as "w" | "b";

  const rows = position.split("/");
  if (rows.length !== 8) throw new Error("Invalid FEN: Expected 8 ranks");

  const board: (ChessPiece | null)[][] = [];
  for (let r = 0; r < 8; r++) {
    const row = rows[r]!;
    const boardRow: (ChessPiece | null)[] = [];
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) boardRow.push(null);
      } else if (isValidChessPiece(char)) {
        boardRow.push(char);
      } else throw new Error("Invalid FEN character");
    }
    if (boardRow.length !== 8) throw new Error("Invalid FEN rank width");
    board.push(boardRow);
  }
  return { board, turn };
}
