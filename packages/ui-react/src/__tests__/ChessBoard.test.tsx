import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChessBoard } from "../BoardComponents.js";
import { createFEN, createMove, FEN, Move } from "@multi-game-engines/core";

interface ChessBoardElement extends HTMLElement {
  fen: FEN;
  lastMove: Move;
  orientation: string;
  boardLabel: string;
  errorMessage: string;
  pieceNames: Record<string, string>;
}

describe("ChessBoard (React)", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should render chess-board custom element with props mapped correctly", async () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const lastMove = createMove("e2e4");
    const pieceNames = { P: "Pawn", p: "Gote Pawn" };
    const { container } = render(
      <ChessBoard
        fen={fen}
        lastMove={lastMove}
        orientation="black"
        className="custom-class"
        boardLabel="Custom Chess Board"
        errorMessage="Custom Error"
        pieceNames={pieceNames}
      />,
    );

    const board = container.querySelector<ChessBoardElement>("chess-board");
    expect(board).toBeTruthy();

    if (board) {
      // In React 19, properties are preferred for custom elements if they exist.
      expect(board.fen).toBe(fen);
      expect(board.lastMove).toBe(lastMove);
      expect(board.orientation).toBe("black");
      expect(board.boardLabel).toBe("Custom Chess Board");
      expect(board.errorMessage).toBe("Custom Error");
      expect(board.pieceNames).toEqual(pieceNames);

      expect(board.getAttribute("class")).toBe("custom-class");
    }
  });

  it("should not set optional attributes when undefined", () => {
    const fen = createFEN("8/8/8/8/8/8/8/8 w - - 0 1");
    const { container } = render(<ChessBoard fen={fen} />);

    const board = container.querySelector<ChessBoardElement>("chess-board");
    expect(board).toBeTruthy();
    if (board) {
      expect(board.getAttribute("last-move")).toBeNull();
      expect(board.getAttribute("orientation")).toBeNull();
      expect(board.getAttribute("board-label")).toBeNull();
      expect(board.getAttribute("error-message")).toBeNull();
    }
  });
});
