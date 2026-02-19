import { SFEN, EngineErrorCode } from "../../types.js";
export { SFEN };
import { EngineError } from "../../errors/EngineError.js";

/**
 * 将棋局面情報 (SFEN) のバリデータファクトリ。
 * 与えられた文字列が有効な SFEN 形式であることを厳密に検証し、Branded Type として返します。
 *
 * @param pos - 検証対象の SFEN 文字列。
 * @returns 検証済みの SFEN 文字列。
 * @throws {EngineError} SFEN が無効な場合。
 *
 * バリデーション仕様:
 * 1. 空文字チェック。
 * 2. 文字種制限: [0-9], [a-z], [A-Z], '+', '/', ' ', '-' のみ許可。
 * 3. 構造チェック: スペース区切りで 4 つのフィールドを持つこと。
 * 4. 盤面配置: '/' 区切りで 9 ランクあること。
 * 5. 手番: 'b' (先手) または 'w' (後手)。
 * 6. 持ち駒: '-' または有効な駒文字列。
 * 7. 手数: 数値であること。
 */
export function createSFEN(pos: string): SFEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid SFEN: Input must be a non-empty string.",
    });
  }

  const trimmedPos = pos.trim();

  // 2026 Best Practice: Refuse by Exception character validation
  // SFEN allowed characters: [0-9], [a-z], [A-Z], '/', '+', ' ', and '-'
  if (!/^[0-9a-zA-Z/+\s-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid SFEN: Illegal characters detected.",
      remediation:
        "SFEN should only contain [0-9], [a-z], [A-Z], '+', '/', ' ', and '-'.",
    });
  }

  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 4) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid SFEN structure: Expected exactly 4 fields, found ${fields.length}`,
    });
  }

  const [board, turn, hand, moveCount] = fields;

  // 1. Board placement (9 ranks)
  const ranks = board!.split("/");
  if (ranks.length !== 9) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid board structure: Expected 9 ranks, found ${ranks.length}`,
    });
  }

  // 2. Active color
  if (turn !== "b" && turn !== "w") {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid turn indicator: "${turn}" (expected "b" or "w")`,
    });
  }

  // 3. Hand pieces
  if (hand !== "-" && !/^[0-9a-zA-Z]+$/.test(hand!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid hand pieces: "${hand}"`,
    });
  }

  // 4. Move count
  const mc = Number(moveCount);
  if (!Number.isInteger(mc) || mc < 1) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid move count: "${moveCount}"`,
    });
  }

  return trimmedPos as SFEN;
}
