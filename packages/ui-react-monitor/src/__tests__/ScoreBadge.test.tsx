import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ScoreBadge } from "../components/ScoreBadge.js";
import { EngineUIProvider } from "@multi-game-engines/ui-react-core";

/**
 * 2026 Zenith Practice: 型定義の不整合を解消するため、
 * 期待される matcher の型を明示的に拡張。
 */
import "@testing-library/jest-dom/vitest";

describe("ScoreBadge", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should render mate score correctly", () => {
    render(
      <EngineUIProvider>
        <ScoreBadge score={{ type: "mate", value: 5, relativeValue: 5 }} />
      </EngineUIProvider>,
    );

    expect(screen.getByText("M5")).toBeInTheDocument();
  });

  it("should render centipawn score correctly", () => {
    render(
      <EngineUIProvider>
        <ScoreBadge score={{ type: "cp", value: 150, relativeValue: 150 }} />
      </EngineUIProvider>,
    );

    expect(screen.getByText("+1.50")).toBeInTheDocument();
  });
});
