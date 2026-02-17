import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChessBoard, ShogiBoard } from "../BoardComponents.js";
import { FEN, SFEN, Move } from "@multi-game-engines/ui-core";

describe("BoardComponents (React)", () => {
  describe("ChessBoard", () => {
    it("should render chess-board custom element with props mapped correctly", () => {
      const fen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;
      const lastMove = "e2e4" as Move;
      const { container } = render(
        <ChessBoard
          fen={fen}
          lastMove={lastMove}
          orientation="black"
          className="custom-class"
          boardLabel="Custom Chess Board"
        />,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const board = container.querySelector("chess-board") as any;
      expect(board).toBeTruthy();

      // Verify properties (React 19 sets properties if they exist on the element)
      expect(board.fen).toBe(fen);
      expect(board.lastMove).toBe(lastMove);
      expect(board.orientation).toBe("black");
      expect(board.boardLabel).toBe("Custom Chess Board");
      // Verify attribute for class (mapped from className)
      expect(board.getAttribute("class")).toBe("custom-class");
    });

    it("should not set optional attributes when undefined", () => {
      const fen = "8/8/8/8/8/8/8/8 w - - 0 1" as FEN;
      const { container } = render(<ChessBoard fen={fen} />);

      const board = container.querySelector("chess-board");
      expect(board?.hasAttribute("last-move")).toBe(false);
      expect(board?.hasAttribute("orientation")).toBe(false);
      expect(board?.hasAttribute("board-label")).toBe(false);
    });
  });

  describe("ShogiBoard", () => {
    it("should render shogi-board custom element with props mapped correctly", () => {
      const sfen =
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1" as SFEN;
      const lastMove = "7g7f" as Move;
      const { container } = render(
        <ShogiBoard
          sfen={sfen}
          lastMove={lastMove}
          className="shogi-custom"
          boardLabel="Custom Shogi Board"
          handSenteLabel="Sente pieces"
          handGoteLabel="Gote pieces"
        />,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const board = container.querySelector("shogi-board") as any;
      expect(board).toBeTruthy();
      expect(board.sfen).toBe(sfen);
      expect(board.lastMove).toBe(lastMove);
      expect(board.boardLabel).toBe("Custom Shogi Board");
      expect(board.handSenteLabel).toBe("Sente pieces");
      expect(board.handGoteLabel).toBe("Gote pieces");
      expect(board.getAttribute("class")).toBe("shogi-custom");
    });

    it("should not set optional attributes when undefined", () => {
      const sfen = "9/9/9/9/9/9/9/9/9 b - 1" as SFEN;
      const { container } = render(<ShogiBoard sfen={sfen} />);

      const board = container.querySelector("shogi-board");
      expect(board?.hasAttribute("last-move")).toBe(false);
      expect(board?.hasAttribute("board-label")).toBe(false);
      expect(board?.hasAttribute("hand-sente-label")).toBe(false);
      expect(board?.hasAttribute("hand-gote-label")).toBe(false);
    });
  });
});
