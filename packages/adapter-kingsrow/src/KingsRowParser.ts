import { IProtocolParser, ProtocolValidator } from "@multi-game-engines/core";
import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
  createCheckersMove,
} from "@multi-game-engines/domain-checkers";

/**
 * Minimal protocol parser for the rapid-draughts adapter.
 *
 * rapid-draughts produces structured move objects (not text lines), so most
 * of the parse methods are unused in normal flow. They are retained so that
 * the BaseAdapter contract is satisfied and middleware that inspects the
 * parser (e.g. for option commands) continues to work. The text-protocol
 * format mirrors the original KingsRow protocol for backward compatibility.
 */
export class RapidDraughtsParser implements IProtocolParser<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  parseInfo(
    data: string | Record<string, unknown>,
  ): ICheckersSearchInfo | null {
    if (typeof data === "string") {
      // Format: "eval: 0.12, depth: 10, pv: 11-15 22-18"
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
    if (typeof data !== "string") return null;

    // Format: "bestmove: (none)" or "bestmove: none"
    if (data.includes("bestmove: (none)") || data.includes("bestmove: none")) {
      return { bestMove: null, raw: data };
    }

    // Format: "bestmove: 11-15 (eval: 0.12)" or "bestmove: 11-15"
    const match = data.match(/bestmove: ([\d-]+)(?: \(eval: ([-.\d]+)\))?/);
    if (match) {
      try {
        const moveToken = match[1]!;
        ProtocolValidator.assertNoInjection(moveToken, "BestMove");
        return {
          bestMove: createCheckersMove(moveToken),
          eval: match[2] ? parseFloat(match[2]) : undefined,
          raw: data,
        };
      } catch {
        return { bestMove: null, raw: data };
      }
    }
    return null;
  }

  createSearchCommand(options: ICheckersSearchOptions): string[] {
    ProtocolValidator.assertNoInjection(options, "search options", true);
    const commands: string[] = [];
    if (options.board) {
      ProtocolValidator.assertNoInjection(
        options.board as string,
        "board data",
      );
      commands.push(`set board ${options.board as string}`);
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

/** @deprecated Use RapidDraughtsParser */
export { RapidDraughtsParser as KingsRowParser };
