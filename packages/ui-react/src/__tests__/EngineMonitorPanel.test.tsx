import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
// Import components
import { EngineMonitorPanel } from "../EngineMonitorPanel.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { EngineSearchState, SearchMonitor } from "@multi-game-engines/ui-core";

// Mock the hooks
vi.mock("../useEngineMonitor.js", () => ({
  useEngineMonitor: vi.fn(),
}));

vi.mock("../EngineUIProvider.js", () => ({
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
    topCandidate: "Best Move",
    principalVariations: "PVs",
    start: "START",
    stop: "STOP",
    searching: "Searching...",
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
    engineVersion: (n: string, v: string) => `${n} v${v}`,
    engineBridgeStandard: (y: number) => `Std ${y}`,
  };

  const mockSearchOptions = {};

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useEngineMonitor } = await import("../useEngineMonitor.js");
    const { useEngineUI } = await import("../EngineUIProvider.js");

    vi.mocked(useEngineUI).mockReturnValue({
      strings: mockStrings,
    });

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: {
        status: "ready",
        depth: 0,
        nodes: 0,
        nps: 0,
        time: 0,
        pvs: [],
        evaluationHistory: { entries: [], maxEntries: 50 },
      } as unknown as EngineSearchState,
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

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: {
        status: "ready",
        depth: 0,
        nodes: 0,
        nps: 0,
        time: 0,
        pvs: [],
        evaluationHistory: { entries: [], maxEntries: 50 },
      } as unknown as EngineSearchState,
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

    fireEvent.click(screen.getByText("START"));
    expect(mockSearch).toHaveBeenCalled();
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

    vi.mocked(useEngineMonitor).mockReturnValue({
      state: {
        status: "busy",
        depth: 10,
        nodes: 1000,
        nps: 500,
        time: 2000,
        pvs: [],
        evaluationHistory: { entries: [], maxEntries: 50 },
      } as unknown as EngineSearchState,
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
    expect(screen.getByText("Searching...")).toBeDefined();

    fireEvent.click(screen.getByText("STOP"));
    expect(mockStop).toHaveBeenCalled();
  });
});
