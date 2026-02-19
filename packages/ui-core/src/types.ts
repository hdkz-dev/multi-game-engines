import { PositionString, Move } from "@multi-game-engines/core";
export type { Move, PositionString };

/**
 * UI 正規化ミドルウェアの一意な ID。
 */
export const UI_NORMALIZER_MIDDLEWARE_ID = "ui-normalizer" as const;

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
  /**
   * Internal counter for generating unique IDs (e.g. for search log entries).
   * This ensures SearchStateTransformer remains pure without module-level state.
   */
  readonly _internalCounter: number;
}

/**
 * 初期状態の定義。
 * 2026 Best Practice: 呼び出し側での 'as unknown as T' を排除するため、ジェネリクスをサポート。
 * T がベース型を拡張している場合、不足している必須フィールドを overrides で補う必要があります。
 */
export function createInitialState<
  T extends EngineSearchState = EngineSearchState,
>(position: PositionString, overrides?: Partial<T>): T {
  const base: EngineSearchState = {
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
    _internalCounter: 0,
  };

  // 2026: 型安全性を高めるため、base と overrides を明示的にマージ
  return Object.assign(base, overrides) as T;
}
