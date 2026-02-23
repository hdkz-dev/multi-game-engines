import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IScoreInfo,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";
import { IEnsembleStrategy } from "../EnsembleAdapter.js";

/**
 * 各エンジンの評価値（score.cp または score.winrate）を比較し、
 * 最も有利な評価を下したエンジンの指し手を採用する戦略。
 */
export class BestScoreStrategy<
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEnsembleStrategy<T_INFO, T_RESULT> {
  readonly id = "best-score";

  aggregateResults(results: T_RESULT[]): T_RESULT {
    if (results.length === 0) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "No results to aggregate",
        i18nKey: "adapters.ensemble.errors.noResults",
      });
    }

    let bestResult: T_RESULT | null = null;
    let maxScore = -Infinity;

    for (const result of results) {
      const score = result.score as IScoreInfo | undefined;
      if (!score) continue;

      // cp (センチポーン) または winrate (勝率) を優先的に評価
      const currentScore =
        score.cp !== undefined ? score.cp : (score.winrate ?? -Infinity);

      if (currentScore > maxScore) {
        maxScore = currentScore;
        bestResult = result;
      }
    }

    // スコアが取れない場合は最初の結果を返す
    return bestResult || results[0]!;
  }
}
