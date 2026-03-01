import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { PrincipalVariation, Move } from "@multi-game-engines/ui-core";
import { createMove } from "@multi-game-engines/core";
import { PVList } from "../components/PVList.js";

// Mock hooks
vi.mock("@multi-game-engines/ui-react-core", () => ({
  useEngineUI: () => ({
    strings: {
      moveAriaLabel: (m: string) => `Move ${m}`,
      searching: "Searching...",
      advantage: (side: string, v: number) => `${side} ${v}`,
      mateIn: (n: number) => `M${n}`,
    },
  }),
}));

describe("PVList", () => {
  afterEach(cleanup);
  const mockPvs: PrincipalVariation[] = [
    {
      multipv: 1,
      score: { type: "cp", value: 10, relativeValue: 10 },
      moves: ["e2e4", "e7e5", "g1f3"].map(createMove),
    },
  ];

  it("should render PV entries", () => {
    render(<PVList pvs={mockPvs} />);
    screen.getByText("e2e4");
    screen.getByText("e7e5");
    screen.getByText("g1f3");
  });

  it("should call onMoveClick when a move is clicked", () => {
    const onMoveClick = vi.fn();
    render(<PVList pvs={mockPvs} onMoveClick={onMoveClick} />);

    const moveBtn = screen.getByText("e2e4");
    fireEvent.click(moveBtn);

    expect(onMoveClick).toHaveBeenCalledWith("e2e4", 0, mockPvs[0]);
  });

  it("should show searching message when no pvs", () => {
    render(<PVList pvs={[]} />);
    screen.getByText("Searching...");
  });
});
