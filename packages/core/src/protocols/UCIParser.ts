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
  // private static readonly MOVE_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

  isReadyCommand = "isready";
  readyResponse = "readyok";

  createSearchCommand(_options: IBaseSearchOptions): MiddlewareCommand {
    return "go";
  }

  createStopCommand(): MiddlewareCommand {
    return "stop";
  }

  createOptionCommand(
    name: string,
    value: string | number | boolean,
  ): MiddlewareCommand {
    return `setoption name ${name} value ${value}`;
  }

  parseInfo(line: unknown): IBaseSearchInfo | null {
    if (typeof line !== "string") return null;
    const parts = line.split(" ");
    const info: IBaseSearchInfo = { raw: line };

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "depth") {
        const val = parts[++i];
        if (val) {
          const depth = parseInt(val, 10);
          if (!isNaN(depth)) info.depth = depth;
        }
      }
      if (parts[i] === "nodes") {
        const val = parts[++i];
        if (val) {
          const nodes = parseInt(val, 10);
          if (!isNaN(nodes)) info.nodes = nodes;
        }
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
