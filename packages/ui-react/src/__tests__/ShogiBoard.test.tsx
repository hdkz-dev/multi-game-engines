import React from "react";
import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ShogiBoard } from "../shogi/index.js";
import { createSFEN, SFEN } from "@multi-game-engines/core/shogi";

describe("ShogiBoard", () => {
  it("should render without crashing", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    render(<ShogiBoard sfen={sfen} />);
    const el = document.querySelector("mg-shogi-board");
    expect(el).toBeDefined();
  });
});
