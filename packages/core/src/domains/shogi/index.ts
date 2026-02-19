import { Brand } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";
import { EngineErrorCode } from "../../types.js";

/** SFEN (Shogi Forsyth-Edwards Notation) を表すブランド型 */
export type SFEN = Brand<string, "SFEN">;

/** 将棋局面情報のバリデータファクトリ */
export function createSFEN(pos: string): SFEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid SFEN: Input must be a non-empty string.",
    });
  }

  const trimmedPos = pos.trim();

  // 2026 Best Practice: Refuse by Exception character validation
  // USI/SFEN allowed characters: [0-9] (including 0 for multi-digit counts), [a-z], [A-Z], /, +, *, whitespace, -
  if (!/^[0-9a-zA-Z/+\s*-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid SFEN: Illegal characters detected.",
      remediation: "Remove control characters and non-standard symbols.",
    });
  }

  const fields = trimmedPos.split(/\s+/);
  if (fields.length < 4) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN structure: Expected 4 fields, found ${fields.length}`,
    });
  }
  return trimmedPos as SFEN;
}
