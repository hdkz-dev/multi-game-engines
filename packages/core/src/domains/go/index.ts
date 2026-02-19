import { Brand } from "../../types.js";
import { EngineError } from "../../errors/EngineError.js";
import { EngineErrorCode } from "../../types.js";

/** 囲碁の盤面データ */
export type GOBoard = Brand<string, "GOBoard">;
/** 囲碁の 指し手 (GTP形式: A1, pass, etc.) */
export type GOMove = Brand<string, "GOMove">;

/**
 * 囲碁盤面データのバリデータファクトリ。
 *
 * @param pos - 盤面データ文字列。
 * @returns 検証済みの GOBoard。
 * @throws {EngineError} 文字列が空または不正な文字を含む場合。
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
 * GTP (Go Text Protocol) 形式の座標（例: A1, T19）または特殊手（pass, resign）を検証します。
 *
 * @param move - 指し手文字列。
 * @returns 検証済みの GOMove。
 * @throws {EngineError} 形式が無効な場合。
 *
 * 仕様:
 * - 座標: 列 A-Z (Iを除く), 行 1-25 (19x19以上をサポート)。
 * - 特殊手: pass, resign (大文字小文字無視)。
 */
export function createGOMove(move: string): GOMove {
  if (typeof move !== "string" || move.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid GOMove: Input must be a non-empty string.",
    });
  }

  // 2026 Best Practice: Command Injection Prevention
  if (!/^[a-zA-Z0-9]+$/.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid GOMove: Illegal characters detected.",
    });
  }

  // GTP Move format: A-Z (skipping I) + rows 1-25 or pass/resign
  if (!/^([A-HJ-Z]([1-9]|1[0-9]|2[0-5])|pass|resign)$/i.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid GOMove format: "${move}"`,
    });
  }
  return move as GOMove;
}
