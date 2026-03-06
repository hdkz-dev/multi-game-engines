import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFEN } from "@multi-game-engines/domain-chess";
import { ChessBoard } from "../elements.js";

describe("ChessBoard", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(1234.56);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    if (!customElements.get("chess-board")) {
      customElements.define("chess-board", ChessBoard);
    }
    const el = document.createElement("chess-board") as ChessBoard;
    document.body.appendChild(el);
    expect(customElements.get("chess-board")).toBeDefined();
    expect(document.querySelector("chess-board")).not.toBeNull();
  });

  it("should accept FEN property", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    el.fen = fen;
    expect(el.fen).toBe(fen);
  });
});
