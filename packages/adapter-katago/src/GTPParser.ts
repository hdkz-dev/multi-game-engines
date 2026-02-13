import { 
  IProtocolParser,
  EngineError,
  EngineErrorCode 
} from "@multi-game-engines/core";

export class GTPParser implements IProtocolParser<
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info")) return null;

    const visits = data.match(/visits (\d+)/)?.[1];
    const winrate = data.match(/winrate ([\d.]+)/)?.[1];

    if (visits || winrate) {
      return {
        raw: data,
        visits: visits ? parseInt(visits, 10) : undefined,
        winrate: winrate ? parseFloat(winrate) : undefined,
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IGOSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("=")) return null;

    const move = data.slice(2).trim();
    if (move) {
      return {
        raw: data,
        bestMove: move,
      };
    }
    return null;
  }

  createSearchCommand(options: IGOSearchOptions): string[] {
    const commands: string[] = [];
    const sBoard = String(options.board);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    // GTP allows ; for SGF, but rejects newlines
    if (/[\r\n\0]/.test(sBoard)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Potential command injection detected in board data.",
        remediation: "Remove control characters (\\r, \\n, \\0) from board input."
      });
    }

    commands.push(`loadboard ${sBoard}`);

    const sColor = String(options.color);
    if (/[\r\n\0]/.test(sColor)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Potential command injection detected in color.",
        remediation: "Remove control characters (\\r, \\n, \\0) from color."
      });
    }
    
    const color = (sColor === "white" || sColor === "W") ? "white" : "black";
    
    commands.push(`genmove ${color}`);
    return commands;
  }

  /**
   * 探索停止コマンドを生成します。
   */
  createStopCommand(): string {
    return "quit";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    const sName = String(name);
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    // GTP allows ; for SGF, but rejects newlines
    if (/[\r\n\0]/.test(sName) || /[\r\n\0]/.test(sValue)) {
      throw new EngineError({
        code: EngineErrorCode.SECURITY_ERROR,
        message: "Potential command injection detected in option name or value.",
        remediation: "Remove control characters (\\r, \\n, \\0) from input."
      });
    }

    return `set_option ${sName} ${sValue}`;
  }
}

export interface IGOSearchOptions {
  board: string;
  color: "black" | "white";
  signal?: AbortSignal;
}

export interface IGOSearchInfo {
  raw: string;
  visits?: number;
  winrate?: number;
}

export interface IGOSearchResult {
  raw: string;
  bestMove: string;
}
