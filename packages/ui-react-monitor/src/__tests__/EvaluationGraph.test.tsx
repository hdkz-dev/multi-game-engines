import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { EvaluationGraph } from "../EvaluationGraph.js";
import { IEvaluationHistoryEntry } from "@multi-game-engines/ui-core";

describe("EvaluationGraph", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should render correctly with entries", () => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 10, relativeValue: 10 }, timestamp: 0 },
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 1 },
    ];
    const { container } = render(<EvaluationGraph entries={entries} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render correctly with no entries", () => {
    const { container } = render(<EvaluationGraph entries={[]} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render correctly with a mate score", () => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 100, relativeValue: 100 }, timestamp: 0 },
      { score: { type: "mate", value: 1, relativeValue: 1 }, timestamp: 1 },
    ];
    const { container } = render(<EvaluationGraph entries={entries} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
