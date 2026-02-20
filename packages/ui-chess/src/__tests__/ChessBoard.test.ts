import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../elements.js";
import { createFEN } from "@multi-game-engines/domain-chess";

describe("chess-board Web Component", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    const el = document.createElement("chess-board");
    document.body.appendChild(el);
    expect(customElements.get("chess-board")).toBeDefined();
    expect(document.querySelector("chess-board")).not.toBeNull();
  });

  it("should accept FEN property", async () => {
    const el = document.createElement("chess-board");
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    el.fen = fen;
    expect(el.fen).toBe(fen);
  });
});
