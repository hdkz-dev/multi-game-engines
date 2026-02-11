import { IBaseSearchInfo, IBaseSearchResult, IBaseSearchOptions } from '../types';

/**
 * エンジンプロトコル（UCI/USI等）のパーサーインターフェース
 * @template T_OPTIONS 探索オプションの型
 * @template T_INFO 思考状況の型
 * @template T_RESULT 最終結果の型
 */
export interface IProtocolParser<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult
> {
  /** 文字列またはバイナリから思考状況を解析 */
  parseInfo(data: string | Uint8Array): T_INFO | null;
  /** 文字列またはバイナリから最終結果を解析 */
  parseResult(data: string | Uint8Array): T_RESULT | null;
  /** コマンドを生成。複数のコマンドを順次送信する場合は配列を返却。 */
  createSearchCommand(options: T_OPTIONS): string | string[] | Uint8Array;
  createStopCommand(): string | Uint8Array;
}
