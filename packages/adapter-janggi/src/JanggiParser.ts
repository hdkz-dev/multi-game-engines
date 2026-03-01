import {
  IProtocolParser,
  ScoreNormalizer,
  PositionId,
  MiddlewareCommand,
  ProtocolValidator,
} from "@multi-game-engines/core";
import {
  IJanggiSearchOptions,
  IJanggiSearchInfo,
  IJanggiSearchResult,
  createJanggiMove,
} from "@multi-game-engines/domain-janggi";

export class JanggiParser implements IProtocolParser<
  IJanggiSearchOptions,
  IJanggiSearchInfo,
  IJanggiSearchResult
> {
  createSearchCommand(options: IJanggiSearchOptions): MiddlewareCommand {
    ProtocolValidator.assertNoInjection(options, "JanggiSearchOptions");
    const commands: string[] = [];
    if (options.position) {
      commands.push(`position ${options.position}`);
    }
    commands.push("go");
    return commands;
  }

  createStopCommand(): MiddlewareCommand {
    return "stop";
  }

  createOptionCommand(name: string, value: unknown): MiddlewareCommand {
    ProtocolValidator.assertNoInjection({ name, value }, "JanggiOption");
    return `setoption name ${name} value ${value}`;
  }

  parseInfo(
    data: string | Record<string, unknown>,
    positionId?: PositionId,
  ): IJanggiSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info ")) return null;

    const info: IJanggiSearchInfo = { raw: data, positionId };
    const parts = data.split(/\s+/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "score") {
        const type = parts[++i] as "cp" | "mate";
        const val = parseInt(parts[++i] || "0", 10);
        info.score = {
          unit: type,
          [type]: val,
          normalized: ScoreNormalizer.normalize(val, type, "janggi"),
        };
      }
    }
    return info;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IJanggiSearchResult | null {
    if (typeof data !== "string") return null;
    if (data.startsWith("bestmove ")) {
      const parts = data.split(/\s+/);
      return {
        bestMove: parts[1] ? createJanggiMove(parts[1]) : null,
        raw: data,
      };
    }
    return null;
  }
}
