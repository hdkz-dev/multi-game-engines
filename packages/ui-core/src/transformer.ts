import {
  EngineSearchState,
  PrincipalVariation,
  SearchLogEntry,
} from "./types.js";
import { createPositionString } from "@multi-game-engines/core";
import { SearchInfoSchema, ExtendedSearchInfo } from "./schema.js";

let logCounter = 0;

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
    const now = Date.now();
    const multipv = validatedInfo.multipv ?? (validatedInfo.pv ? 1 : undefined);
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
    if (validatedInfo.pv && multipv !== undefined) {
      // 2026 Best Practice: Zod で変換済みのブランド型 Move[] をそのまま使用
      const validatedMoves = validatedInfo.pv;

      const pvIndex = nextPvs.findIndex((p) => p.multipv === multipv);

      const newPV: PrincipalVariation = {
        multipv,
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
      if (multipv === 1) {
        const nextEntries = [
          ...state.evaluationHistory.entries,
          { score: newPV.score, timestamp: now },
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

      // 探索ログの更新ロジック (Smart Log Entry)
      const newScore = newPV.score;
      let lastEntryIndex = -1;
      for (let i = state.searchLog.length - 1; i >= 0; i--) {
        if (state.searchLog[i]?.multipv === multipv) {
          lastEntryIndex = i;
          break;
        }
      }
      const lastEntry =
        lastEntryIndex >= 0 ? state.searchLog[lastEntryIndex] : null;

      const isSameProgress =
        lastEntry &&
        lastEntry.depth === (validatedInfo.depth ?? state.stats.depth) &&
        lastEntry.score.type === newScore.type &&
        lastEntry.score.value === newScore.value &&
        lastEntry.pv.join(",") === validatedMoves.join(",");

      const logEntry: SearchLogEntry = {
        id:
          lastEntry && isSameProgress
            ? lastEntry.id
            : `${now}-${logCounter++}-${multipv}`,
        depth: validatedInfo.depth ?? state.stats.depth,
        seldepth: validatedInfo.seldepth ?? state.stats.seldepth,
        score: newScore,
        nodes: validatedInfo.nodes ?? state.stats.nodes,
        nps: validatedInfo.nps ?? state.stats.nps,
        time: validatedInfo.time ?? state.stats.time,
        visits: validatedInfo.visits ?? state.stats.visits,
        multipv,
        pv: validatedMoves,
        timestamp: now,
      };

      let nextLog: SearchLogEntry[];
      if (lastEntry && isSameProgress) {
        // 同じ進捗なら最後の該当エントリを更新
        nextLog = [...state.searchLog];
        nextLog[lastEntryIndex] = logEntry;
      } else {
        // 進捗があれば新規追加
        nextLog = [...state.searchLog, logEntry];
      }

      // 最大 200 件に制限
      if (nextLog.length > 200) {
        nextLog.shift();
      }
      nextState.searchLog = nextLog;
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
      searchLog: [],
    };
  },
};
