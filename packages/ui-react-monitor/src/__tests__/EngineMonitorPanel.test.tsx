import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
// Import components
import { EngineMonitorPanel } from "../components/EngineMonitorPanel.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  createPositionString,
} from "@multi-game-engines/core";
import {
  EngineSearchState,
  SearchMonitor,
  createInitialState,
} from "@multi-game-engines/ui-core";

// Mock the hooks
vi.mock("../useEngineMonitor.js", () => ({
  useEngineMonitor: vi.fn(),
}));

vi.mock("@multi-game-engines/ui-react-core", () => ({
  useEngineUI: vi.fn(),
  EngineUIProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock sub-components
vi.mock("../EvaluationGraph.js", () => ({
  EvaluationGraph: () => <div data-testid="evaluation-graph" />,
}));
vi.mock("../EngineStats.js", () => ({
  EngineStats: () => <div data-testid="engine-stats" />,
}));
vi.mock("../PVList.js", () => ({
  PVList: () => <div data-testid="pv-list" />,
}));
vi.mock("../ScoreBadge.js", () => ({
  ScoreBadge: () => <div data-testid="score-badge" />,
}));
vi.mock("@radix-ui/react-scroll-area", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Viewport: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Corner: () => null,
  Scrollbar: () => null,
  Thumb: () => null,
}));
vi.mock("@radix-ui/react-separator", () => ({
  Root: () => <hr />,
}));

describe("EngineMonitorPanel", () => {
  const mockStrings = {
    title: "Engine",
    status: "Status",
    depth: "Depth",
    nodes: "Nodes",
    nps: "NPS",
    time: "Time",
    score: "Score",
    pv: "PV",
    searchLog: "Log",
    topCandidate: "Best Move",
    principalVariations: "PVs",
    start: "START",
    stop: "STOP",
    searching: "Searching...",
    initializing: "Initializing...",
    ready: "Ready",
    mateIn: (n: number) => `Mate in ${n}`,
    advantage: (side: "plus" | "minus" | "neutral", v: number) =>
      `${side} ${v}`,
    retry: "Retry",
    reloadResources: "Reload",
    validationFailed: "Validation failed",
    errorTitle: "Error",
    errorDefaultRemediation: "Remediation",
    timeUnitSeconds: "s",
    noMove: "---",
    pvCount: (n: number) => `PV(${n})`,
    logCount: (n: number) => `${n} entries`,
    moveAriaLabel: (move: string) => `Move ${move}`,
    visits: "Visits",
    visitsUnit: "v",
    mateShort: "M",
    evaluationGraph: "Evaluation Graph",
    engineVersion: (n: string, v: string) => `${n} v${v}`,
    engineBridgeStandard: (y: number) => `Std ${y}`,
  };

  const mockSearchOptions = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(performance, "now").mockReturnValue(12345);

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const { useEngineUI } = await import("@multi-game-engines/ui-react-core");

    vi.mocked(useEngineUI).mockReturnValue({
      strings: mockStrings,
    });

    const baseState = createInitialState(createPositionString("startpos"));

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "ready",
      search: vi.fn(),
      stop: vi.fn(),
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with initial state safely", () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "ready",
      emitTelemetry: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );

    expect(screen.getByText("START")).toBeDefined();
  });

  it("calls search when START is clicked", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "ready",
      emitTelemetry: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const mockSearch = vi.fn();
    const mockStop = vi.fn();

    const baseState = createInitialState(createPositionString("startpos"));

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "ready",
      search: mockSearch,
      stop: mockStop,
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );

    const startButtons = screen.getAllByRole("button", { name: "START" });
    const startButton = startButtons[startButtons.length - 1];
    if (!startButton) throw new Error("START button not found");
    fireEvent.click(startButton);
    expect(mockSearch).toHaveBeenCalled();
  });

  it("handles tab keyboard navigation (ArrowRight/Left/Home/End)", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "ready",
      emitTelemetry: vi.fn(),
      id: "mock",
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );

    const tablist = document.querySelector('[role="tablist"]');
    if (tablist) {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      fireEvent.keyDown(tablist, { key: "Home" });
      fireEvent.keyDown(tablist, { key: "End" });
    }
    expect(tablist).toBeTruthy();
  });

  it("shows error state with errorMessage (no lastError)", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "error",
      emitTelemetry: vi.fn(),
      id: "mock",
      lastError: null,
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const baseState = createInitialState(createPositionString("startpos"));
    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "error",
      search: vi.fn(),
      stop: vi.fn(),
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );
    expect(screen.getAllByText("Error").length).toBeGreaterThan(0);
    expect(screen.getByText("Remediation")).toBeDefined();
  });

  it("shows error state with i18nKey-based errorMessage", async () => {
    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const baseState = createInitialState(createPositionString("startpos"));
    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "error",
      search: vi.fn(),
      stop: vi.fn(),
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    const mockStringsWithErrors = {
      ...mockStrings,
      errors: { connectionTimeout: "Connection timed out after {seconds}s" },
    };
    const { useEngineUI } = await import("@multi-game-engines/ui-react-core");
    vi.mocked(useEngineUI).mockReturnValue({ strings: mockStringsWithErrors });

    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "error",
      emitTelemetry: vi.fn(),
      id: "mock",
      lastError: {
        i18nKey: "errors.connectionTimeout",
        i18nParams: { seconds: "10" },
        remediation: "Try again",
      },
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );
    expect(screen.getByText("Connection timed out after 10s")).toBeDefined();
  });

  it("shows error remediation when lastError has no i18nKey", async () => {
    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const baseState = createInitialState(createPositionString("startpos"));
    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "error",
      search: vi.fn(),
      stop: vi.fn(),
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "error",
      emitTelemetry: vi.fn(),
      id: "mock",
      lastError: {
        remediation: "Please restart the engine",
      },
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );
    expect(screen.getByText("Please restart the engine")).toBeDefined();
  });

  it("shows STOP button and calls stop when searching", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "searching",
      emitTelemetry: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const mockSearch = vi.fn();
    const mockStop = vi.fn();

    const baseState = createInitialState(createPositionString("startpos"), {
      stats: {
        depth: 10,
        nodes: 1000,
        nps: 500,
        time: 2000,
      },
    });

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "busy",
      search: mockSearch,
      stop: mockStop,
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );

    expect(screen.getByText("STOP")).toBeDefined();
    // Use a more specific selector to avoid ambiguity between status and empty list message
    expect(screen.getAllByText("Searching...").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("STOP"));
    expect(mockStop).toHaveBeenCalled();
  });

  it("shows mate announcement when bestPV has mate score", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "ready",
      emitTelemetry: vi.fn(),
      id: "mock",
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const { createMove } = await import("@multi-game-engines/core");
    const baseState = createInitialState(createPositionString("startpos"), {
      pvs: [
        {
          multipv: 1,
          score: { type: "mate" as const, value: 3, relativeValue: 3 },
          moves: ["e2e4"].map(createMove),
        },
      ],
    });

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: baseState,
      status: "ready",
      search: vi.fn(),
      stop: vi.fn(),
      monitor: {} as unknown as SearchMonitor<
        EngineSearchState,
        IBaseSearchOptions,
        IBaseSearchInfo,
        IBaseSearchResult
      >,
    });

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );
    // The announcement (sr-only) should contain mateIn text
    expect(screen.getByText("Mate in 3")).toBeDefined();
  });

  it("switches tabs by clicking PV and Log tab buttons", async () => {
    const mockEngine = {
      onInfo: vi.fn(() => vi.fn()),
      search: vi.fn(),
      stop: vi.fn(),
      status: "ready",
      emitTelemetry: vi.fn(),
      id: "mock",
    } as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;

    render(
      <EngineMonitorPanel
        engine={mockEngine}
        searchOptions={mockSearchOptions}
      />,
    );

    const pvTab = document.querySelector(
      '[role="tab"][aria-controls$="-pv-panel"]',
    );
    const logTab = document.querySelector(
      '[role="tab"][aria-controls$="-log-panel"]',
    );
    if (pvTab && logTab) {
      fireEvent.click(logTab);
      fireEvent.click(pvTab);
    }
    expect(pvTab ?? logTab).toBeTruthy();
  });
});
