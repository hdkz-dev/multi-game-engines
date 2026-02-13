import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";

/**
 * プロトコルレベルのセキュリティバリデーションを提供するユーティリティ。
 */
export class ProtocolValidator {
  /**
   * 入力文字列に制御文字が含まれていないか検証します。
   * @param input 検証対象の文字列
   * @param context エラーメッセージに使用するコンテキスト名
   * @param allowSemicolon セミコロンを許可するかどうか (GTP/SGF 用)
   */
  static assertNoInjection(input: string, context: string, allowSemicolon = false): void {
    const regex = allowSemicolon ? /[\r\n\0]/ : /[\r\n\0;]/;
    if (regex.test(input)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: `Potential command injection detected in ${context}.`,
        remediation: allowSemicolon 
          ? "Remove control characters (\\r, \\n, \\0) from input."
          : "Remove control characters (\\r, \\n, \\0, ;) from input."
      });
    }
  }
}
