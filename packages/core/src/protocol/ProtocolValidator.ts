import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";

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
   * 入力文字列に制御文字が含まれていないか検証します。
   * @param input 検証対象の文字列
   * @param context エラーメッセージに使用するコンテキスト名
   * @param allowSemicolon セミコロンを許可するかどうか (GTP/SGF 用)
   */
  static assertNoInjection(input: string, context: string, allowSemicolon = false): void {
    const regex = allowSemicolon ? ProtocolValidator.LOOSE_REGEX : ProtocolValidator.STRICT_REGEX;
    if (regex.test(input)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Potential command injection detected in ${context}.`,
        remediation: allowSemicolon 
          ? "Remove control characters (\\r, \\n, \\0, etc.) from input."
          : "Remove control characters (\\r, \\n, \\0, ;, etc.) from input."
      });
    }
  }
}
