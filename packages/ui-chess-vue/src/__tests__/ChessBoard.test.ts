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

  it("passes custom piece names to custom element", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const pieceNames = { P: "Soldier", p: "soldier" };
    const wrapper = mount(ChessBoardComponent, {
      props: {
        fen,
        pieceNames,
      },
    });

    const board = wrapper.find("chess-board");
    const el = board.element as ChessBoardElement;
    expect(el.pieceNames.P).toBe("Soldier");
  });
  it("renders safely when optional piece mappings are omitted or removed", async () => {
    const wrapper = mount(ChessBoardComponent, {
      props: {
        fen: createFEN(
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
      },
      attachTo: document.body,
    });
    try {
      const el = wrapper.find("chess-board").element as ChessBoardElement;
      await el.updateComplete;
      expect(el.pieceNames).toEqual({});
      expect(el.pieceSymbols).toEqual({});
      expect(el.shadowRoot?.querySelectorAll(".square")).toHaveLength(64);
      await wrapper.setProps({
        pieceNames: { P: "Soldier" },
        pieceSymbols: { P: "P" },
      });
      await el.updateComplete;
      await wrapper.setProps({
        pieceNames: undefined,
        pieceSymbols: undefined,
      });
      await el.updateComplete;
      expect(el.pieceNames).toEqual({});
      expect(el.pieceSymbols).toEqual({});
      expect(el.shadowRoot?.querySelectorAll(".square")).toHaveLength(64);
    } finally {
      wrapper.unmount();
    }
  });
});
