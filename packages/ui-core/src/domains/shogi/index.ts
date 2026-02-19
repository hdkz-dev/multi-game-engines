import { SFEN } from "@multi-game-engines/core/shogi";

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
 * 文字列が有効な将棋の駒識別子（成駒を含む）かどうかを検証します。
 * @param str 検証する文字列。
 * @returns 有効な場合 true。
 */
export function isValidShogiPiece(str: string): str is ShogiPiece {
  // Only allow '+' for promotable pieces: P, L, N, S, B, R
  return /^(?:\+[PLNSBRplnsbr]|[PLNSGBRKplnsgbrk])$/.test(str);
}

/**
 * 将棋の持ち駒キー（持ち駒にできる不成駒）の型ガード。
 * @param piece 検証する駒識別子。
 * @returns 有効な持ち駒キーの場合 true。
 */
export function isShogiHandKey(piece: unknown): piece is keyof ShogiHand {
  return typeof piece === "string" && /^[PLNSGBRplnsgbr]$/.test(piece);
}

/**
 * SFEN 文字列を解析して 2D 盤面配列と持ち駒数に変換します。
 * @param sfen 検証済みの SFEN 文字列。
 * @returns 解析された盤面、持ち駒、メタデータ。
 * @throws SFEN が不正な場合にエラーをスローします。
 */
export function parseSFEN(sfen: SFEN): ParsedSFEN {
  if (!sfen) throw new Error("[parseSFEN] SFEN string is empty or undefined.");

  const parts = sfen.trim().split(/\s+/);
  const position = parts[0];
  const turnPart = parts[1];
  const handStr = parts[2] || "-";

  if (!position)
    throw new Error("[parseSFEN] Position part is missing in SFEN string.");
  if (!turnPart)
    throw new Error(
      "[parseSFEN] Turn part is missing in SFEN string (expected 'b' or 'w' as the second part).",
    );

  const turn = turnPart as "b" | "w";

  if (turn !== "b" && turn !== "w") {
    throw new Error(
      `[parseSFEN] Invalid turn indicator: expected "b" (Sente) or "w" (Gote), got "${turnPart}" at the second part.`,
    );
  }

  const rows = position.split("/");
  if (rows.length !== 9) {
    throw new Error(
      `[parseSFEN] Invalid board structure: expected 9 ranks (separated by '/'), but found ${rows.length} ranks.`,
    );
  }

  const board: (ShogiPiece | null)[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const boardRow: (ShogiPiece | null)[] = [];
    let i = 0;
    while (i < row.length) {
      const char = row[i]!;
      if (/[1-9]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let j = 0; j < emptyCount; j++) {
          boardRow.push(null);
        }
        i++;
      } else if (char === "+") {
        if (i + 1 >= row.length) {
          throw new Error(
            `[parseSFEN] Malformed SFEN: '+' promotion prefix found at the end of rank ${r + 1} string. Row: "${row}"`,
          );
        }
        const piece = `+${row[i + 1]}`;
        if (isValidShogiPiece(piece)) {
          boardRow.push(piece);
          i += 2;
        } else {
          throw new Error(
            `[parseSFEN] Invalid promoted piece "${piece}" found at rank ${r + 1}.`,
          );
        }
      } else if (isValidShogiPiece(char)) {
        boardRow.push(char);
        i++;
      } else {
        throw new Error(
          `[parseSFEN] Invalid character "${char}" found at rank ${r + 1}.`,
        );
      }
    }
    if (boardRow.length !== 9) {
      throw new Error(
        `[parseSFEN] Rank ${r + 1} has an invalid length: expected 9 squares, but got ${boardRow.length}. Row string: "${row}"`,
      );
    }
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

  if (handStr && handStr !== "-") {
    let i = 0;
    while (i < handStr.length) {
      let countStr = "";
      while (i < handStr.length && /[0-9]/.test(handStr[i]!)) {
        countStr += handStr[i];
        i++;
      }
      const count = countStr === "" ? 1 : parseInt(countStr, 10);
      const pieceChar = handStr[i];
      if (!pieceChar) {
        throw new Error(
          `[parseSFEN] Unexpected end of hand string after count "${countStr}": "${handStr}"`,
        );
      }
      if (isShogiHandKey(pieceChar)) {
        hand[pieceChar] = count;
      } else {
        throw new Error(
          `[parseSFEN] Invalid piece identifier "${pieceChar}" found in hand string: "${handStr}"`,
        );
      }
      i++;
    }
  }

  return {
    board,
    turn,
    hand,
  };
}
