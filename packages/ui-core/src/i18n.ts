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
  score: string;
  visits: string;
  visitsUnit: string;
  mateShort: string;
  evaluationGraph: string;
  pv: string;
  topCandidate: string;
  principalVariations: string;
  searchLog: string;
  start: string;
  stop: string;
  searching: string;
  initializing: string;
  ready: string;
  mateIn: (moves: number) => string;
  advantage: (side: "plus" | "minus" | "neutral", value: number) => string;
  retry: string;
  reloadResources: string;
  validationFailed: string;
  errorTitle: string;
  errorDefaultRemediation: string;
  timeUnitSeconds: string;
  noMove: string;
  pvCount: (n: number) => string;
  logCount: (n: number) => string;
  moveAriaLabel: (move: string) => string;
  engineVersion: (name: string, version: string) => string;
  engineBridgeStandard: (year: number) => string;
  /** ローカライズされた詳細エラーメッセージのマップ */
  errors?: Record<string, string> | undefined;
}

/**
 * 2026 Best Practice: Zod または型ガードにより外部データの構造を保証。
 */
export interface RawLocaleData {
  engine: {
    errors?: Record<string, string>;
    [key: string]: unknown;
  };
}

function isRawLocaleData(data: unknown): data is RawLocaleData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return typeof d.engine === "object" && d.engine !== null;
}

/**
 * @multi-game-engines/i18n から提供される JSON データを
 * EngineUIStrings インターフェースに適合するように変換する。
 */
export function createUIStrings(data: unknown): EngineUIStrings {
  if (!isRawLocaleData(data)) {
    throw new Error(
      "Invalid locale data structure provided to createUIStrings",
    );
  }

  const e = data.engine;
  const t = (key: string, fallback: string) =>
    (e[key] as string | undefined) || fallback;

  return {
    title: t("title", "Engine"),
    status: t("status", "Status"),
    depth: t("depth", "Depth"),
    nodes: t("nodes", "Nodes"),
    nps: t("nps", "NPS"),
    time: t("time", "Time"),
    score: t("score", "Score"),
    visits: t("visits", "Visits"),
    visitsUnit: t("visitsUnit", "v"),
    mateShort: t("mateShort", "M"),
    evaluationGraph: t("evaluationGraph", "Evaluation trend graph"),
    pv: t("pv", "PV"),
    topCandidate: t("topCandidate", "Best Move"),
    principalVariations: t("principalVariations", "PVs"),
    searchLog: t("searchLog", "Log"),
    start: t("start", "START"),
    stop: t("stop", "STOP"),
    searching: t("searching", "Searching..."),
    initializing: t("initializing", "Initializing..."),
    ready: t("ready", "Ready"),
    mateIn: (n: number) =>
      t("mateIn", "Mate in {n}").replace("{n}", n.toString()),
    advantage: (side: "plus" | "minus" | "neutral", v: number) => {
      if (side === "neutral") return t("even", "Even");
      const sign = side === "plus" ? "+" : "-";
      return t("advantage", "{sign}{v}")
        .replace("{sign}", sign)
        .replace("{v}", (v / 100).toFixed(2));
    },
    retry: t("retry", "Retry"),
    reloadResources: t("reloadResources", "Reload"),
    validationFailed: t("validationFailed", "Validation failed"),
    errorTitle: t("errorTitle", "Error"),
    errorDefaultRemediation: t("errorDefaultRemediation", "Please try again."),
    timeUnitSeconds: t("timeUnitSeconds", "s"),
    noMove: t("noMove", "---"),
    pvCount: (n: number) => t("pvCount", "N={n}").replace("{n}", n.toString()),
    logCount: (n: number) =>
      t("logCount", "{n} entries").replace("{n}", n.toString()),
    moveAriaLabel: (move: string) =>
      t("moveAriaLabel", "Move {move}").replace("{move}", move),
    engineVersion: (name: string, version: string) =>
      t("engineVersion", "{name} v{version}")
        .replace("{name}", name)
        .replace("{version}", version),
    engineBridgeStandard: (year: number) =>
      t("engineBridgeStandard", "{year} Engine Bridge Standard").replace(
        "{year}",
        year.toString(),
      ),
    errors: e.errors,
  };
}
