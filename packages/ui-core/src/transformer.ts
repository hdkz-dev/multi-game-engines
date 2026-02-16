import { EngineSearchState, PrincipalVariation } from "./types.js";
import { createMove, createPositionString } from "@multi-game-engines/core";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";

/**
 * エンジンからの生の情報を UI 向けの状態に変換・マージする。
 */
export const SearchStateTransformer = {
  /**
   * info イベントのデータを現在の状態にマージする。
   * Zod によるバリデーションを挟むことで、不正なデータによる UI のクラッシュを防ぐ。
   */
  mergeInfo(
    state: EngineSearchState,
    info: ExtendedSearchInfo,
  ): EngineSearchState {
    // 1. Zod による実行時検証 (契約駆動)
    const validation = SearchInfoSchema.safeParse(info);
    if (!validation.success) {
      console.warn("[UICore] Invalid info ignored:", validation.error);
      return state;
    }

    const validatedInfo = validation.data;
    const nextPvs = [...state.pvs];
    const nextState: EngineSearchState = {
      ...state,
      pvs: nextPvs,
      stats: {
        ...state.stats,
        depth: validatedInfo.depth ?? state.stats.depth,
        seldepth: validatedInfo.seldepth ?? state.stats.seldepth,
        nodes: validatedInfo.nodes ?? state.stats.nodes,
        nps: validatedInfo.nps ?? state.stats.nps,
        time: validatedInfo.time ?? state.stats.time,
        visits: validatedInfo.visits ?? state.stats.visits,
        hashfull: validatedInfo.hashfull ?? state.stats.hashfull,
      },
    };

    // PVの更新 (MultiPV対応)
    if (validatedInfo.pv && validatedInfo.multipv !== undefined) {
      // 2026 Best Practice: 文字列配列をブランド型 Move[] へバリデーション付きで変換
      const validatedMoves = validatedInfo.pv.map((m: string) => createMove(m));

      const pvIndex = nextPvs.findIndex(
        (p) => p.multipv === validatedInfo.multipv,
      );

      const newPV: PrincipalVariation = {
        multipv: validatedInfo.multipv,
        moves: validatedMoves,
        score: (() => {
          if (validatedInfo.score?.mate !== undefined) {
            return {
              type: "mate",
              value: validatedInfo.score.mate,
              relativeValue: validatedInfo.score.mate,
            };
          }
          if (validatedInfo.score?.winrate !== undefined) {
            return {
              type: "winrate",
              value: validatedInfo.score.winrate,
              relativeValue: validatedInfo.score.winrate,
            };
          }
          if (validatedInfo.score?.points !== undefined) {
            return {
              type: "points",
              value: validatedInfo.score.points,
              relativeValue: validatedInfo.score.points,
            };
          }
          return {
            type: "cp",
            value: validatedInfo.score?.cp ?? 0,
            relativeValue: validatedInfo.score?.cp ?? 0,
          };
        })(),
      };

      if (pvIndex >= 0) {
        nextPvs[pvIndex] = newPV;
      } else {
        nextPvs.push(newPV);
      }

      // 履歴の更新 (MultiPV=1 の場合のみ)
      if (validatedInfo.multipv === 1) {
        const nextEntries = [
          ...state.evaluationHistory.entries,
          { score: newPV.score, timestamp: Date.now() },
        ];
        if (nextEntries.length > state.evaluationHistory.maxEntries) {
          nextEntries.shift();
        }
        nextState.evaluationHistory = {
          ...state.evaluationHistory,
          entries: nextEntries,
        };
      }

      // MultiPV 順にソート
      nextPvs.sort((a, b) => a.multipv - b.multipv);
    }

    return nextState;
  },

  /**
   * 初期状態を生成する。
   */
  createInitialState(position: string): EngineSearchState {
    return {
      isSearching: false,
      position: createPositionString(position),
      pvs: [],
      stats: {
        depth: 0,
        nodes: 0,
        nps: 0,
        time: 0,
      },
      evaluationHistory: {
        entries: [],
        maxEntries: 50,
      },
    };
  },
};
