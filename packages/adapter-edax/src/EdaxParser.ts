import { 
  IProtocolParser,
  EngineError,
  EngineErrorCode 
} from "@multi-game-engines/core";

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
    if (/[\r\n\0;]/.test(sBoard)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Potential command injection detected in board data.",
        remediation: "Remove control characters (\\r, \\n, \\0, ;) from board input."
      });
    }

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
    if (/[\r\n\0;]/.test(sName) || /[\r\n\0;]/.test(sValue)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Potential command injection detected in option name or value.",
        remediation: "Remove control characters (\\r, \\n, \\0, ;) from input."
      });
    }

    return `set ${sName} ${sValue}`;
  }
}

export interface IOthelloSearchOptions {
  board: string;
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
