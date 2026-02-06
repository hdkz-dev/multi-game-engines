/**
 * エンジンプロトコル（UCI/USI等）のパーサーインターフェース
 */
export interface IProtocolParser<T_INFO, T_RESULT> {
  /** 文字列から思考状況を解析 */
  parseInfo(line: string): T_INFO | null;
  /** 文字列から最終結果を解析 */
  parseResult(line: string): T_RESULT | null;
  /** コマンドを生成 */
  createSearchCommand(options: any): string;
  createStopCommand(): string;
}

