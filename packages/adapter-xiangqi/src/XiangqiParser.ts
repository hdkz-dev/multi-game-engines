import { IProtocolParser, ScoreNormalizer, PositionId, MiddlewareCommand, ProtocolValidator } from "@multi-game-engines/core";
import { IXiangqiSearchOptions,
  IXiangqiSearchInfo,
  IXiangqiSearchResult,
  createXiangqiMove, } from "@multi-game-engines/domain-xiangqi";

export class XiangqiParser implements IProtocolParser<
  IXiangqiSearchOptions,
  IXiangqiSearchInfo,
  IXiangqiSearchResult
> {
  createSearchCommand(options: IXiangqiSearchOptions): MiddlewareCommand {
    ProtocolValidator.assertNoInjection(options, "XiangqiSearchOptions");
    const commands: string[] = [];
    if (options.xfen) {
      commands.push(`position fen ${options.xfen}`);
    }
    commands.push("go");
    return commands;
  }

  createStopCommand(): MiddlewareCommand {
    return "stop";
  }

  createOptionCommand(name: string, value: unknown): MiddlewareCommand {
    ProtocolValidator.assertNoInjection({ name, value }, "XiangqiOption");
    return `setoption name ${name} value ${value}`;
  }

  parseInfo(
    data: string | Record<string, unknown>,
    positionId?: PositionId,
  ): IXiangqiSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info ")) return null;

    const info: IXiangqiSearchInfo = { raw: data, positionId };
    // Basic parsing similar to UCI
    const parts = data.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "score") {
        const type = parts[++i] as "cp" | "mate";
        const val = parseInt(parts[++i] || "0", 10);
        info.score = {
          unit: type,
          [type]: val,
          normalized: ScoreNormalizer.normalize(val, type, "xiangqi"),
        };
      }
    }
    return info;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IXiangqiSearchResult | null {
    if (typeof data !== "string") return null;
    if (data.startsWith("bestmove ")) {
      const parts = data.split(/\s+/);
      return {
        bestMove: parts[1] ? createXiangqiMove(parts[1]) : null,
        raw: data,
      };
    }
    return null;
  }
}
