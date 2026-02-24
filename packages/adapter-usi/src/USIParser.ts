import {
  IProtocolParser,
  EngineError,
  EngineErrorCode,
  I18nKey,
  ProtocolValidator,
  truncateLog,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";
import {
  createShogiMove,
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult,
} from "@multi-game-engines/domain-shogi";

/**
 * 2026 Zenith Tier: 汎用 USI (Universal Shogi Interface) パーサー。
 * 境界チェックと詳細なエラーメッセージを備え、堅牢な解析を提供します。
 */
export class USIParser implements IProtocolParser<
  IShogiSearchOptions,
  IShogiSearchInfo,
  IShogiSearchResult
> {
  parseInfo(data: string | Record<string, unknown>): IShogiSearchInfo | null {
    if (typeof data !== "string") return null;

    if (!data.startsWith("info ")) return null;

    const info: IShogiSearchInfo = { raw: data };
    const parts = data.split(" ");

    // 2026 Best Practice: 配列境界チェックの徹底
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      switch (part) {
        case "depth":
          if (i + 1 < parts.length) info.depth = parseInt(parts[++i]!, 10);
          break;
        case "seldepth":
          if (i + 1 < parts.length) info.seldepth = parseInt(parts[++i]!, 10);
          break;
        case "time":
          if (i + 1 < parts.length) info.time = parseInt(parts[++i]!, 10);
          break;
        case "nodes":
          if (i + 1 < parts.length) info.nodes = parseInt(parts[++i]!, 10);
          break;
        case "nps":
          if (i + 1 < parts.length) info.nps = parseInt(parts[++i]!, 10);
          break;
        case "hashfull":
          if (i + 1 < parts.length) info.hashfull = parseInt(parts[++i]!, 10);
          break;
        case "score":
          if (i + 2 < parts.length) {
            const type = parts[++i];
            const valToken = parts[++i];
            const value = valToken ? parseInt(valToken, 10) : NaN;
            if (Number.isFinite(value)) {
              if (type === "cp") {
                info.score = { cp: value };
              } else if (type === "mate") {
                info.score = { mate: value };
              }
            }
          }
          break;
        case "currmove":
          if (i + 1 < parts.length) {
            const token = parts[++i]!;
            try {
              info.currMove = createShogiMove(token);
            } catch {
              console.warn(
                translate("parsers.usi.invalidCurrMove" as I18nKey, {
                  token: truncateLog(token),
                  line: truncateLog(data),
                }),
              );
            }
          }
          break;
        case "multipv":
          if (i + 1 < parts.length) {
            const val = parseInt(parts[++i]!, 10);
            if (Number.isFinite(val)) info.multipv = val;
          }
          break;
        case "pv":
          // PV は残りの要素すべて。各要素を検証
          info.pv = [];
          for (let j = i + 1; j < parts.length; j++) {
            const m = parts[j];
            if (!m) continue;
            try {
              // 2026 Best Practice: PV 内部の指し手に対してもインジェクションチェックを強制
              ProtocolValidator.assertNoInjection(m, "PV Move");
              const move = createShogiMove(m);
              info.pv.push(move);
            } catch {
              console.warn(
                translate("parsers.usi.invalidPvMove" as I18nKey, {
                  token: truncateLog(m),
                  line: truncateLog(data),
                }),
              );
            }
          }
          i = parts.length;
          break;
      }
    }

    return info;
  }

  parseResult(
    data: string | Record<string, unknown>,
  ): IShogiSearchResult | null {
    if (typeof data !== "string") return null;

    if (!data.startsWith("bestmove")) return null;

    const parts = data.trim().split(" ");
    if (parts.length < 2 || (parts[0] === "bestmove" && parts.length === 1)) {
      const i18nKey = "engine.errors.invalidMoveFormat" as I18nKey;
      const i18nParams = { move: truncateLog(data) };
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey, i18nParams),
        i18nKey,
        i18nParams,
      });
    }

    const moveStr = parts[1]!;
    if (moveStr !== "none" && moveStr !== "(none)") {
      ProtocolValidator.assertNoInjection(moveStr, "BestMove");
    }

    const bestMove =
      moveStr === "none" || moveStr === "(none)"
        ? null
        : createShogiMove(moveStr);

    const result: IShogiSearchResult = {
      bestMove,
      raw: data,
    };

    const ponderIdx = parts.indexOf("ponder");
    if (ponderIdx !== -1 && ponderIdx + 1 < parts.length) {
      const ponderToken = parts[ponderIdx + 1]!;
      if (ponderToken === "none" || ponderToken === "(none)") {
        result.ponder = null;
      } else {
        try {
          ProtocolValidator.assertNoInjection(ponderToken, "PonderMove");
          result.ponder = createShogiMove(ponderToken);
        } catch {
          console.warn(
            translate("parsers.usi.invalidPonder", {
              token: truncateLog(ponderToken),
              line: truncateLog(data),
            }),
          );
          result.ponder = null;
        }
      }
    }

    return result;
  }

  createSearchCommand(options: IShogiSearchOptions): string[] {
    // 2026 Best Practice: 探索オプション全体を再帰的にインジェクションチェック
    ProtocolValidator.assertNoInjection(options, "search options", true);

    const commands: string[] = [];
    if (options.sfen) {
      // 2026 Best Practice: 局面データに対するインジェクション対策を徹底 (Refuse by Exception)
      ProtocolValidator.assertNoInjection(options.sfen, "SFEN position");
      commands.push(`position sfen ${options.sfen}`);
    } else {
      commands.push("position startpos");
    }

    let goCmd = "go";
    if (options.ponder) goCmd += " ponder";

    // 2026 Best Practice: 各種制限パラメータの構築
    const limits: string[] = [];
    if (options.depth !== undefined) limits.push(`depth ${options.depth}`);
    if (options.nodes !== undefined) limits.push(`nodes ${options.nodes}`);
    if (options.time !== undefined)
      limits.push(`btime ${options.time} wtime ${options.time}`);
    if (options.movetime !== undefined)
      limits.push(`movetime ${options.movetime}`);

    if (limits.length > 0) {
      goCmd += " " + limits.join(" ");
    } else if (!options.ponder) {
      // 制限がなく、ponder でもない場合は分析用無制限
      goCmd += " infinite";
    }

    commands.push(goCmd);
    return commands;
  }

  createStopCommand(): string {
    return "stop";
  }

  createOptionCommand(name: string, value: string | number | boolean): string {
    ProtocolValidator.assertNoInjection(name, "option name");
    ProtocolValidator.assertNoInjection(String(value), "option value");
    return `setoption name ${name} value ${value}`;
  }
}
