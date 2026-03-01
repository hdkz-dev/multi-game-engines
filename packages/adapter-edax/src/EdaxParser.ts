import { IProtocolParser, ProtocolValidator, ScoreNormalizer, PositionId } from "@multi-game-engines/core";
import { createReversiMove,
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult, } from "@multi-game-engines/domain-reversi";

export class EdaxParser implements IProtocolParser<
  IReversiSearchOptions,
  IReversiSearchInfo,
  IReversiSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイル
  // 例: "info depth 10 score cp 12 pv e6" あるいは "depth 10 score 12" 等、出力形式に合わせたパース
  private static readonly DEPTH_REGEX = /depth\s+(\d+)/i;
  private static readonly SCORE_REGEX = /score\s+([+-]?\d+)/i;

  parseInfo(
    data: string | Record<string, unknown>,
    positionId?: PositionId,
  ): IReversiSearchInfo | null {
    if (typeof data !== "string") return null;

    // Edax の出力を想定
    if (!data.includes("depth") && !data.includes("score")) return null;

    const info: IReversiSearchInfo = { raw: data, positionId, depth: 0 };

    const depthMatch = data.match(EdaxParser.DEPTH_REGEX);
    if (depthMatch && depthMatch[1]) {
      info.depth = parseInt(depthMatch[1], 10);
    }

    const scoreMatch = data.match(EdaxParser.SCORE_REGEX);
    if (scoreMatch && scoreMatch[1]) {
      const diff = parseInt(scoreMatch[1], 10);
      info.score = {
        unit: "diff",
        points: diff,
        normalized: ScoreNormalizer.normalize(diff, "diff", "reversi"),
      };
    }

    return info;
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
