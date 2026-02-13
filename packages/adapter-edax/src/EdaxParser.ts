import { 
  IProtocolParser,
  ProtocolValidator,
  Brand
} from "@multi-game-engines/core";

/** オセロの盤面データ */
export type OthelloBoard = Brand<string, "OthelloBoard">;

export class EdaxParser implements IProtocolParser<
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IOthelloSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.includes("depth")) return null;

    const depth = data.match(/depth (\d+)/)?.[1];
    if (depth) {
      return {
        raw: data,
        depth: parseInt(depth, 10),
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IOthelloSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("move")) return null;

    const move = data.slice(5).trim();
    if (move) {
      return {
        raw: data,
        bestMove: move,
      };
    }
    return null;
  }

  createSearchCommand(options: IOthelloSearchOptions): string[] {
    const commands: string[] = [];
    const sBoard = String(options.board);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sBoard, "board data");

    commands.push(`setboard ${sBoard}`);
    commands.push(`go ${options.depth ?? 20}`);
    return commands;
  }

  /**
   * 探索停止コマンドを生成します。
   */
  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    const sName = String(name);
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sName, "option name");
    ProtocolValidator.assertNoInjection(sValue, "option value");

    return `set ${sName} ${sValue}`;
  }
}

export interface IOthelloSearchOptions {
  board: OthelloBoard;
  depth?: number;
  signal?: AbortSignal;
}

export interface IOthelloSearchInfo {
  raw: string;
  depth: number;
}

export interface IOthelloSearchResult {
  raw: string;
  bestMove: string;
}
