import {
  IProtocolParser,
  ProtocolValidator,
  Brand,
} from "@multi-game-engines/core";

/** オセロの盤面データ */
export type OthelloBoard = Brand<string, "OthelloBoard">;
/** オセロの指し手 */
export type OthelloMove = Brand<string, "OthelloMove">;

export class EdaxParser implements IProtocolParser<
  IOthelloSearchOptions,
  IOthelloSearchInfo,
  IOthelloSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイル
  private static readonly DEPTH_REGEX = /depth (\d+)/;
  // Edax 指し手形式 (a1-h8, PS (Pass) 等)。
  private static readonly MOVE_REGEX = /^([a-h][1-8]|PS)$/i;

  /**
   * 文字列を OthelloMove へ変換します。
   */
  private createMove(value: string): OthelloMove | null {
    if (!EdaxParser.MOVE_REGEX.test(value)) return null;
    return value as OthelloMove;
  }

  parseInfo(data: string | Record<string, unknown>): IOthelloSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.includes("depth")) return null;

    const match = data.match(EdaxParser.DEPTH_REGEX);
    if (match) {
      return {
        raw: data,
        depth: parseInt(match[1], 10),
      };
    }
    return null;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IOthelloSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("move")) return null;

    const moveStr = data.slice(5).trim();
    const bestMove = this.createMove(moveStr);
    if (!bestMove) return null;

    return {
      raw: data,
      bestMove,
    };
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
    const sValue = String(value);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(sValue, "option value");

    return `set ${name} ${sValue}`;
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
  bestMove: OthelloMove;
}
