import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import "../components/score-badge.js";
import "../components/engine-stats.js";
import "../components/pv-list.js";
import "../components/evaluation-graph.js";
import "../components/search-log.js";
import type { ScoreBadgeElement } from "../components/score-badge.js";
import type { EngineStatsElement } from "../components/engine-stats.js";
import type { PVListElement } from "../components/pv-list.js";
import type { EvaluationGraphElement } from "../components/evaluation-graph.js";
import type { SearchLogElement } from "../components/search-log.js";
import type {
  SearchStatistics,
  PrincipalVariation,
  EvaluationScore,
  IEvaluationHistoryEntry,
  SearchLogEntry,
} from "@multi-game-engines/ui-core";
import { createMove } from "@multi-game-engines/core";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("ScoreBadgeElement (<score-badge>)", () => {
  it("should be registered as a custom element", () => {
    expect(customElements.get("score-badge")).toBeDefined();
  });

  it("should render a positive cp score", async () => {
    const el = document.createElement("score-badge") as ScoreBadgeElement;
    const score: EvaluationScore = {
      type: "cp",
      value: 100,
      relativeValue: 100,
    };
    el.score = score;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBeTruthy();
  });

  it("should render a mate score", async () => {
    const el = document.createElement("score-badge") as ScoreBadgeElement;
    const score: EvaluationScore = { type: "mate", value: 3, relativeValue: 3 };
    el.score = score;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBeTruthy();
  });

  it("should render a negative cp score", async () => {
    const el = document.createElement("score-badge") as ScoreBadgeElement;
    const score: EvaluationScore = {
      type: "cp",
      value: -200,
      relativeValue: -200,
    };
    el.score = score;
    el.locale = "ja";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBeTruthy();
  });

  it("should re-render when score property changes", async () => {
    const el = document.createElement("score-badge") as ScoreBadgeElement;
    el.score = { type: "cp", value: 50, relativeValue: 50 };
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;

    el.score = { type: "cp", value: -50, relativeValue: -50 };
    await el.updateComplete;
    expect(el.shadowRoot?.textContent?.trim()).toBeTruthy();
  });
});

describe("EngineStatsElement (<engine-stats>)", () => {
  it("should be registered as a custom element", () => {
    expect(customElements.get("engine-stats")).toBeDefined();
  });

  it("should render empty when no stats provided", async () => {
    const el = document.createElement("engine-stats") as EngineStatsElement;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should render stats data when provided", async () => {
    const el = document.createElement("engine-stats") as EngineStatsElement;
    const stats: SearchStatistics = {
      depth: 12,
      seldepth: 15,
      nodes: 50000,
      nps: 200000,
      time: 250,
      hashfull: 10,
    };
    el.stats = stats;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("12");
  });

  it("should render visits when stats.visits is set", async () => {
    const el = document.createElement("engine-stats") as EngineStatsElement;
    const stats: SearchStatistics = {
      depth: 5,
      nodes: 1000,
      nps: 5000,
      time: 100,
      visits: 500,
    };
    el.stats = stats;
    el.locale = "ja";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toBeTruthy();
  });
});

describe("PVListElement (<pv-list>)", () => {
  it("should be registered as a custom element", () => {
    expect(customElements.get("pv-list")).toBeDefined();
  });

  it("should render PV entries", async () => {
    const el = document.createElement("pv-list") as PVListElement;
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 50, relativeValue: 50 },
        moves: ["e2e4", "e7e5"].map(createMove),
      },
    ];
    el.pvs = pvs;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("e2e4");
  });

  it("should render empty state when pvs is empty", async () => {
    const el = document.createElement("pv-list") as PVListElement;
    el.pvs = [];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should render multiple PV lines", async () => {
    const el = document.createElement("pv-list") as PVListElement;
    const pvs: PrincipalVariation[] = [
      {
        multipv: 1,
        score: { type: "cp", value: 50, relativeValue: 50 },
        moves: ["e2e4"].map(createMove),
      },
      {
        multipv: 2,
        score: { type: "cp", value: 20, relativeValue: 20 },
        moves: ["d2d4"].map(createMove),
      },
    ];
    el.pvs = pvs;
    el.locale = "ja";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("e2e4");
    expect(el.shadowRoot?.textContent).toContain("d2d4");
  });
});

describe("EvaluationGraphElement (<evaluation-graph>)", () => {
  it("should be registered as a custom element", () => {
    expect(customElements.get("evaluation-graph")).toBeDefined();
  });

  it("should render with entries", async () => {
    const el = document.createElement(
      "evaluation-graph",
    ) as EvaluationGraphElement;
    const entries: IEvaluationHistoryEntry[] = [
      {
        score: { type: "cp", value: 100, relativeValue: 100 },
        timestamp: 1000,
      },
      {
        score: { type: "cp", value: -50, relativeValue: -50 },
        timestamp: 2000,
      },
      {
        score: { type: "cp", value: 200, relativeValue: 200 },
        timestamp: 3000,
      },
    ];
    el.entries = entries;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should render with empty entries", async () => {
    const el = document.createElement(
      "evaluation-graph",
    ) as EvaluationGraphElement;
    el.entries = [];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should update when entries change", async () => {
    const el = document.createElement(
      "evaluation-graph",
    ) as EvaluationGraphElement;
    el.entries = [
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 1000 },
    ];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;

    el.entries = [
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 1000 },
      {
        score: { type: "cp", value: 100, relativeValue: 100 },
        timestamp: 2000,
      },
    ];
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });
});

describe("SearchLogElement (<search-log>)", () => {
  it("should be registered as a custom element", () => {
    expect(customElements.get("search-log")).toBeDefined();
  });

  it("should render log entries", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    const log: SearchLogEntry[] = [
      {
        id: "1",
        depth: 10,
        score: { type: "cp", value: 50, relativeValue: 50 },
        nodes: 10000,
        nps: 50000,
        time: 200,
        multipv: 1,
        timestamp: 1000,
        pv: ["e2e4", "e7e5"].map(createMove),
      },
    ];
    el.log = log;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("10");
  });

  it("should render empty state when log is empty", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    el.log = [];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should re-render when new log entries arrive", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    el.log = [];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;

    el.log = [
      {
        id: "2",
        depth: 8,
        score: { type: "cp", value: -30, relativeValue: -30 },
        nodes: 5000,
        nps: 25000,
        time: 100,
        multipv: 1,
        timestamp: 2000,
        pv: ["d2d4"].map(createMove),
      },
    ];
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("8");
  });

  it("should render with autoScroll disabled", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    el.log = [];
    el.autoScroll = false;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should update _isNearBottom on scroll event", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    el.log = [];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;

    el.dispatchEvent(new Event("scroll"));
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should dispatch move-click event when a PV move button is clicked", async () => {
    const el = document.createElement("search-log") as SearchLogElement;
    el.log = [
      {
        id: "1",
        depth: 5,
        score: { type: "cp", value: 30, relativeValue: 30 },
        nodes: 1000,
        nps: 5000,
        time: 50,
        multipv: 1,
        timestamp: 100,
        pv: ["e2e4", "e7e5"].map(createMove),
      },
    ];
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;

    const moveEvents: CustomEvent[] = [];
    el.addEventListener("move-click", (e) => moveEvents.push(e as CustomEvent));

    const btn = el.shadowRoot?.querySelector(
      "button",
    ) as HTMLButtonElement | null;
    btn?.click();
    await el.updateComplete;

    expect(moveEvents).toHaveLength(1);
    expect(moveEvents[0]?.detail.move).toBe("e2e4");
  });
});
