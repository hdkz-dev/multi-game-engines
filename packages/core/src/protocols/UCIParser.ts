import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  MiddlewareCommand,
  IProtocolParser,
} from "../types.js";
import { createMove } from "../protocol/ProtocolValidator.js";

/**
 * 2026 Zenith Tier: UCI プロトコルの物理的な解析と生成。
 */
export class UCIParser implements IProtocolParser<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  // 物理的整合性: PV 等での誤検出を避けるため "none" を正規表現から除外
  private static readonly MOVE_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

  isReadyCommand = "isready";
  readyResponse = "readyok";

  createSearchCommand(options: IBaseSearchOptions): MiddlewareCommand {
    return "go"; // 簡易実装
  }

  createStopCommand(): MiddlewareCommand {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): MiddlewareCommand {
    return `setoption name ${name} value ${value}`;
  }

  parseInfo(line: unknown): IBaseSearchInfo | null {
    if (typeof line !== "string") return null;
    const parts = line.split(" ");
    const info: IBaseSearchInfo = { raw: line };

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "depth" && parts[i + 1]) {
        // 防御的コーディング: undefined/NaN チェック
        const depth = parseInt(parts[++i], 10);
        if (!isNaN(depth)) info.depth = depth;
      }
      if (parts[i] === "nodes" && parts[i + 1]) {
        const nodes = parseInt(parts[++i], 10);
        if (!isNaN(nodes)) info.nodes = nodes;
      }
    }
    return info;
  }

  parseResult(line: unknown): IBaseSearchResult | null {
    if (typeof line !== "string") return null;
    if (line.startsWith("bestmove")) {
      const parts = line.split(" ");
      const moveStr = parts[1];
      if (moveStr && moveStr !== "(none)" && moveStr !== "none") {
        return {
          bestMove: createMove(moveStr),
          raw: line,
        };
      }
      return { bestMove: null, raw: line };
    }
    return null;
  }
}
