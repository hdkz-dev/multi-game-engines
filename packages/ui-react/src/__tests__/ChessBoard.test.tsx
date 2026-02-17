import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChessBoard } from "../BoardComponents.js";
import { createFEN, createMove } from "@multi-game-engines/core";

interface ChessBoardElement extends HTMLElement {
  fen: string;
  lastMove: string;
  orientation: string;
  boardLabel: string;
  pieceNames: Record<string, string>;
}

describe("ChessBoard (React)", () => {
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
        pieceNames={pieceNames}
      />,
    );

    const board = container.querySelector("chess-board") as ChessBoardElement;
    expect(board).toBeTruthy();

    // In React 19, properties are preferred for custom elements if they exist.
    expect(board.fen).toBe(fen);
    expect(board.lastMove).toBe(lastMove);
    expect(board.orientation).toBe("black");
    expect(board.boardLabel).toBe("Custom Chess Board");
    expect(board.pieceNames).toEqual(pieceNames);

    expect(board.getAttribute("class")).toBe("custom-class");
  });

  it("should not set optional attributes when undefined", () => {
    const fen = createFEN("8/8/8/8/8/8/8/8 w - - 0 1");
    const { container } = render(<ChessBoard fen={fen} />);

    const board = container.querySelector("chess-board") as ChessBoardElement;
    expect(board.getAttribute("last-move")).toBeNull();
    expect(board.getAttribute("orientation")).toBeNull();
    expect(board.getAttribute("board-label")).toBeNull();
  });
});
