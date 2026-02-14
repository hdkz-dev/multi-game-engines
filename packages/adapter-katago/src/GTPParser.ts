import {
  IProtocolParser,
  ProtocolValidator,
  Brand,
} from "@multi-game-engines/core";

/** 囲碁の盤面データ */
export type GOBoard = Brand<string, "GOBoard">;
/** 囲碁の指し手 */
export type GOMove = Brand<string, "GOMove">;

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
        bestMove: move as GOMove,
      };
    }
    return null;
  }

  createSearchCommand(options: IGOSearchOptions): string[] {
    const commands: string[] = [];
    const sBoard = String(options.board);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sBoard, "board data", true);

    commands.push(`loadboard ${sBoard}`);

    const sColor = String(options.color);
    ProtocolValidator.assertNoInjection(sColor, "color", true);

    const normalized = sColor.toLowerCase();
    const color =
      normalized === "white" || normalized === "w" ? "white" : "black";

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
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(name, "option name", true);
    ProtocolValidator.assertNoInjection(sValue, "option value", true);

    return `set_option ${name} ${sValue}`;
  }
}

export interface IGOSearchOptions {
  board: GOBoard;
  color: "black" | "white" | "B" | "W";
  signal?: AbortSignal;
}

export interface IGOSearchInfo {
  raw: string;
  visits?: number;
  winrate?: number;
}

export interface IGOSearchResult {
  raw: string;
  bestMove: GOMove;
}
