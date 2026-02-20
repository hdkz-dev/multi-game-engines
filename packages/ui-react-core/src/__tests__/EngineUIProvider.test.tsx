import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { EngineUIProvider } from "../EngineUIProvider.js";

describe("EngineUIProvider", () => {
  it("should render children", () => {
    render(
      <EngineUIProvider>
        <div data-testid="child">Child</div>
      </EngineUIProvider>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });
});
