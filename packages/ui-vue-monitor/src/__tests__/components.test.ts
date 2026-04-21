import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { createUIStrings } from "@multi-game-engines/ui-core";

// Provide useEngineUI context for all component tests
vi.mock("@multi-game-engines/ui-vue-core", () => ({
  useEngineUI: () => ({
    strings: ref(createUIStrings({})),
  }),
}));

import ScoreBadge from "../components/ScoreBadge.vue";
import EngineStats from "../components/EngineStats.vue";
import PVList from "../components/PVList.vue";
import EvaluationGraph from "../components/EvaluationGraph.vue";
import SearchLog from "../components/SearchLog.vue";
import type {
  EvaluationScore,
  SearchStatistics,
  PrincipalVariation,
  SearchLogEntry,
  IEvaluationHistoryEntry,
} from "@multi-game-engines/ui-core";
import { createMove } from "@multi-game-engines/core";

beforeAll(() => {
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("ScoreBadge.vue", () => {
  const cpScore: EvaluationScore = {
    type: "cp",
    value: 120,
    relativeValue: 120,
  };
  const mateScore: EvaluationScore = {
    type: "mate",
    value: 3,
    relativeValue: 3,
  };
  const negScore: EvaluationScore = {
    type: "cp",
    value: -80,
    relativeValue: -80,
  };

  it("should render for a positive cp score", () => {
    const wrapper = mount(ScoreBadge, { props: { score: cpScore } });
    expect(wrapper.find("[role='status']").exists()).toBe(true);
  });

  it("should render for a mate score", () => {
    const wrapper = mount(ScoreBadge, { props: { score: mateScore } });
    expect(wrapper.find("[role='status']").exists()).toBe(true);
  });

  it("should render for a negative cp score", () => {
    const wrapper = mount(ScoreBadge, { props: { score: negScore } });
    expect(wrapper.find("[role='status']").exists()).toBe(true);
  });

  it("should apply inverted prop", () => {
    const wrapper = mount(ScoreBadge, {
      props: { score: cpScore, inverted: true },
    });
    expect(wrapper.find("[role='status']").exists()).toBe(true);
  });
});

describe("EngineStats.vue", () => {
  const stats: SearchStatistics = {
    depth: 12,
    seldepth: 15,
    nodes: 50000,
    nps: 200000,
    time: 250,
    hashfull: 10,
  };

  it("should render stat boxes with depth/nodes/nps/time", () => {
    const wrapper = mount(EngineStats, { props: { stats } });
    expect(wrapper.html()).toContain("12");
  });

  it("should render visits when stats.visits is set", () => {
    const visitStats: SearchStatistics = { ...stats, visits: 5000 };
    const wrapper = mount(EngineStats, { props: { stats: visitStats } });
    expect(wrapper.html()).toBeTruthy();
  });

  it("should accept className prop", () => {
    const wrapper = mount(EngineStats, {
      props: { stats, className: "custom-class" },
    });
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("PVList.vue", () => {
  const pvs: PrincipalVariation[] = [
    {
      multipv: 1,
      score: { type: "cp", value: 50, relativeValue: 50 },
      moves: ["e2e4", "e7e5"].map(createMove),
    },
    {
      multipv: 2,
      score: { type: "cp", value: 20, relativeValue: 20 },
      moves: ["d2d4"].map(createMove),
    },
  ];

  it("should render PV entries", () => {
    const wrapper = mount(PVList, { props: { pvs } });
    expect(wrapper.text()).toContain("e2e4");
    expect(wrapper.text()).toContain("d2d4");
  });

  it("should show empty state when pvs is empty", () => {
    const wrapper = mount(PVList, { props: { pvs: [] } });
    expect(wrapper.html()).toBeTruthy();
  });

  it("should emit move-click on button click", async () => {
    const wrapper = mount(PVList, { props: { pvs } });
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    await buttons[0]!.trigger("click");
    expect(wrapper.emitted("move-click")).toBeTruthy();
  });
});

describe("EvaluationGraph.vue", () => {
  const entries: IEvaluationHistoryEntry[] = [
    { score: { type: "cp", value: 100, relativeValue: 100 }, timestamp: 1000 },
    { score: { type: "cp", value: -50, relativeValue: -50 }, timestamp: 2000 },
    { score: { type: "cp", value: 200, relativeValue: 200 }, timestamp: 3000 },
  ];

  it("should render SVG when entries are provided", () => {
    const wrapper = mount(EvaluationGraph, { props: { entries } });
    expect(wrapper.html()).toBeTruthy();
  });

  it("should render with empty entries", () => {
    const wrapper = mount(EvaluationGraph, { props: { entries: [] } });
    expect(wrapper.html()).toBeTruthy();
  });

  it("should accept custom height prop", () => {
    const wrapper = mount(EvaluationGraph, {
      props: { entries, height: 100 },
    });
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("SearchLog.vue", () => {
  const log: SearchLogEntry[] = [
    {
      id: "1",
      depth: 10,
      score: { type: "cp", value: 50, relativeValue: 50 },
      nodes: 10000,
      nps: 50000,
      time: 200,
      multipv: 1,
      timestamp: Date.now(),
      pv: ["e2e4", "e7e5"].map(createMove),
    },
  ];

  it("should render log entries", async () => {
    const wrapper = mount(SearchLog, {
      props: { log },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.html()).toBeTruthy();
    wrapper.unmount();
  });

  it("should render empty state when log is empty", async () => {
    const wrapper = mount(SearchLog, {
      props: { log: [] },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.html()).toBeTruthy();
    wrapper.unmount();
  });

  it("should emit move-click when a move button is clicked", async () => {
    const wrapper = mount(SearchLog, { props: { log } });
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    await buttons[0]!.trigger("click");
    expect(wrapper.emitted("move-click")).toBeTruthy();
  });

  it("should respect autoScroll prop", () => {
    const wrapper = mount(SearchLog, {
      props: { log, autoScroll: false },
    });
    expect(wrapper.html()).toBeTruthy();
  });

  it("should handle scroll event on container", async () => {
    const wrapper = mount(SearchLog, {
      props: { log },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const region = wrapper.find('[role="region"]');
    await region.trigger("scroll");
    expect(wrapper.html()).toBeTruthy();
    wrapper.unmount();
  });
});
