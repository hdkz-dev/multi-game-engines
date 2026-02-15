import { EngineSearchState, PrincipalVariation } from "./types.js";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";
import { Move } from "@multi-game-engines/core";

/**
 * 思考状態の変換ロジック
 */
export class SearchStateTransformer {
  /**
   * エンジンからの Info イベントをステートにマージする。
   *
   * 2026 Best Practice:
   * Zod スキーマによりランタイムでの構造的整合性を保証。
   */
  static mergeInfo<T_INFO extends ExtendedSearchInfo>(
    currentState: EngineSearchState,
    info: T_INFO,
  ): EngineSearchState {
    // 境界で検証を実行 (不正なデータはエラーログと共に無視、または安全に処理)
    const result = SearchInfoSchema.safeParse(info);
    if (!result.success) {
      console.warn(
        "[SearchStateTransformer] Validation failed for info:",
        result.error,
      );
      return currentState;
    }
    const validatedInfo = result.data;

    const nextState: EngineSearchState = {
      ...currentState,
      stats: { ...currentState.stats },
      pvs: [...currentState.pvs],
    };

    // 統計情報の更新
    if (validatedInfo.depth !== undefined)
      nextState.stats.depth = validatedInfo.depth;
    if (validatedInfo.seldepth !== undefined)
      nextState.stats.seldepth = validatedInfo.seldepth;
    if (validatedInfo.nodes !== undefined)
      nextState.stats.nodes = validatedInfo.nodes;
    if (validatedInfo.nps !== undefined)
      nextState.stats.nps = validatedInfo.nps;
    if (validatedInfo.time !== undefined)
      nextState.stats.time = validatedInfo.time;
    if (validatedInfo.hashfull !== undefined)
      nextState.stats.hashfull = validatedInfo.hashfull;

    // PVの更新 (MultiPV対応)
    if (validatedInfo.pv && validatedInfo.multipv !== undefined) {
      const pvIndex = nextState.pvs.findIndex(
        (p) => p.multipv === validatedInfo.multipv,
      );
      const newPV: PrincipalVariation = {
        multipv: validatedInfo.multipv,
        moves: validatedInfo.pv as Move[],
        score: {
          type: validatedInfo.score?.mate !== undefined ? "mate" : "cp",
          value: validatedInfo.score?.mate ?? validatedInfo.score?.cp ?? 0,
          relativeValue:
            validatedInfo.score?.mate ?? validatedInfo.score?.cp ?? 0,
        },
      };

      if (pvIndex > -1) {
        nextState.pvs[pvIndex] = newPV;
      } else {
        nextState.pvs.push(newPV);
      }

      nextState.pvs.sort((a, b) => a.multipv - b.multipv);
    }

    return nextState;
  }
}
