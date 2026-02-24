import {
  IBaseSearchResult,
  EngineError,
  EngineErrorCode,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";
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

  aggregateResults(resultsMap: Map<string, T_RESULT>): T_RESULT {
    const results = Array.from(resultsMap.values());
    if (results.length === 0) {
      const i18nKey = "adapters.ensemble.errors.noResults" as I18nKey;
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey),
        i18nKey,
      });
    }

    const voteMap = new Map<string, { count: number; result: T_RESULT }>();

    for (const res of results) {
      if (res.bestMove === null || res.bestMove === undefined) continue;

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
