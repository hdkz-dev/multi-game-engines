import { IBaseSearchResult, EngineError, EngineErrorCode, createI18nKey } from "@multi-game-engines/core";
import { EnginesKey } from "@multi-game-engines/i18n-engines";
import { IEnsembleStrategy } from "../EnsembleAdapter.js";
import { tEngines as translate } from "@multi-game-engines/i18n-engines";

/**
 * 各エンジンに重みを設定し、重み付き多数決を行う戦略。
 */
export class WeightedStrategy<
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEnsembleStrategy<T_INFO, T_RESULT> {
  readonly id = "weighted";
  private weights: Record<string, number>;

  constructor(weights: Record<string, number> = {}) {
    this.weights = weights;
    // 2026 Best Practice: 重みが設定されていることをデバッグログで通知
    if (Object.keys(weights).length > 0) {
      const i18nKey: EnginesKey = "ensemble.weighted.initialized";
      console.debug(
        translate(i18nKey, {
          engines: Object.keys(weights).join(", "),
        }),
      );
    }
  }

  aggregateResults(resultsMap: Map<string, T_RESULT>): T_RESULT {
    if (resultsMap.size === 0) {
      const i18nKey: EnginesKey = "ensemble.errors.noResults";
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey),
        i18nKey: createI18nKey(i18nKey),
      });
    }

    const voteCounts = new Map<string, number>();
    let maxWeight = 0;
    let winnerMove: string | null = null;

    for (const [engineId, result] of resultsMap.entries()) {
      // 2026 Best Practice: bestMove が存在しない場合は投票から除外
      // null や undefined だけでなく、空文字も除外対象とする
      if (!result.bestMove) continue;

      const move = String(result.bestMove);
      // 2026 Best Practice: エンジン固有の重みを適用
      // resultsMap のキーが this.weights のキーと一致することを期待
      const weight = this.weights[engineId];

      if (weight === undefined && Object.keys(this.weights).length > 0) {
        const warnKey: EnginesKey = "ensemble.weighted.noWeight";
        console.warn(
          translate(warnKey, {
            id: engineId,
          }),
        );
      }

      const finalWeight = typeof weight === "number" ? weight : 1.0;

      const currentWeight = (voteCounts.get(move) || 0) + finalWeight;
      voteCounts.set(move, currentWeight);

      if (currentWeight > maxWeight) {
        maxWeight = currentWeight;
        winnerMove = move;
      }
    }

    // 勝者の指し手を持つ最初のエントリを返す
    if (winnerMove) {
      for (const result of resultsMap.values()) {
        if (result.bestMove && String(result.bestMove) === winnerMove) {
          return result;
        }
      }
    }

    return resultsMap.values().next().value!;
  }
}
