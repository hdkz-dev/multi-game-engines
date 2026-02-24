import {
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";
import { IEnsembleStrategy } from "../EnsembleAdapter.js";

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
    // TODO: EnsembleAdapter のインターフェースを Map<id, result> に拡張するまで、
    // 重み付けは均等 (1.0) として扱われるため、警告を表示。
    if (Object.keys(weights).length > 0) {
      console.warn(
        "[WeightedStrategy] Engine-specific weights are not yet applied. " +
          "All engines are weighted uniformly until the aggregate interface is updated to include engine IDs.",
      );
    }
  }

  aggregateResults(results: T_RESULT[]): T_RESULT {
    if (results.length === 0) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "No search results provided for aggregation",
        i18nKey: "adapters.ensemble.errors.noResults",
      });
    }

    const voteCounts = new Map<string, number>();
    let maxWeight = 0;
    let winnerMove: string | null = null;

    for (const result of results) {
      // 2026 Best Practice: bestMove が存在しない場合は投票から除外 (Silent contamination prevention)
      if (result.bestMove === null || result.bestMove === undefined) continue;

      const move = String(result.bestMove);
      // 注意: WeightedStrategy はエンジン ID ごとの重みが必要だが、
      // aggregateResults(results[]) シグネチャでは個別の ID が失われているため、
      // 現状は全結果を等しく (1.0) 扱う。
      const weight = 1.0;

      const currentWeight = (voteCounts.get(move) || 0) + weight;
      voteCounts.set(move, currentWeight);

      if (currentWeight > maxWeight) {
        maxWeight = currentWeight;
        winnerMove = move;
      }
    }

    // 勝者の指し手を持つ最初のエントリを返す
    if (winnerMove) {
      for (const result of results) {
        if (result.bestMove && String(result.bestMove) === winnerMove) {
          return result;
        }
      }
    }

    return results[0]!;
  }
}
