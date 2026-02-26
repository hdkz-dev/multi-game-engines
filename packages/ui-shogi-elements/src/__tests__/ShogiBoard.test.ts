import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../index.js";
import { ShogiBoard } from "../index.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import { createMove } from "@multi-game-engines/core";
import { waitFor } from "@testing-library/dom";

describe("shogi-board Web Component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(customElements.get("shogi-board")).toBeDefined();
  });

  it("should render initial board and hands", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);
    await el.updateComplete;

    const board = el.shadowRoot?.querySelector(".board");
    expect(board).not.toBeNull();
    // 9x9 squares
    expect(board?.querySelectorAll(".square").length).toBe(81);

    const hands = el.shadowRoot?.querySelectorAll(".hand");
    expect(hands?.length).toBe(2);
  });

  it("should reflect properties to attributes", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);

    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    el.sfen = sfen;
    el.locale = "ja";
    el.boardLabel = "カスタム将棋盤";

    await el.updateComplete;

    expect(el.getAttribute("sfen")).toBe(sfen);
    expect(el.getAttribute("locale")).toBe("ja");
    expect(el.getAttribute("board-label")).toBe("カスタム将棋盤");
  });

  it("should support explicit i18n overrides", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    el.boardLabel = "対局盤";
    el.handSenteLabel = "自分";
    document.body.appendChild(el);

    await el.updateComplete;

    const board = el.shadowRoot?.querySelector(".board");
    expect(board?.getAttribute("aria-label")).toBe("対局盤");

    const senteHand = el.shadowRoot?.querySelector(".hand.sente");
    expect(senteHand?.getAttribute("aria-label")).toBe("自分");
  });

  it("should render localized piece names from pieceNames prop", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    el.pieceNames = { P: "歩兵" };
    el.sfen = createSFEN("9/9/9/9/9/9/9/9/P8 b - 1"); // One pawn on board
    document.body.appendChild(el);

    await el.updateComplete;

    const pawnSquare = el.shadowRoot?.querySelector('[data-square="9i"]');
    const piece = pawnSquare?.querySelector(".piece");
    expect(piece?.textContent).toBe("歩兵");
  });

  it("should render pieces in hand with correct count from prop", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    el.pieceNames = { P: "歩兵" };
    el.handPieceCount = "{piece}が{count}枚";
    // Sente has 2 Pawns (2P)
    el.sfen = createSFEN("9/9/9/9/9/9/9/9/9 b 2P 1");
    document.body.appendChild(el);

    await el.updateComplete;

    await waitFor(() => {
      const senteHand = el.shadowRoot?.querySelector(".hand.sente");
      const span = senteHand?.querySelector("span");
      expect(span?.getAttribute("aria-label")).toBe("歩兵が2枚");
      expect(span?.textContent).toContain("歩兵2");
    });
  });
});
