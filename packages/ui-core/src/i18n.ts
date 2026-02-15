/**
 * UI コンポーネントで使用される翻訳テキストの定義
 */
export interface EngineUIStrings {
  title: string;
  status: string;
  depth: string;
  nodes: string;
  nps: string;
  time: string;
  topCandidate: string;
  principalVariations: string;
  start: string;
  stop: string;
  searching: string;
  ready: string;
  mateIn: (moves: number) => string;
  advantage: (side: "plus" | "minus", value: number) => string;
}

/**
 * 日本語のデフォルト定義
 */
export const jaStrings: EngineUIStrings = {
  title: "エンジン解析",
  status: "状態",
  depth: "深さ",
  nodes: "局面数",
  nps: "探索速度",
  time: "時間",
  topCandidate: "最善手候補",
  principalVariations: "読み筋一覧",
  start: "開始",
  stop: "停止",
  searching: "解析中",
  ready: "待機中",
  mateIn: (n) => `詰みまで ${n} 手`,
  advantage: (side, v) => `${side === "plus" ? "先手" : "後手"}有利 ${v} 点`,
};

/**
 * 英語のデフォルト定義
 */
export const enStrings: EngineUIStrings = {
  title: "Engine Analysis",
  status: "Status",
  depth: "Depth",
  nodes: "Nodes",
  nps: "NPS",
  time: "Time",
  topCandidate: "Top Candidate",
  principalVariations: "Principal Variations",
  start: "START",
  stop: "STOP",
  searching: "Searching",
  ready: "Ready",
  mateIn: (n) => `Mate in ${n}`,
  advantage: (side, v) => `${side === "plus" ? "Plus" : "Minus"} +${v}`,
};
