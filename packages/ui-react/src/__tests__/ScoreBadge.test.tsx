import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBadge } from "../ScoreBadge.js";
import { EngineUIProvider } from "../EngineUIProvider.js";
import React from "react";

describe("ScoreBadge", () => {
  it("should render mate score correctly", () => {
    render(
      <EngineUIProvider>
        <ScoreBadge score={{ type: "mate", value: 5, relativeValue: 5 }} />
      </EngineUIProvider>,
    );

    expect(screen.getByText("詰みまで 5 手")).toBeInTheDocument();
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
