import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, renderHook } from "@testing-library/react";
import { EngineUIProvider, useEngineUI } from "../EngineUIProvider.js";

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

describe("useEngineUI", () => {
  it("should return context strings when inside provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EngineUIProvider>{children}</EngineUIProvider>
    );
    const { result } = renderHook(() => useEngineUI(), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current.strings).toBeDefined();
  });

  it("should return default strings when outside provider", () => {
    const { result } = renderHook(() => useEngineUI());
    expect(result.current).toBeDefined();
    expect(result.current.strings).toBeDefined();
  });
});
