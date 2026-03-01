import { EngineError } from "../errors/EngineError.js";
import {
  EngineErrorCode,
  Move,
  PositionString,
  I18nKey,
  PositionId,
} from "../types.js";
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
   * @param depth 現在の再帰深度 (内部用)
   * @param visited 循環参照検知用のセット (内部用)
   */
  static assertNoInjection(
    input: unknown,
    context: string,
    recursive = false,
    allowSemicolon = false,
    depth = 0,
    visited: WeakSet<object> = new WeakSet(),
  ): void {
    // 2026: 防止: 無限再帰や深すぎるネストによるスタックオーバーフロー
    if (depth > 10) {
      const i18nKey = createI18nKey("engine.errors.nestedTooDeep");
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Input nesting too deep in ${context}.`,
        i18nKey,
      });
    }

    if (typeof input === "string") {
      const regex = allowSemicolon
        ? ProtocolValidator.LOOSE_REGEX
        : ProtocolValidator.STRICT_REGEX;
      if (regex.test(input)) {
        const i18nKey = createI18nKey("engine.errors.injectionDetected");
        const i18nParams = { context, input: truncateLog(input) };
        throw new EngineError({
          code: EngineErrorCode.SECURITY_ERROR,
          message: `Potential command injection detected in ${context}: "${truncateLog(input)}".`,
          i18nKey,
          i18nParams,
          remediation: allowSemicolon
            ? "Remove control characters (\\r, \\n, \\0, etc.) from input."
            : "Remove control characters (\\r, \\n, \\0, ;, etc.) from input.",
        });
      }
      return;
    }

    if (!recursive && input !== undefined && input !== null) {
      // 再帰が無効な場合、文字列以外の入力は原則として拒否（インジェクション対策）
      const i18nKey = createI18nKey("engine.errors.illegalCharacters");
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Invalid non-string input detected in ${context}.`,
        i18nKey,
      });
    }

    if (recursive && typeof input === "object" && input !== null) {
      // 2026: 循環参照チェック
      if (visited.has(input)) {
        return; // 既にチェック済み
      }
      visited.add(input);

      if (Array.isArray(input)) {
        for (const item of input) {
          ProtocolValidator.assertNoInjection(
            item,
            context,
            true,
            allowSemicolon,
            depth + 1,
            visited,
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
            depth + 1,
            visited,
          );
          // 値を再帰的にチェック
          ProtocolValidator.assertNoInjection(
            value,
            context,
            true,
            allowSemicolon,
            depth + 1,
            visited,
          );
        }
      }
    }
  }
}

/** 汎用指し手バリデータ (2026 Zenith Tier: Refuse by Exception) */
export function createMove<T extends string = string>(move: string): Move<T> {
  if (typeof move !== "string" || !/^[a-z0-9+*#=/\- ()]+$/i.test(move)) {
    const i18nKey = createI18nKey("engine.errors.invalidMoveFormat");
    const i18nParams = { move: truncateLog(move) };
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: `Invalid Move format: "${truncateLog(move)}" contains illegal characters.`,
      i18nKey,
      i18nParams,
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
    const i18nKey = createI18nKey("engine.errors.invalidPositionString");
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "Invalid PositionString: Input must be a non-empty string.",
      i18nKey,
    });
  }
  ProtocolValidator.assertNoInjection(pos, "Position");
  return pos as PositionString<T>;
}

/** 局面 ID バリデータ (2026 Zenith Tier: Refuse by Exception) */
export function createPositionId(id: string): PositionId {
  if (typeof id !== "string" || !/^[a-zA-Z0-9-_.:]+$/.test(id)) {
    const i18nKey = createI18nKey("engine.errors.invalidPositionId");
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid PositionId format: "${truncateLog(id)}".`,
      i18nKey,
    });
  }
  return id as PositionId;
}

/**
 * 国際化キー (I18nKey) を生成するためのファクトリ。
 * 直接の型キャストを避け、この関数を経由することで安全性を担保します。
 * (2026 Zenith Tier: Branded Type Validation)
 */
export function createI18nKey(key: string): I18nKey {
  if (typeof key !== "string" || key.trim() === "") {
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `Invalid I18nKey format: "${truncateLog(key)}".`,
    });
  }
  return key as I18nKey;
}
