import {
  Brand,
  EngineError,
  EngineErrorCode,
  ProtocolValidator,
  Move,
} from "@multi-game-engines/core";

/** リバーシの盤面データ */
export type ReversiBoard = Brand<string, "ReversiBoard">;
/** リバーシの指し手 (a1-h8, PS 等) */
export type ReversiMove = Move<"ReversiMove">;

/**
 * リバーシ指し手形式 (a1-h8, PS (Pass) 等) を検証する正規表現。
 */
export const REVERSI_MOVE_REGEX = /^([a-h][1-8]|PS)$/i;

/**
 * 文字列を ReversiMove へ変換し、厳密に検証します。
 */
export function createReversiMove(move: string): ReversiMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid ReversiMove: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidReversiMove",
    });
  }
  ProtocolValidator.assertNoInjection(move, "ReversiMove");
  if (!REVERSI_MOVE_REGEX.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid ReversiMove format: "${move}"`,
      i18nKey: "engine.errors.invalidReversiMove",
      i18nParams: { move },
    });
  }
  return move as ReversiMove;
}

/**
 * リバーシ盤面データのバリデータ。
 */
export function createReversiBoard(pos: string): ReversiBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid ReversiBoard: Input must be a non-empty string.",
      i18nKey: "engine.errors.invalidReversiBoard",
    });
  }
  ProtocolValidator.assertNoInjection(pos, "ReversiBoard");
  return pos as ReversiBoard;
}
