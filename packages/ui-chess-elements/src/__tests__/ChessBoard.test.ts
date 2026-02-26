import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../index.js";
import { ChessBoard } from "../index.js";
import { createFEN } from "@multi-game-engines/domain-chess";
import { createMove } from "@multi-game-engines/core";
import { waitFor } from "@testing-library/dom";

describe("chess-board Web Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(customElements.get("chess-board")).toBeDefined();
  });

  it("should render initial board", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    document.body.appendChild(el);
    await el.updateComplete;

    const board = el.shadowRoot?.querySelector(".board");
    expect(board).not.toBeNull();
    // 8x8 squares
    expect(board?.querySelectorAll(".square").length).toBe(64);
  });

  it("should reflect properties to attributes", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    document.body.appendChild(el);

    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    el.fen = fen;
    el.orientation = "black";
    el.locale = "ja";

    await el.updateComplete;

    expect(el.getAttribute("fen")).toBe(fen);
    expect(el.getAttribute("orientation")).toBe("black");
    expect(el.getAttribute("locale")).toBe("ja");
  });

  it("should highlight last move", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    document.body.appendChild(el);

    el.lastMove = createMove("e2e4");
    await el.updateComplete;

    const highlighted = el.shadowRoot?.querySelectorAll(".square.highlight");
    expect(highlighted?.length).toBe(2);
    expect(
      el.shadowRoot
        ?.querySelector('[data-square="e2"]')
        ?.classList.contains("highlight"),
    ).toBe(true);
    expect(
      el.shadowRoot
        ?.querySelector('[data-square="e4"]')
        ?.classList.contains("highlight"),
    ).toBe(true);
  });

  it("should handle orientation change", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    el.orientation = "black";
    document.body.appendChild(el);

    await el.updateComplete;

    const firstSquare = el.shadowRoot?.querySelector(".square");
    expect(firstSquare?.getAttribute("data-square")).toBe("h1");
  });

  it("should support explicit i18n overrides", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    el.boardLabel = "カスタム将棋盤";
    document.body.appendChild(el);

    await el.updateComplete;

    const board = el.shadowRoot?.querySelector(".board");
    expect(board?.getAttribute("aria-label")).toBe("カスタム将棋盤");
  });

  it("should render localized piece names from pieceNames prop", async () => {
    const el = document.createElement("chess-board") as ChessBoard;
    el.pieceNames = { P: "歩兵" };
    document.body.appendChild(el);

    await el.updateComplete;

    const pawnSquare = el.shadowRoot?.querySelector('[data-square="a2"]');
    const piece = pawnSquare?.querySelector(".piece");
    expect(piece?.textContent).toBe("歩兵");
  });
});
