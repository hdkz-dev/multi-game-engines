import { FEN, EngineErrorCode } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";

export { FEN };

/**
 * チェス局面情報 (FEN) のバリデータファクトリ。
 * 与えられた文字列が有効な FEN 形式であることを厳密に検証し、Branded Type として返します。
 *
 * @param pos - 検証対象の FEN 文字列。
 * @returns 検証済みの FEN 文字列。
 * @throws {EngineError} FEN が無効な場合（空文字、不正な文字、構造エラー、フィールド不正など）。
 */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Input must be a non-empty string.",
    });
  }

  const trimmedPos = pos.trim();

  // 2026 Best Practice: UCI 'startpos' keyword support
  if (trimmedPos === "startpos") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;
  }

  // 2026 Best Practice: Character Whitelist Validation (Refuse by Exception)
  if (!/^[0-9a-hA-HrnbqkpRNBQKPw/\s-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid FEN: Illegal characters detected.",
      remediation:
        "FEN should only contain digits [0-9], files [a-h], pieces [rnbqkpRNBQKP], active color [wb], '/', ' ', and '-'.",
    });
  }

  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 6) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN structure: Expected 6 fields, found ${fields.length}`,
    });
  }

  const [pieces, turn, castling, enPassant, halfMove, fullMove] = fields;

  // 1. Piece placement (8 ranks)
  const ranks = pieces!.split("/");
  if (ranks.length !== 8) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid piece placement: Expected 8 ranks, found ${ranks.length}`,
    });
  }

  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i]!;
    if (!/^[1-8rnbqkpRNBQKP]+$/.test(rank)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid characters in rank ${i + 1}: "${rank}"`,
      });
    }
  }

  // 2. Active color
  if (turn !== "w" && turn !== "b") {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid active color: "${turn}" (expected "w" or "b")`,
    });
  }

  // 3. Castling rights
  // Order must be K, Q, k, q. No duplicates. Or just "-"
  if (castling !== "-" && !/^(K?Q?k?q?)$/.test(castling!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid castling rights: "${castling}"`,
    });
  }

  // 4. En passant target square
  if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid en passant square: "${enPassant}"`,
    });
  }

  // 5 & 6. Move counters
  const hm = Number(halfMove);
  const fm = Number(fullMove);
  if (!Number.isInteger(hm) || hm < 0 || !Number.isInteger(fm) || fm < 1) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message:
        "Invalid move counters: must be non-negative integers (fullMove >= 1).",
    });
  }

  return trimmedPos as FEN;
}
