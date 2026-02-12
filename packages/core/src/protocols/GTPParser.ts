import { IProtocolParser } from "./types";
import { IGOSearchOptions, IGOSearchInfo, IBaseSearchResult, Move } from "../types";

/**
 * GTP (Go Text Protocol) のパーサー実装。
 * KataGo 等の拡張分析コマンドにも対応。
 */
export class GTPParser implements IProtocolParser<IGOSearchOptions, IGOSearchInfo, IBaseSearchResult> {
  /**
   * GTP の思考状況（lz-analyze 等の出力）を解析します。
   * 形式例: info move q16 visits 1000 winrate 0.55 ...
   */
  parseInfo(data: string | Uint8Array): IGOSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("info ")) return null;

    const info: IGOSearchInfo = {
      depth: 0,
      score: 0,
      raw: line,
    };

    // 簡易的なスペース区切り解析
    const parts = line.split(" ");
    for (let i = 0; i < parts.length; i++) {
      switch (parts[i]) {
        case "visits":
          info.visits = parseInt(parts[i + 1], 10);
          break;
        case "winrate":
          info.winrate = parseFloat(parts[i + 1]);
          // 2026 Best Practice: 勝率を cp 相当のスコアに簡易変換 (オプション)
          info.score = Math.round((info.winrate - 0.5) * 2000);
          break;
        // pv, visits 等の追加パースロジックをここに実装
      }
    }

    return info;
  }

  /**
   * 最終結果を解析します。
   * GTP では通常 "= q16" のような形式。
   */
  parseResult(data: string | Uint8Array): IBaseSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("= ")) return null;
    
    const move = line.substring(2).trim();
    if (!move) return null;

    return {
      bestMove: move as Move,
      raw: line,
    };
  }

  /**
   * 探索コマンドを生成します。
   * 2026 Best Practice: KataGo の lz-analyze コマンドを優先使用。
   */
  createSearchCommand(options: IGOSearchOptions): string | string[] {
    const commands: string[] = [];
    
    // 局面の設定
    if (options.sgf) {
      commands.push(`loadsgf ${options.sgf}`);
    }

    // 時間設定 (time_settings B W Byoyomi)
    if (options.btime !== undefined && options.wtime !== undefined && options.byoyomi !== undefined) {
      // 秒単位に変換
      const b = Math.floor(options.btime / 1000);
      const w = Math.floor(options.wtime / 1000);
      const byo = Math.floor(options.byoyomi / 1000);
      commands.push(`time_settings ${b} ${w} ${byo}`);
    }

    // 分析開始コマンド
    // lz-analyze [player] [interval] <keys...>
    // ここでは簡易的に interval のみ指定
    const interval = 50; 
    let cmd = `lz-analyze ${interval}`;
    
    // オプションがあれば追加 (例: visits 制限など)
    // KataGo の lz-analyze は引数で制限を受け取らない場合が多いが、
    // 必要に応じて genmove コマンド等への切り替えも検討。
    // 今回は lz-analyze を基本とする。

    commands.push(cmd); 

    return commands;
  }

  createStopCommand(): string {
    // GTP では解析中に別のコマンドを送ることで暗黙的に停止、
    // または解析モード自体を終了させる必要がある
    return "stop"; 
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    // GTP の標準的な設定コマンド
    return `set ${name} ${value}`;
  }
}
