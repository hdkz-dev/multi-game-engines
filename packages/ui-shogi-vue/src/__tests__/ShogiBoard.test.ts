import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ShogiBoardComponent from "../ShogiBoard.vue";

import { ShogiBoard as ShogiBoardElement } from "@multi-game-engines/ui-shogi-elements";
import { createSFEN } from "@multi-game-engines/domain-shogi";

describe("ShogiBoard.vue", () => {
  it("renders shogi-board custom element", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const wrapper = mount(ShogiBoardComponent, {
      props: {
        sfen,
      },
    });

    const board = wrapper.find("shogi-board");
    expect(board.exists()).toBe(true);
    expect((board.element as ShogiBoardElement).sfen).toBe(sfen);
  });

  it("passes props to custom element", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const wrapper = mount(ShogiBoardComponent, {
      props: {
        sfen,
        locale: "ja",
        boardLabel: "将棋盤",
        handSenteLabel: "先手持ち駒",
        handGoteLabel: "後手持ち駒",
      },
    });

    const board = wrapper.find("shogi-board");
    const el = board.element as ShogiBoardElement;
    expect(el.locale).toBe("ja");
    expect(el.boardLabel || el.getAttribute("board-label")).toBe("将棋盤");
    expect(el.handSenteLabel || el.getAttribute("hand-sente-label")).toBe("先手持ち駒");
    expect(el.handGoteLabel || el.getAttribute("hand-gote-label")).toBe("後手持ち駒");
  });

  it("passes complex i18n props to custom element", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const pieceNames = { P: "歩兵", L: "香車" };
    const handPieceCount = "{piece}が{count}枚";
    
    const wrapper = mount(ShogiBoardComponent, {
      props: {
        sfen,
        pieceNames,
        handPieceCount,
      },
    });

    const board = wrapper.find("shogi-board");
    const el = board.element as ShogiBoardElement;
    // For Lit properties, they might be on the element instance
    // For attributes, check the DOM attribute
    expect(el.handPieceCount || board.attributes("hand-piece-count")).toBe(handPieceCount);
    expect((el.pieceNames as Record<string, string>).P).toBe("歩兵");
  });
});
