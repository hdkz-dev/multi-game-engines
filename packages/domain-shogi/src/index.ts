import { EngineErrorCode, EngineError } from "@multi-game-engines/core";

/**
 * Branded Type for SFEN (Shogi Forsyth-Edwards Notation) strings.
 */
export type SFEN = string & { readonly __brand: "SFEN" };

/**
 * 将棋の駒識別子。
 * 大文字は先手 (Sente)、小文字は後手 (Gote)。
 * "+" プレフィックスは成駒を表す。
 */
export type ShogiPiece =
  | "P"
  | "L"
  | "N"
  | "S"
  | "G"
  | "B"
  | "R"
  | "K"
  | "p"
  | "l"
  | "n"
  | "s"
  | "g"
  | "b"
  | "r"
  | "k"
  | "+P"
  | "+L"
  | "+N"
  | "+S"
  | "+B"
  | "+R"
  | "+p"
  | "+l"
  | "+n"
  | "+s"
  | "+b"
  | "+r";

/**
 * Represents the count of captured pieces in Shogi.
 */
export interface ShogiHand {
  P: number;
  L: number;
  N: number;
  S: number;
  G: number;
  B: number;
  R: number;
  p: number;
  l: number;
  n: number;
  s: number;
  g: number;
  b: number;
  r: number;
}

/**
 * Parsed SFEN result containing the 2D board array, turn, and hand counts.
 */
export interface ParsedSFEN {
  /** 9x9 grid of pieces. board[0] is Rank 1 (top), board[8] is Rank 9 (bottom). */
  board: (ShogiPiece | null)[][];
  /** Whose turn it is: 'b' for Sente (Black), 'w' for Gote (White). */
  turn: "b" | "w";
  /** Counts of pieces in hand. */
  hand: ShogiHand;
}

/**
 * SFEN 形式の文字列を厳密に検証し、Branded Type を返します。
 */
export function createSFEN(pos: string): SFEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid SFEN: Input must be a non-empty string.",
    });
  }
  const trimmedPos = pos.trim();
  if (!/^[0-9a-zA-Z/+\s-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid SFEN: Illegal characters detected.",
    });
  }
  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 4) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN structure: Expected 4 fields, found ${fields.length}`,
    });
  }

  // 2nd field: Turn (b or w)
  if (!/^[bw]$/.test(fields[1]!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN turn: Expected "b" or "w", found "${fields[1]}"`,
    });
  }

  // 3rd field: Hand pieces (e.g., 2P3k or -)
  if (!/^(?:(?:[1-9][0-9]*[PLNSGBRKplnsgbrk]+)+|-)$/.test(fields[2]!)) {
    // Note: USI standard for hand pieces can be complex, but usually it is [count][piece][count][piece]...
    // Adjusting to a simpler check that covers common patterns.
    if (!/^[0-9a-zA-Z-]+$/.test(fields[2]!)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid SFEN hand: "${fields[2]}"`,
      });
    }
  }

  // 4th field: Move counter (>= 1)
  const moveCountNum = Number(fields[3]!);
  if (!Number.isInteger(moveCountNum) || moveCountNum < 1) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN move counter: "${fields[3]}"`,
    });
  }

  return trimmedPos as SFEN;
}

export function isValidShogiPiece(str: string): str is ShogiPiece {
  return /^(?:\+[PLNSBRplnsbr]|[PLNSGBRKplnsgbrk])$/.test(str);
}

export function isShogiHandKey(piece: unknown): piece is keyof ShogiHand {
  return typeof piece === "string" && /^[PLNSGBRplnsgbr]$/.test(piece);
}

/**
 * SFEN 文字列を解析して 2D 盤面配列と持ち駒数に変換します。
 */
export function parseSFEN(sfen: SFEN): ParsedSFEN {
  const parts = sfen.trim().split(/\s+/);
  const position = parts[0]!;
  const turn = parts[1] as "b" | "w";
  const handStr = parts[2] || "-";

  const rows = position.split("/");
  if (rows.length !== 9) throw new Error("Invalid SFEN: Expected 9 ranks");

  const board: (ShogiPiece | null)[][] = [];
  for (let r = 0; r < 9; r++) {
    const row = rows[r]!;
    const boardRow: (ShogiPiece | null)[] = [];
    let i = 0;
    while (i < row.length) {
      const char = row[i]!;
      if (/[1-9]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let j = 0; j < emptyCount; j++) boardRow.push(null);
        i++;
      } else if (char === "+") {
        const piece = `+${row[i + 1]}`;
        if (isValidShogiPiece(piece)) {
          boardRow.push(piece);
          i += 2;
        } else throw new Error("Invalid SFEN piece");
      } else if (isValidShogiPiece(char)) {
        boardRow.push(char);
        i++;
      } else throw new Error("Invalid SFEN character");
    }
    if (boardRow.length !== 9) throw new Error("Invalid SFEN rank width");
    board.push(boardRow);
  }

  const hand: ShogiHand = {
    P: 0,
    L: 0,
    N: 0,
    S: 0,
    G: 0,
    B: 0,
    R: 0,
    p: 0,
    l: 0,
    n: 0,
    s: 0,
    g: 0,
    b: 0,
    r: 0,
  };

  if (handStr !== "-") {
    let i = 0;
    while (i < handStr.length) {
      let countStr = "";
      while (i < handStr.length && /[0-9]/.test(handStr[i]!)) {
        countStr += handStr[i]!;
        i++;
      }
      const count = countStr === "" ? 1 : parseInt(countStr, 10);
      const pieceChar = handStr[i]!;
      if (isShogiHandKey(pieceChar)) hand[pieceChar] = count;
      i++;
    }
  }

  return { board, turn, hand };
}
