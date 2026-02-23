import {
  IBaseSearchResult,
  EngineError,
  EngineErrorCode,
} from "@multi-game-engines/core";
import { IEnsembleStrategy } from "../EnsembleAdapter.js";

/**
 * 多数決による合議戦略。
 * 最も多くのエンジンが提案した bestMove を選択します。
 */
export class MajorityVoteStrategy<
  T_INFO = unknown,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEnsembleStrategy<T_INFO, T_RESULT> {
  public readonly id = "majority-vote";

  aggregateResults(results: T_RESULT[]): T_RESULT {
    if (results.length === 0) {
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: "No results to aggregate",
        i18nKey: "adapters.ensemble.errors.noResults",
        engineId: this.id,
      });
    }

    const voteMap = new Map<string, { count: number; result: T_RESULT }>();

    for (const res of results) {
      const move = String(res.bestMove);
      const entry = voteMap.get(move) || { count: 0, result: res };
      entry.count++;
      voteMap.set(move, entry);
    }

    let winner = results[0]!;
    let maxVotes = 0;

    for (const entry of voteMap.values()) {
      if (entry.count > maxVotes) {
        maxVotes = entry.count;
        winner = entry.result;
      }
    }

    return winner;
  }
}
