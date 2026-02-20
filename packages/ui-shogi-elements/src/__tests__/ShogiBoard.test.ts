import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../index.js";
import { ShogiBoard } from "../index.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import { createMove } from "@multi-game-engines/core";

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

  it("should highlight last move", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);

    el.lastMove = createMove("7g7f");
    await el.updateComplete;

    const highlighted = el.shadowRoot?.querySelectorAll(".square.highlight");
    expect(highlighted?.length).toBe(2);
    expect(
      el.shadowRoot
        ?.querySelector('[data-square="7g"]')
        ?.classList.contains("highlight"),
    ).toBe(true);
    expect(
      el.shadowRoot
        ?.querySelector('[data-square="7f"]')
        ?.classList.contains("highlight"),
    ).toBe(true);
  });

  it("should localize aria-labels and hand labels", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);

    el.locale = "ja";
    await el.updateComplete;

    const board = el.shadowRoot?.querySelector(".board");
    expect(board?.getAttribute("aria-label")).toBe("ゲームボード");

    const senteHand = el.shadowRoot?.querySelector(".hand.sente");
    expect(senteHand?.getAttribute("aria-label")).toBe("先手 持ち駒");
  });

  it("should render pieces in hand with correct count and localization", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);

    el.locale = "ja";
    // Sente (b) has 2 Pawns (2P) and 1 Knight (N)
    el.sfen = createSFEN("9/9/9/9/9/9/9/9/9 b 2PN 1");
    await el.updateComplete;

    const senteHand = el.shadowRoot?.querySelector(".hand.sente");
    const spans = senteHand?.querySelectorAll("span");
    expect(spans?.length).toBe(2);

    const texts = Array.from(spans!).map((s) => s.textContent);
    expect(texts).toContain("歩2");
    expect(texts).toContain("桂");

    const ariaLabels = Array.from(spans!).map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(ariaLabels).toContain("歩2枚");
    expect(ariaLabels).toContain("桂");
  });
});
