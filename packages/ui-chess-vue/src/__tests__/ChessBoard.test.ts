import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ChessBoardComponent from "../ChessBoard.vue";
import { ChessBoard as ChessBoardElement } from "@multi-game-engines/ui-chess-elements";
import { createFEN } from "@multi-game-engines/domain-chess";

describe("ChessBoard.vue", () => {
  it("renders chess-board custom element", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const wrapper = mount(ChessBoardComponent, {
      props: {
        fen,
      },
    });

    const board = wrapper.find("chess-board");
    expect(board.exists()).toBe(true);
    // Vue 3 sets properties on custom elements if they exist on the prototype
    expect((board.element as ChessBoardElement).fen).toBe(fen);
  });

  it("passes props to custom element", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const wrapper = mount(ChessBoardComponent, {
      props: {
        fen,
        orientation: "black",
        locale: "ja",
        boardLabel: "テストボード",
      },
    });

    const board = wrapper.find("chess-board");
    const el = board.element as ChessBoardElement;
    expect(el.orientation).toBe("black");
    expect(el.locale).toBe("ja");
    expect(el.boardLabel).toBe("テストボード");
  });
});
