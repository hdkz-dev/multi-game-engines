/**
 * 評価値の種類
 */
export type ScoreType = "cp" | "mate";

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
  seldepth?: number;
  nodes: number;
  nps: number;
  time: number;
  hashfull?: number;
}

/**
 * 読み筋（PV）の情報
 */
export interface PrincipalVariation {
  multipv: number;
  score: EvaluationScore;
  moves: string[]; // UI層では汎用的な文字列配列として保持
}

/**
 * UIが表示すべきエンジン思考の全体状態
 */
export interface EngineSearchState {
  isSearching: boolean;
  position: string; // 局面（FEN等）を保持
  stats: SearchStatistics;
  pvs: PrincipalVariation[];
  currentMove?: string;
  currentMoveNumber?: number;
}

/**
 * 初期状態の定義
 */
export const createInitialState = (position: string): EngineSearchState => ({
  isSearching: false,
  position,
  stats: {
    depth: 0,
    nodes: 0,
    nps: 0,
    time: 0,
  },
  pvs: [],
});
