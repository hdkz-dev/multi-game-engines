import { Brand } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";
import { EngineErrorCode } from "../../types.js";

/** 囲碁の盤面データ */
export type GOBoard = Brand<string, "GOBoard">;
/** 囲碁の 指し手 (GTP形式: A1, pass, etc.) */
export type GOMove = Brand<string, "GOMove">;

/**
 * 囲碁盤面データのバリデータファクトリ。
 */
export function createGOBoard(pos: string): GOBoard {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid GOBoard: Input must be a non-empty string.",
    });
  }
  // 2026 Best Practice: Command Injection Prevention
  if (!/^[a-zA-Z0-9.\s]+$/.test(pos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOBoard: Illegal characters detected.",
    });
  }
  return pos as GOBoard;
}

/**
 * 囲碁指し手のバリデータファクトリ。
 */
export function createGOMove(move: string): GOMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid GOMove: Input must be a non-empty string.",
    });
  }
  // GTP Move format: A1 to T19 (skipping I), pass, resign
  if (!/^([A-HJ-T](1[0-9]|[1-9])|pass|resign)$/i.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid GOMove format: "${move}"`,
    });
  }
  return move as GOMove;
}
