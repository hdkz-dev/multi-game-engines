import {
  Brand,
  EngineError,
  EngineErrorCode,
  Move,
  createMove,
  createPositionString,
} from "@multi-game-engines/core";

/** 囲碁の盤面データ */
export type GOBoard = Brand<string, "GOBoard">;
/** 囲碁の 指し手 (GTP形式: A1-Z25 (skip I), pass, resign) */
export type GOMove = Move<"GOMove">;

/**
 * 囲碁盤面データのバリデータファクトリ。
 */
export function createGOBoard(pos: string): GOBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOBoard: Input must be a non-empty string.",
    });
  }
  if (!/^[a-zA-Z0-9.\- ]+$/.test(pos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOBoard: Illegal characters detected.",
    });
  }
  return createPositionString<"GOBoard">(pos) as GOBoard;
}

/**
 * 囲碁指し手のバリデータファクトリ。
 */
export function createGOMove(move: string): GOMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOMove: Input must be a non-empty string.",
    });
  }
  // 2026 Best Practice: 正規化（小文字化）をバリデータ層で実施
  const normalized = move.toLowerCase();
  if (!/^[a-z0-9 ]+$/.test(normalized)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOMove: Illegal characters detected.",
    });
  }
  if (!/^([a-h j-z]([1-9]|1[0-9]|2[0-5])|pass|resign)$/.test(normalized)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: `Invalid GOMove format: "${move}"`,
    });
  }
  return createMove<"GOMove">(normalized);
}
