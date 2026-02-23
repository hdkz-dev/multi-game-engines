import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode, Move, PositionString } from "../types.js";
import { truncateLog } from "../utils/Sanitizer.js";

/**
 * プロトコルレベルのセキュリティバリデーションを提供するユーティリティ。
 */
export class ProtocolValidator {
  // 2026 Best Practice: 正規表現の事前コンパイルによる高速化
  // STRICT: 改行、ヌル、セミコロン、および主要な ASCII 制御文字を拒否
  // eslint-disable-next-line no-control-regex
  private static readonly STRICT_REGEX = /[\r\n\0;\x01-\x1f\x7f]/;
  // LOOSE: GTP/SGF 用にセミコロンを許可
  // eslint-disable-next-line no-control-regex
  private static readonly LOOSE_REGEX = /[\r\n\0\x01-\x1f\x7f]/;

  /**
   * 入力文字列（またはオブジェクト内の全文字列値）に制御文字が含まれていないか検証します。
   * @param input 検証対象の文字列またはオブジェクト
   * @param context エラーメッセージに使用するコンテキスト名
   * @param recursive オブジェクトや配列を再帰的に走査するかどうか
   * @param allowSemicolon セミコロンを許可するかどうか (GTP/SGF 用)
   */
  static assertNoInjection(
    input: unknown,
    context: string,
    recursive = false,
    allowSemicolon = false,
  ): void {
    if (typeof input === "string") {
      const regex = allowSemicolon
        ? ProtocolValidator.LOOSE_REGEX
        : ProtocolValidator.STRICT_REGEX;
      if (regex.test(input)) {
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Potential command injection detected in ${context}: "${truncateLog(input)}".`,
          i18nKey: "engine.errors.illegalCharacters",
          remediation: allowSemicolon
            ? "Remove control characters (\\r, \\n, \\0, etc.) from input."
            : "Remove control characters (\\r, \\n, \\0, ;, etc.) from input.",
        });
      }
      return;
    }

    if (recursive && typeof input === "object" && input !== null) {
      if (Array.isArray(input)) {
        for (const item of input) {
          ProtocolValidator.assertNoInjection(
            item,
            context,
            true,
            allowSemicolon,
          );
        }
      } else {
        for (const [key, value] of Object.entries(input)) {
          // キー自体もインジェクションチェックの対象とする
          ProtocolValidator.assertNoInjection(
            key,
            `${context} key`,
            false,
            allowSemicolon,
          );
          // 値を再帰的にチェック
          ProtocolValidator.assertNoInjection(
            value,
            context,
            true,
            allowSemicolon,
          );
        }
      }
    }
  }
}

/** 汎用指し手バリデータ (2026 Zenith Tier: Refuse by Exception) */
export function createMove<T extends string = string>(move: string): Move<T> {
  if (typeof move !== "string" || !/^[a-z0-9+*#=/\- ()]+$/i.test(move)) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: `Invalid Move format: "${truncateLog(move)}" contains illegal characters.`,
    });
  }
  ProtocolValidator.assertNoInjection(move, "Move");
  return move as Move<T>;
}

/** 汎用局面バリデータ (2026 Zenith Tier: Refuse by Exception) */
export function createPositionString<T extends string = string>(
  pos: string,
): PositionString<T> {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: `Invalid PositionString: Input must be a non-empty string. (Value: ${truncateLog(pos)})`,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "Position");
  return pos as PositionString<T>;
}
