import { FEN, EngineErrorCode } from "../../types.js";
export { FEN };
import { EngineError } from "../../errors/EngineError.js";

/** チェス局面情報のバリデータファクトリ */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Input must be a non-empty string.", // Key: engine.errors.invalidFEN
    });
  }

  const trimmedPos = pos.trim();

  // 2026 Best Practice: Character Whitelist Validation (Refuse by Exception)
  // FEN characters: digits 0-9, rnbqkpRNBQKP, 'w', slashes '/', spaces ' ', and '-'
  if (!/^[0-9rnbqkpRNBQKPw/\s-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid FEN: Illegal characters detected.", // Key: engine.errors.illegalCharacters
      remediation:
        "FEN should only contain [0-9], [a-z], [A-Z], '/', ' ', and '-'.",
    });
  }

  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 6) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid FEN structure: Expected 6 fields, found ${fields.length}`, // Key: engine.errors.invalidFENStructure
    });
  }

  const [pieces, turn, castling, enPassant, halfMove, fullMove] = fields;

  // 1. Piece placement
  const ranks = pieces!.split("/");
  if (ranks.length !== 8) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Piece placement must have exactly 8 ranks.",
    });
  }
  for (const rank of ranks) {
    if (!/^[1-8rnbqkpRNBQKP]+$/.test(rank)) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Invalid characters in piece placement rank: "${rank}"`,
      });
    }
  }

  // 2. Active color
  if (turn !== "w" && turn !== "b") {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid active color: "${turn}"`,
    });
  }

  // 3. Castling rights
  if (!/^(-|[KQkq]+)$/.test(castling!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid castling rights: "${castling}"`,
    });
  }

  // 4. En passant
  if (!/^(-|[a-h][36])$/.test(enPassant!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid en passant square: "${enPassant}"`,
    });
  }

  // 5 & 6. Move counters
  if (isNaN(Number(halfMove)) || isNaN(Number(fullMove))) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid move counters: must be numeric.",
    });
  }

  return trimmedPos as FEN;
}
