import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { SearchLogEntry } from "@multi-game-engines/ui-core";
import { createMove } from "@multi-game-engines/core";
import { SearchLog } from "../components/SearchLog.js";

// Match the pattern used by PVList.test.tsx
vi.mock("@multi-game-engines/ui-react-core", () => ({
  useEngineUI: () => ({
    strings: {
      searchLog: "Search Log",
      depth: "D",
      score: "Score",
      time: "Time",
      nodes: "Nodes",
      nps: "NPS",
      pv: "PV",
      searching: "Searching...",
      visits: "Visits",
      visitsUnit: "v",
      timeUnitSeconds: "s",
      mateShort: "M",
      moveAriaLabel: (m: string) => `Move ${m}`,
      mateIn: (n: number) => `Mate in ${n}`,
      advantage: (side: string, v: number) => `${side} ${v}`,
    },
  }),
}));

const makeEntry = (
  overrides: Partial<SearchLogEntry> = {},
): SearchLogEntry => ({
  id: "1",
  depth: 10,
  score: { type: "cp", value: 50, relativeValue: 50 },
  nodes: 10000,
  nps: 50000,
  time: 200,
  multipv: 1,
  timestamp: 1000,
  pv: ["e2e4", "e7e5"].map(createMove),
  ...overrides,
});

describe("SearchLog", () => {
  afterEach(cleanup);

  it("should render empty state with Searching... message", () => {
    render(<SearchLog log={[]} />);
    expect(screen.getByText("Searching...")).toBeDefined();
  });

  it("should render log entries with depth", () => {
    render(<SearchLog log={[makeEntry()]} />);
    expect(screen.getByText("10")).toBeDefined();
  });

  it("should render seldepth when provided", () => {
    render(<SearchLog log={[makeEntry({ depth: 12, seldepth: 15 })]} />);
    expect(screen.getByText(/\/15/)).toBeDefined();
  });

  it("should render visits when provided", () => {
    render(<SearchLog log={[makeEntry({ visits: 500, pv: [] })]} />);
    expect(screen.getByText(/500/)).toBeDefined();
  });

  it("should call onMoveClick when a PV move button is clicked", () => {
    const onMoveClick = vi.fn();
    render(<SearchLog log={[makeEntry()]} onMoveClick={onMoveClick} />);

    const moveBtn = screen.getByText("e2e4");
    fireEvent.click(moveBtn);

    expect(onMoveClick).toHaveBeenCalledWith("e2e4");
  });

  it("should trigger handleScroll on scroll event", () => {
    const { container } = render(<SearchLog log={[makeEntry()]} />);
    const scrollDiv = container.querySelector('[role="region"]');
    expect(scrollDiv).toBeTruthy();
    fireEvent.scroll(scrollDiv!);
  });

  it("should render autoScroll=false without crash", () => {
    render(<SearchLog log={[]} autoScroll={false} />);
    expect(screen.getByText("Searching...")).toBeDefined();
  });
});
