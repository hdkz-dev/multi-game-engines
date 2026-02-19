import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ChessBoard } from "../chess/index.js";
import { createFEN, FEN } from "@multi-game-engines/core/chess";
import { Move } from "@multi-game-engines/core";

describe("ChessBoard", () => {
  it("should render without crashing", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    render(<ChessBoard fen={fen} />);
    const el = document.querySelector("chess-board");
    expect(el).not.toBeNull();
  });
});
