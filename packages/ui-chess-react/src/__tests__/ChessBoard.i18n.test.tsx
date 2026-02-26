import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ChessBoard } from "../index.js";
import { createFEN } from "@multi-game-engines/domain-chess";
import React from "react";

describe("ChessBoard i18n Integration", () => {
  const fen = createFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

  it("should pass localized board label to the web component", async () => {
    const { container } = render(
      <ChessBoard 
        fen={fen} 
        locale="en" 
        boardLabel="Test Board"
      />
    );
    
    await waitFor(() => {
      const el = container.querySelector("chess-board") as unknown as { boardLabel?: string; getAttribute: (n: string) => string | null };
      expect(el).not.toBeNull();
      // Check both property and attribute
      expect(el.boardLabel || el.getAttribute("board-label")).toBe("Test Board");
    });
  });

  it("should pass custom piece names", async () => {
    const customPieces = {
      P: "Soldier",
      p: "soldier",
    };
    const { container } = render(
      <ChessBoard 
        fen={fen} 
        locale="en" 
        pieceNames={customPieces}
      />
    );
    
    await waitFor(() => {
      const el = container.querySelector("chess-board") as unknown as { pieceNames?: Record<string, string>; getAttribute: (n: string) => string | null };
      expect(el).not.toBeNull();
      const val = el.pieceNames || JSON.parse(el.getAttribute("piece-names") || "{}");
      expect(val.P).toBe("Soldier");
    });
  });

  it("should pass FEN string correctly", async () => {
    const { container } = render(
      <ChessBoard 
        fen={fen} 
        locale="en" 
      />
    );
    await waitFor(() => {
      const el = container.querySelector("chess-board") as unknown as { fen?: string; getAttribute: (n: string) => string | null };
      expect(el?.fen || el?.getAttribute("fen")).toBe(fen);
    });
  });
});
