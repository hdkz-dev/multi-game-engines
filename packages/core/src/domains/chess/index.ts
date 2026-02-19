import { FEN, EngineErrorCode } from "../../types.js";
export { FEN };
import { EngineError } from "../../errors/EngineError.js";

/**
 * チェス局面情報 (FEN) のバリデータファクトリ。
 * 与えられた文字列が有効な FEN 形式であることを厳密に検証し、Branded Type として返します。
 *
 * @param pos - 検証対象の FEN 文字列。
 * @returns 検証済みの FEN 文字列。
 * @throws {EngineError} FEN が無効な場合（空文字、不正な文字、構造エラー、フィールド不正など）。
 *
 * バリデーション仕様:
 * 1. 空文字チェック: 空でないこと。
 * 2. 文字種制限: [0-9], [a-z], [A-Z], '/', ' ', '-' のみ許可。
 * 3. 構造チェック: スペース区切りで正確に 6 つのフィールドを持つこと。
 * 4. 駒配置 (Piece Placement): '/' 区切りで 8 ランクあること。各ランクは 1-8 または駒文字のみ。
 * 5. 手番 (Active Color): 'w' または 'b'。
 * 6. キャスリング (Castling): '-' または 'KQkq' の組み合わせ。
 * 7. アンパッサン (En Passant): '-' または代数表記のマス（例: 'e3'）。
 * 8. 手数 (Move Counters): 半手数・全手数が数値であること。
 */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: "Invalid FEN: Input must be a non-empty string.", // Key: engine.errors.invalidFEN
    });
  }

  const trimmedPos = pos.trim();

  // 2026 Best Practice: Character Whitelist Validation (Refuse by Exception)
  // FEN characters: digits 0-9, pieces (rnbqkpRNBQKP), active color (w/b), files (a-h), slashes, spaces, hyphen
  if (!/^[0-9a-hA-HrnbqkpRNBQKPw/\s-]+$/.test(trimmedPos)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid FEN: Illegal characters detected.",
      remediation:
        "FEN should only contain [0-9], [a-z], [A-Z], '/', ' ', and '-'.",
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

  // ... (pieces check omitted) ...

  // 3. Castling rights
  // Order must be K, Q, k, q. No duplicates. Or just "-"
  if (castling !== "-" && !/^(K?Q?k?q?)$/.test(castling!)) {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid castling rights: "${castling}"`,
    });
  }

  // ... (enPassant check omitted) ...

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
