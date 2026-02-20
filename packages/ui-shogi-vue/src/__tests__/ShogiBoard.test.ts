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
    expect(el.boardLabel).toBe("将棋盤");
    expect(el.handSenteLabel).toBe("先手持ち駒");
    expect(el.handGoteLabel).toBe("後手持ち駒");
  });
});
