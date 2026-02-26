import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ShogiBoard } from "../index.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import React from "react";

describe("ShogiBoard i18n Integration", () => {
  const sfen = createSFEN("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");

  it("should pass localized hand labels to the web component", async () => {
    const { container } = render(
      <ShogiBoard 
        sfen={sfen} 
        locale="en" 
        handSenteLabel="My Hand"
        handGoteLabel="Opponent Hand"
      />
    );
    await waitFor(() => {
      const el = container.querySelector("shogi-board");
      expect(el).not.toBeNull();
      expect(el?.getAttribute("hand-sente-label")).toBe("My Hand");
      expect(el?.getAttribute("hand-gote-label")).toBe("Opponent Hand");
    });
  });

  it("should pass hand piece count format string", async () => {
    const handPieceCount = "You have {count} {piece}";
    const { container } = render(
      <ShogiBoard 
        sfen={sfen} 
        locale="en" 
        handPieceCount={handPieceCount}
      />
    );
    await waitFor(() => {
      const el = container.querySelector("shogi-board");
      expect(el).not.toBeNull();
      expect(el?.getAttribute("hand-piece-count")).toBe(handPieceCount);
    });
  });

  it("should pass piece names correctly", async () => {
    const pieceNames = { P: "Pawn" };
    const { container } = render(
      <ShogiBoard 
        sfen={sfen} 
        locale="en" 
        pieceNames={pieceNames}
      />
    );
    await waitFor(() => {
      const el = container.querySelector("shogi-board") as unknown as { pieceNames?: Record<string, string>; getAttribute: (n: string) => string | null };
      expect(el).not.toBeNull();
      // Complex objects are typically passed via properties in React 19,
      // but let's check if it's serialized or accessible.
      const val = el.pieceNames || JSON.parse(el?.getAttribute("piece-names") || "{}");
      expect(val.P).toBe("Pawn");
    });
  });
});
