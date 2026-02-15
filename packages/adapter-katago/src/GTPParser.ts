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
  // 2026 Best Practice: 正規表現の事前コンパイル
  private static readonly VISITS_REGEX = /visits (\d+)/;
  private static readonly WINRATE_REGEX = /winrate ([\d.]+)/;
  // GTP 指し手形式 (A1, B19, pass, resign 等)。
  // 座標は I を除く A-T 1-19
  private static readonly MOVE_REGEX =
    /^([A-HJ-T](1[0-9]|[1-9])|pass|resign)$/i;

  /**
   * 文字列を GOMove へ変換します。
   */
  private createMove(value: string): GOMove | null {
    if (!GTPParser.MOVE_REGEX.test(value)) return null;
    return value as GOMove;
  }

  parseInfo(data: string | Record<string, unknown>): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info")) return null;

    const visitsMatch = data.match(GTPParser.VISITS_REGEX);
    const winrateMatch = data.match(GTPParser.WINRATE_REGEX);

    if (visitsMatch || winrateMatch) {
      return {
        raw: data,
        visits: visitsMatch ? parseInt(visitsMatch[1], 10) : undefined,
        winrate: winrateMatch ? parseFloat(winrateMatch[1]) : undefined,
      };
    }
    return null;
  }

  parseResult(data: string | Record<string, unknown>): IGOSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("=")) return null;

    // GTP レスポンス形式: "= <id> <move>" または "= <move>"
    // ID は省略可能。
    // ReDoS 回避のため正規表現ではなく split を使用
    const tokens = data.substring(1).trim().split(/\s+/);
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === ""))
      return null;

    let moveStr = tokens[0];
    // 先頭が数字のみの場合は ID として読み飛ばす
    if (/^\d+$/.test(moveStr)) {
      if (tokens.length < 2) return null; // IDのみで指し手がない
      moveStr = tokens[1];
    }

    const bestMove = this.createMove(moveStr);
    if (!bestMove) return null;

    return {
      raw: data,
      bestMove,
    };
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
