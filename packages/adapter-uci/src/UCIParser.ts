import { IProtocolParser, Move, ProtocolValidator, EngineError, EngineErrorCode, createMove, truncateLog, ScoreNormalizer, PositionId, I18nKey, createI18nKey } from "@multi-game-engines/core";
import { ChessKey, tChess as translate } from "@multi-game-engines/i18n-chess";
import { createFEN, IChessSearchOptions, IChessSearchInfo, IChessSearchResult } from "@multi-game-engines/domain-chess";

/**
 * 汎用的な UCI (Universal Chess Interface) プロトコルパーサー。
 */
export class UCIParser implements IProtocolParser<
  IChessSearchOptions,
  IChessSearchInfo,
  IChessSearchResult
> {
  // 2026 Best Practice: 正規表現の事前コンパイルによる高速化 (NPSへの影響最小化)
  // UCI 指し手形式 (a2a4, e7e8q) および UCI 特有の nullmove (0000) をサポート。
  private static readonly MOVE_REGEX = /^([a-h][1-8][a-h][1-8][nbrq]?|0000)$/;

  // 2026 Best Practice: Set の定数化による GC 負荷の軽減
  private static readonly UCI_INFO_TOKENS = new Set([
    "depth",
    "seldepth",
    "time",
    "nodes",
    "pv",
    "multipv",
    "score",
    "currmove",
    "currmovenumber",
    "hashfull",
    "nps",
    "tbhits",
    "sbhits",
    "cpuload",
    "string",
    "refutation",
    "currline",
    "wdl",
    "lowerbound",
    "upperbound",
  ]);

  /**
   * 文字列を Move へ変換します。
   */
  private createMove(value: string): Move | null {
    if (!UCIParser.MOVE_REGEX.test(value)) return null;
    if (value === "0000") return null; // ヌルムーブを null に正規化
    return createMove(value);
  }

  /**
   * info 行を解析します。
   * UCI 標準のトークン（depth, score, pv 等）を抽出し、構造化データとして返します。
   *
   * @param data - 受信したデータ（文字列）。
   * @param positionId - 現在の局面 ID。
   * @returns 解析された思考情報。info 行でない場合は null。
   */
  parseInfo(
    data: string | Uint8Array | Record<string, unknown>,
    positionId?: PositionId,
  ): IChessSearchInfo | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("info ")) return null;

    const info: IChessSearchInfo = {
      positionId,
      depth: 0,
      score: { cp: 0, unit: "cp" },
      raw: line,
    };

    const parts = line.split(" ");

    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      if (key === undefined) continue;
      const hasNext = i + 1 < parts.length;
      const val = hasNext ? parts[i + 1] : undefined;

      switch (key) {
        case "depth":
          info.depth = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "score": {
          if (i + 2 < parts.length) {
            const scoreType = parts[++i];
            const valToken = parts[++i];
            const scoreValue = parseInt(valToken || "0", 10) || 0;

            if (scoreType === "cp" || scoreType === "mate") {
              info.score = {
                unit: scoreType,
                [scoreType]: scoreValue,
                normalized: ScoreNormalizer.normalize(
                  scoreValue,
                  scoreType,
                  "chess",
                ),
              };
            }
          }
          break;
        }
        case "nps":
          info.nps = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "nodes":
          info.nodes = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "time":
          info.time = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "pv": {
          const moves: Move[] = [];
          while (
            i + 1 < parts.length &&
            !UCIParser.UCI_INFO_TOKENS.has(parts[i + 1]!)
          ) {
            const token = parts[++i]!;
            // 2026 Best Practice: Validate even tokens from the engine (Defense in Depth)
            ProtocolValidator.assertNoInjection(token, "PV Move");
            const m = this.createMove(token);
            if (m) {
              moves.push(m);
            } else {
              console.warn(
                translate("parser.invalidPvMove", {
                  token: truncateLog(token),
                  line: truncateLog(line),
                }),
              );
            }
          }
          info.pv = moves;
          break;
        }
        case "seldepth":
          info.seldepth = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "hashfull":
          info.hashfull = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
        case "multipv":
          info.multipv = parseInt(val || "0", 10) || 0;
          if (val !== undefined) i++;
          break;
      }
    }

    return info;
  }

  /**
   * 2026 Zenith: エンジンからのエラーメッセージを i18n キーに変換。
   */
  translateError(message: string): I18nKey | null {
    const msg = message.toLowerCase();
    if (msg.includes("nnue") && msg.includes("not found")) {
      return createI18nKey("engine.errors.missingSources");
    }
    if (msg.includes("invalid") && msg.includes("option")) {
      return createI18nKey("parsers.generic.invalidOptionValue");
    }
    return null;
  }

  /**
   * bestmove 行を解析します。
   *
   * @param data - 受信したデータ（文字列）。
   * @returns 解析された探索結果（bestMove, ponder）。bestmove 行でない場合は null。
   */
  parseResult(
    data: string | Uint8Array | Record<string, unknown>,
  ): IChessSearchResult | null {
    if (typeof data !== "string") return null;
    const line = data;
    if (!line.startsWith("bestmove ")) return null;

    const parts = line.split(" ");
    const moveStr = parts[1] || "";

    // 2026 Best Practice: "none" / "(none)" は UCI における特殊な指し手トークン (null move)
    // これらを null として正規化して返すことで、型安全性を向上させる
    let bestMove: Move | null;
    if (moveStr === "none" || moveStr === "(none)" || moveStr === "0000") {
      bestMove = null;
    } else {
      bestMove = this.createMove(moveStr);
      if (!bestMove) return null; // Invalid format -> Parse failure
    }

    const result: IChessSearchResult = {
      bestMove,
      raw: line,
    };

    const ponderIndex = parts.indexOf("ponder");
    if (ponderIndex !== -1 && ponderIndex + 1 < parts.length) {
      const ponderStr = parts[ponderIndex + 1] || "";
      if (
        ponderStr === "none" ||
        ponderStr === "(none)" ||
        ponderStr === "0000"
      ) {
        result.ponder = null;
      } else {
        try {
          ProtocolValidator.assertNoInjection(ponderStr, "PonderMove");
          const ponder = this.createMove(ponderStr);
          if (ponder) {
            result.ponder = ponder;
          } else {
            console.warn(
              translate("parser.invalidPonder", {
                token: truncateLog(ponderStr),
                line: truncateLog(line),
              }),
            );
            result.ponder = null;
          }
        } catch {
          result.ponder = null;
        }
      }
    }

    return result;
  }

  /**
   * 探索開始コマンド (position ... -> go ...) を生成します。
   * FEN のバリデーションおよびインジェクション対策を含みます。
   *
   * @param options - 探索オプション (fen, depth, time, nodes)。
   * @returns 実行すべき UCI コマンド配列。
   * @throws {EngineError} FEN が未指定または不正な場合。
   */
  createSearchCommand(options: IChessSearchOptions): string[] {
    // 2026 Best Practice: 探索オプション全体を再帰的にインジェクションチェック (ADR-038)
    ProtocolValidator.assertNoInjection(options, "search options", true);

    if (!options.fen) {
      const i18nKey: ChessKey = "errors.missingFEN";
      throw new EngineError({
        code: EngineErrorCode.INTERNAL_ERROR,
        message: translate(i18nKey),
        remediation: "Provide a valid FEN string in search options.",
        i18nKey: createI18nKey(i18nKey),
      });
    }

    // 2026 Best Practice: Domain-specific structural validation + Injection defense
    ProtocolValidator.assertNoInjection(options.fen, "FEN position");
    const validatedFen = createFEN(options.fen);

    const isStartPos = validatedFen.toLowerCase() === "startpos";
    const commands: string[] = [
      isStartPos ? "position startpos" : `position fen ${validatedFen}`,
    ];

    let goCmd = "go";
    if (options.depth) goCmd += ` depth ${options.depth}`;
    if (options.time) goCmd += ` movetime ${options.time}`;
    if (options.nodes) goCmd += ` nodes ${options.nodes}`;

    commands.push(goCmd);
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

    return `setoption name ${name} value ${sValue}`;
  }
}
