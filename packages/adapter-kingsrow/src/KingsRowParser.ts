import {
  IProtocolParser,
  ProtocolValidator,
  createMove,
} from "@multi-game-engines/core";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
} from "@multi-game-engines/domain-checkers";

/**
 * 2026 Zenith Tier: KingsRow チェッカープロトコルパーサー。
 */
export class KingsRowParser implements IProtocolParser<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  parseInfo(
    data: string | Record<string, unknown>,
  ): ICheckersSearchInfo | null {
    if (typeof data === "string") {
      // KingsRow のテキスト出力を解析
      // 例: "eval: 0.12, depth: 10, pv: 11-15 22-18"
      const match = data.match(/eval: ([-.\d]+), depth: (\d+)/);
      if (match) {
        return {
          eval: parseFloat(match[1]!),
          depth: parseInt(match[2]!, 10),
          raw: data,
        };
      }
    }
    return null;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): ICheckersSearchResult | null {
    if (typeof data === "string") {
      // 例: "bestmove: 11-15 (eval: 0.12)"
      const match = data.match(/bestmove: ([\d-]+) \(eval: ([-.\d]+)\)/);
      if (match) {
        return {
          bestMove: createMove<"CheckersMove">(match[1]!),
          eval: parseFloat(match[2]!),
          raw: data,
        };
      }
    }
    return null;
  }

  createSearchCommand(options: ICheckersSearchOptions): string[] {
    const commands: string[] = [];
    if (options.board) {
      ProtocolValidator.assertNoInjection(options.board, "board data");
      commands.push(`set board ${options.board}`);
    }
    commands.push("go");
    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `set ${name} ${value}`;
  }
}
