import {
  Brand,
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
} from "@multi-game-engines/core";

/** 麻雀の指し手（打牌、副露等） */
export type MahjongMove = Brand<string, "MahjongMove">;

/**
 * 麻雀の指し手形式（例: 1m, tsumo, riichi 等）を検証する正規表現。
 */
export const MAHJONG_MOVE_REGEX =
  /^([1-9][mpsz]|tsumo|ron|riichi|chi|pon|kan|kakan|nuki|none)$/;

/**
 * 文字列を MahjongMove へ変換し、厳密に検証します。
 */
export function createMahjongMove(move: string): MahjongMove {
  if (typeof move !== "string" || !MAHJONG_MOVE_REGEX.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid MahjongMove format: "${move}"`,
    });
  }
  ProtocolValidator.assertNoInjection(move, "MahjongMove");
  return move as MahjongMove;
}

/**
 * 麻雀盤面データ（JSON構造）のバリデータ。
 */
export function validateMahjongBoard(board: unknown): void {
  const MAX_DEPTH = 10;
  const validateValue = (
    value: unknown,
    path: string = "board",
    depth: number = 0,
  ): void => {
    if (depth > MAX_DEPTH) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: `Mahjong board data is too deeply nested at: ${path}`,
      });
    }
    if (typeof value === "string") {
      ProtocolValidator.assertNoInjection(
        value,
        `mahjong board data: ${path}`,
        true,
      );
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        validateValue(v, `${path}[${i}]`, depth + 1);
      });
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        validateValue(v, `${path}.${k}`, depth + 1);
      }
    }
  };
  validateValue(board);
}
