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
  }

  aggregateResults(results: T_RESULT[]): T_RESULT {
    if (results.length === 0) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "No results to aggregate",
        i18nKey: "adapters.ensemble.errors.noResults",
      });
    }

    const voteCounts = new Map<string, number>();
    let maxWeight = 0;
    let winnerMove: string | null = null;

    for (const result of results) {
      const move = String(result.bestMove);
      // 注意: WeightedStrategy はエンジン ID ごとの重みが必要だが、
      // aggregateResults(results[]) シグネチャでは個別の ID が失われているため、
      // ここでは暫定的に全結果を等しく扱うか、result に ID を含める必要がある。
      // TODO: EnsembleAdapter 側で ID 付きの結果を渡せるようにインターフェースを見直す
      const weight = 1.0;

      const currentWeight = (voteCounts.get(move) || 0) + weight;
      voteCounts.set(move, currentWeight);

      if (currentWeight > maxWeight) {
        maxWeight = currentWeight;
        winnerMove = move;
      }
    }

    // 勝者の指し手を持つ最初のエントリを返す
    for (const result of results) {
      if (String(result.bestMove) === winnerMove) {
        return result;
      }
    }

    return results[0]!;
  }
}
