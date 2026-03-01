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
    const parts = data.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      const token = parts[i];
      if (!token) continue;

      switch (token) {
        case "depth":
          info.depth = parseInt(parts[++i] || "0", 10);
          break;
        case "nodes":
          info.nodes = parseInt(parts[++i] || "0", 10);
          break;
        case "nps":
          info.nps = parseInt(parts[++i] || "0", 10);
          break;
        case "score": {
          const type = parts[++i];
          const val = parseInt(parts[++i] || "0", 10);
          if (type === "cp" || type === "mate") {
            info.score = {
              unit: type,
              [type]: val,
              normalized: ScoreNormalizer.normalize(val, type, "xiangqi"),
            };
          }
          break;
        }
        case "pv": {
          const pvMoves = parts.slice(i + 1).map((m) => {
            try {
              return createXiangqiMove(m);
            } catch {
              return null;
            }
          });
          info.pv = pvMoves.filter((m) => m !== null);
          i = parts.length; // PV is always last in UCCI/UCI
          break;
        }
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
