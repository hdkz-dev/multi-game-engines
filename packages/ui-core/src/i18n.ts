/**
 * UI コンポーネントで使用される翻訳テキストのインターフェース。
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
  retry: string;
  reloadResources: string;
  validationFailed: string;
  errorTitle: string;
  errorDefaultRemediation: string;
  timeUnitSeconds: string;
  noMove: string;
  engineBridgeStandard: (year: number) => string;
}

/**
 * 2026 Best Practice: any を排除し、入力データの型を定義。
 */
export interface RawLocaleData {
  engine: {
    [key: string]: string;
  };
}

/**
 * @multi-game-engines/i18n から提供される JSON データを
 * EngineUIStrings インターフェースに適合するように変換する。
 */
export function createUIStrings(data: unknown): EngineUIStrings {
  const d = data as RawLocaleData;
  const e = d.engine;

  return {
    title: e.title,
    status: e.status,
    depth: e.depth,
    nodes: e.nodes,
    nps: e.nps,
    time: e.time,
    topCandidate: e.topCandidate,
    principalVariations: e.principalVariations,
    start: e.start,
    stop: e.stop,
    searching: e.searching,
    ready: e.ready,
    mateIn: (n: number) => e.mateIn.replace("{n}", n.toString()),
    advantage: (side: string, v: number) =>
      e.advantage
        .replace("{side}", side === "plus" ? "+" : "-")
        .replace("{v}", (v / 100).toFixed(2)),
    retry: e.retry,
    reloadResources: e.reloadResources,
    validationFailed: e.validationFailed || "Validation failed",
    errorTitle: e.errorTitle,
    errorDefaultRemediation: e.errorDefaultRemediation,
    timeUnitSeconds: e.timeUnitSeconds,
    noMove: e.noMove,
    engineBridgeStandard: (year: number) =>
      e.standard.replace("{year}", year.toString()),
  };
}
