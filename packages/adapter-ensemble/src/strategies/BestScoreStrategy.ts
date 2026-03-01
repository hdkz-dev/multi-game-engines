import { IBaseSearchResult, IScoreInfo, EngineError, EngineErrorCode, createI18nKey } from "@multi-game-engines/core";
import { EnginesKey } from "@multi-game-engines/i18n-engines";
import { IEnsembleStrategy } from "../EnsembleAdapter.js";
import { tEngines as translate } from "@multi-game-engines/i18n-engines";

/**
 * 2026 Best Practice: IScoreInfo の型ガード。
 */
const isScoreInfo = (value: unknown): value is IScoreInfo => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.cp === "number" ||
    typeof v.mate === "number" ||
    typeof v.points === "number" ||
    typeof v.winrate === "number"
  );
};

/**
 * 各エンジンの評価値（score.cp または score.winrate）を比較し、
 * 最も有利な評価を下したエンジンの指し手を採用する戦略。
 */
export class BestScoreStrategy<
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEnsembleStrategy<T_INFO, T_RESULT> {
  readonly id = "best-score";

  aggregateResults(resultsMap: Map<string, T_RESULT>): T_RESULT {
    const results = Array.from(resultsMap.values());
    if (results.length === 0) {
      const i18nKey: EnginesKey = "ensemble.errors.noResults";
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey),
        i18nKey: createI18nKey(i18nKey),
      });
    }

    let bestResult: T_RESULT | null = null;
    let maxScore = -Infinity;
    let usingNormalized = false;

    for (const result of results) {
      const score = isScoreInfo(result.score) ? result.score : undefined;
      if (!score) continue;

      // 2026 Zenith Standard: normalized スコアがある場合はそれを最優先で比較
      if (score.normalized !== undefined) {
        if (!usingNormalized || score.normalized > maxScore) {
          usingNormalized = true;
          maxScore = score.normalized;
          bestResult = result;
        }
        continue;
      }

      // すでに normalized スコアを使用している場合は raw スコアは無視
      if (usingNormalized) continue;

      // 2026 Best Practice: フォールバック (詰み(mate) > センチポーン(cp) > 勝率(winrate))
      // mate score: 正の値は自分が勝ち（少ないほど良い）、負の値は自分が負け（大きいほど良い）
      let currentScore = -Infinity;
      if (score.mate !== undefined) {
        if (score.mate > 0) {
          // 自分が勝ち: 2,000,000 - 手数 (mate in 1 = 1,999,999)
          currentScore = 2000000 - score.mate;
        } else if (score.mate < 0) {
          // 自分が負け: -2,000,000 - 手数 (mate in -1 = -2,000,001)
          currentScore = -2000000 - score.mate;
        } else {
          currentScore = 0;
        }
      } else if (score.cp !== undefined) {
        currentScore = score.cp;
      } else if (score.winrate !== undefined) {
        currentScore = score.winrate - 1000000;
      }

      if (currentScore > maxScore) {
        maxScore = currentScore;
        bestResult = result;
      }
    }

    // スコアが取れない場合は最初の結果を返す
    return bestResult || results[0]!;
  }
}
