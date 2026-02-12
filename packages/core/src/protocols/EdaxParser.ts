import { IProtocolParser } from "./types";
import { IOthelloSearchOptions, IOthelloSearchInfo, IBaseSearchResult, Move } from "../types";

/**
 * Edax (Othello Engine) 独自のテキストプロトコルパーサー。
 */
export class EdaxParser implements IProtocolParser<IOthelloSearchOptions, IOthelloSearchInfo, IBaseSearchResult> {
  /**
   * Edax の思考状況を解析します。
   * 例: "Depth: 12  Mid: +4  move: c3"
   */
  parseInfo(data: string | Uint8Array): IOthelloSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data.trim();

    const info: IOthelloSearchInfo = {
      depth: 0,
      score: 0,
      raw: line,
    };

    // Depth 解析
    const depthMatch = line.match(/Depth:\s*(\d+)/i);
    if (depthMatch) info.depth = parseInt(depthMatch[1], 10);

    // 評価値 (Mid or Exact) 解析
    const midMatch = line.match(/Mid:\s*([+-]?\d+)/i);
    const exactMatch = line.match(/Exact:\s*([+-]?\d+)/i);

    if (exactMatch) {
      info.score = parseInt(exactMatch[1], 10);
      info.isExact = true;
    } else if (midMatch) {
      info.score = parseInt(midMatch[1], 10);
      info.isExact = false;
    }

    // pv (move) 解析
    const moveMatch = line.match(/move:\s*([a-h][1-8])/i);
    if (moveMatch) {
      info.pv = [moveMatch[1] as Move];
    }

    return (depthMatch || midMatch || exactMatch) ? info : null;
  }

  /**
   * 最終結果を解析します。
   * Edax は検討終了時に最善手を単独で出力する場合があります。
   */
  parseResult(data: string | Uint8Array): IBaseSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data.trim();

    // "= c3" または行全体が "c3" 形式の場合を想定
    const moveMatch = line.match(/^(=?\s*)([a-h][1-8])$/i);
    if (!moveMatch) return null;

    return {
      bestMove: moveMatch[2].toLowerCase() as Move,
      raw: line,
    };
  }

  /**
   * 探索コマンドを生成します。
   */
  createSearchCommand(options: IOthelloSearchOptions): string | string[] {
    const commands: string[] = [];
    
    if (options.board) {
      // 局面設定コマンド (Edax 形式: setboard <64文字>)
      commands.push(`setboard ${options.board} ${options.isBlack ? 'B' : 'W'}`);
    }

    // 探索開始コマンド
    const depth = options.depth || 20;
    commands.push(`go ${depth}`);

    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    // Edax のコマンド形式に合わせる (例: threads 4)
    return `${name} ${value}`;
  }
}
