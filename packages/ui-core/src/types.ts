import { FEN, Move } from "@multi-game-engines/core";
export type { Move };

/**
 * 局面表記の型（FEN またはアダプター定義の局面文字列）
 */
export type PositionString =
  | FEN
  | (string & { readonly __brand: "PositionString" });

/**
 * 評価値の種類
 */
export type ScoreType = "cp" | "mate" | "points" | "winrate";

/**
 * 正規化された評価情報
 */
export interface EvaluationScore {
  type: ScoreType;
  value: number;
  /** 先手/後手から見た相対値ではなく、常にその局面のサイドから見た値 */
  relativeValue: number;
}

/**
 * 探索の統計情報
 */
export interface SearchStatistics {
  depth: number;
  seldepth?: number | undefined;
  nodes: number;
  nps: number;
  time: number;
  visits?: number | undefined;
  hashfull?: number | undefined;
}

/**
 * 読み筋（PV）の情報
 */
export interface PrincipalVariation {
  multipv: number;
  score: EvaluationScore;
  moves: Move[];
}

/**
 * 探索ログのエントリ（一行分）。
 */
export interface SearchLogEntry {
  id: string;
  depth: number;
  seldepth?: number | undefined;
  score: EvaluationScore;
  nodes: number;
  nps: number;
  time: number;
  visits?: number | undefined;
  multipv: number;
  pv: Move[];
  timestamp: number;
}

/**
 * 評価値の履歴エントリ。
 */
export interface IEvaluationHistoryEntry {
  score: EvaluationScore;
  timestamp: number;
}

/**
 * 評価値の履歴。
 */
export interface IEvaluationHistory {
  entries: IEvaluationHistoryEntry[];
  maxEntries: number;
}

export interface EngineSearchState {
  isSearching: boolean;
  position: PositionString;
  stats: SearchStatistics;
  pvs: PrincipalVariation[];
  evaluationHistory: IEvaluationHistory;
  searchLog: SearchLogEntry[];
  currentMove?: Move | undefined;
  currentMoveNumber?: number | undefined;
}

/**
 * 初期状態の定義
 */
export function createInitialState<
  T extends EngineSearchState = EngineSearchState,
>(position: PositionString): T {
  return {
    isSearching: false,
    position,
    stats: {
      depth: 0,
      nodes: 0,
      nps: 0,
      time: 0,
    },
    pvs: [],
    evaluationHistory: {
      entries: [],
      maxEntries: 50,
    },
    searchLog: [],
  } as unknown as T;
}
