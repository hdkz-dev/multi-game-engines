import { IProtocolParser, ProtocolValidator } from "@multi-game-engines/core";
import {
  ReversiBoard,
  ReversiMove,
  createReversiMove,
} from "@multi-game-engines/domain-reversi";

export class EdaxParser implements IProtocolParser<
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイル
  private static readonly DEPTH_REGEX = /depth (\d+)/;

  parseInfo(data: string | Record<string, unknown>): IReversiSearchInfo | null {
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
  ): IReversiSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("move ")) return null;

    const moveStr = data.slice(5).trim();
    if (!moveStr) return null;

    // Reversi 強制パス: エンジン応答は有効だが board move なし
    if (moveStr.toLowerCase() === "pass") {
      return { raw: data, bestMove: null };
    }

    try {
      const bestMove = createReversiMove(moveStr);
      return {
        raw: data,
        bestMove,
      };
    } catch {
      // パースエラー時も生データを返すことでデバッグ可能にする
      return { raw: data, bestMove: null };
    }
  }

  createSearchCommand(options: IReversiSearchOptions): string[] {
    const commands: string[] = [];
    const sBoard = String(options.board);

    // 2026 Best Practice: Command Injection Prevention (Refuse by Exception)
    ProtocolValidator.assertNoInjection(sBoard, "board data", true);

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
    ProtocolValidator.assertNoInjection(name, "option name", true);
    ProtocolValidator.assertNoInjection(sValue, "option value", true);

    return `set ${name} ${sValue}`;
  }
}

export interface IReversiSearchOptions {
  board: ReversiBoard;
  depth?: number;
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface IReversiSearchInfo {
  raw: string;
  depth: number;
  [key: string]: unknown;
}

export interface IReversiSearchResult {
  raw: string;
  bestMove: ReversiMove | null;
  [key: string]: unknown;
}
