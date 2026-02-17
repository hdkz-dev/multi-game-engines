import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ShogiBoard } from "../BoardComponents.js";
import { createSFEN, createMove } from "@multi-game-engines/core";

interface ShogiBoardElement extends HTMLElement {
  sfen: string;
  lastMove: string;
  boardLabel: string;
  errorMessage: string;
  handSenteLabel: string;
  handGoteLabel: string;
  pieceNames: Record<string, string>;
}

describe("ShogiBoard (React)", () => {
  it("should render shogi-board custom element with props mapped correctly", async () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const lastMove = createMove("7g7f");
    const pieceNames = { P: "歩", K: "王" };
    const { container } = render(
      <ShogiBoard
        sfen={sfen}
        lastMove={lastMove}
        className="shogi-custom"
        boardLabel="Custom Shogi Board"
        errorMessage="Custom Error"
        handSenteLabel="Sente pieces"
        handGoteLabel="Gote pieces"
        pieceNames={pieceNames}
      />,
    );

    const board = container.querySelector("shogi-board") as ShogiBoardElement;
    expect(board).toBeTruthy();

    expect(board.sfen).toBe(sfen);
    expect(board.lastMove).toBe(lastMove);
    expect(board.boardLabel).toBe("Custom Shogi Board");
    expect(board.errorMessage).toBe("Custom Error");
    expect(board.handSenteLabel).toBe("Sente pieces");
    expect(board.handGoteLabel).toBe("Gote pieces");
    expect(board.pieceNames).toEqual(pieceNames);

    expect(board.getAttribute("class")).toBe("shogi-custom");
  });

  it("should not set optional attributes when undefined", () => {
    const sfen = createSFEN("9/9/9/9/9/9/9/9/9 b - 1");
    const { container } = render(<ShogiBoard sfen={sfen} />);

    const board = container.querySelector("shogi-board") as ShogiBoardElement;
    expect(board.getAttribute("last-move")).toBeNull();
    expect(board.getAttribute("board-label")).toBeNull();
    expect(board.getAttribute("error-message")).toBeNull();
    expect(board.getAttribute("hand-sente-label")).toBeNull();
    expect(board.getAttribute("hand-gote-label")).toBeNull();
  });
});
