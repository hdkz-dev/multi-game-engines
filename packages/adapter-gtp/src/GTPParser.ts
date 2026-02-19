import {
  IProtocolParser,
  ProtocolValidator,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { GOBoard, GOMove, createGOMove } from "@multi-game-engines/core/go";

export interface IGOSearchOptions extends IBaseSearchOptions {
  board: GOBoard;
  color: "black" | "white" | "B" | "W";
}

export interface IGOSearchInfo extends IBaseSearchInfo {
  winrate?: number;
}

export interface IGOSearchResult extends IBaseSearchResult {
  bestMove: GOMove;
}

/**
 * 囲碁エンジン向けの GTP (Go Text Protocol) プロトコルパーサー。
 */
export class GTPParser implements IProtocolParser<
  IGOSearchOptions,
  IGOSearchInfo,
  IGOSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイル
  private static readonly VISITS_REGEX = /visits (\d+)/;
  private static readonly WINRATE_REGEX = /winrate ([\d.]+)/;
  private static readonly WHITESPACE_REGEX = /\s+/;
  private static readonly DIGITS_ONLY_REGEX = /^\d+$/;

  /**
   * 文字列を GOMove へ変換します。
   */
  private parseMove(value: string): GOMove | null {
    try {
      return createGOMove(value);
    } catch {
      return null;
    }
  }

  /**
   * エンジンからの info 行を解析し、構造化された探索情報を返します。
   * GTP プロトコルでは標準的な info コマンドは定義されていませんが、
   * KataGo 等の拡張 (visits, winrate) に対応しています。
   *
   * @param data - 解析対象の行データ。
   * @returns 解析された探索情報。info 行でない場合は null。
   */
  parseInfo(
    data: string | Uint8Array | Record<string, unknown>,
  ): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("info")) return null;

    const visitsMatch = data.match(GTPParser.VISITS_REGEX);
    const winrateMatch = data.match(GTPParser.WINRATE_REGEX);

    if (visitsMatch || winrateMatch) {
      return {
        raw: data,
        visits: visitsMatch ? parseInt(visitsMatch[1]!, 10) : undefined,
        winrate: winrateMatch ? parseFloat(winrateMatch[1]!) : undefined,
      };
    }
    return null;
  }

  /**
   * エンジンからの最終結果 (genmove の応答) を解析します。
   *
   * @param data - 解析対象の行データ。
   * @returns 解析された探索結果。応答でない場合は null。
   */
  parseResult(
    data: string | Uint8Array | Record<string, unknown>,
  ): IGOSearchResult | null {
    if (typeof data !== "string") return null;
    if (!data.startsWith("=")) return null;

    const tokens = data.substring(1).trim().split(GTPParser.WHITESPACE_REGEX);
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === ""))
      return null;

    let moveStr = tokens[0]!;
    if (GTPParser.DIGITS_ONLY_REGEX.test(moveStr)) {
      if (tokens.length < 2) return null;
      moveStr = tokens[1]!;
    }

    const bestMove = this.parseMove(moveStr);
    if (!bestMove) return null;

    return {
      raw: data,
      bestMove,
    };
  }

  /**
   * 探索オプションに基づいて GTP コマンドシーケンスを生成します。
   *
   * @param options - 探索オプション (盤面、手番など)。
   * @returns 実行すべき GTP コマンドの配列 (例: ["loadboard ...", "genmove black"])。
   * @throws {EngineError} インジェクション攻撃の可能性がある不正な入力が含まれる場合。
   */
  createSearchCommand(options: IGOSearchOptions): string[] {
    const commands: string[] = [];
    const sBoard = String(options.board);

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

  createStopCommand(): string {
    return "quit";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    const sValue = String(value);
    ProtocolValidator.assertNoInjection(name, "option name", true);
    ProtocolValidator.assertNoInjection(sValue, "option value", true);
    return `set_option ${name} ${sValue}`;
  }
}
