import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import BoardComponents from "../BoardComponents.vue";
import { createMove } from "@multi-game-engines/core";
import { createFEN } from "@multi-game-engines/core/chess";
import { createSFEN } from "@multi-game-engines/core/shogi";
import "@multi-game-engines/ui-elements";

describe("BoardComponents (Vue)", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should render chess-board when type is 'chess'", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const lastMove = createMove("e2e4");
    const wrapper = mount(BoardComponents, {
      props: {
        type: "chess",
        fen,
        lastMove,
        boardLabel: "Custom Chess",
      },
      global: {
        stubs: {
          "chess-board": true,
          "shogi-board": true,
        },
      },
    });

    const board = wrapper.find("chess-board-stub");
    expect(board.exists()).toBe(true);
    expect(board.attributes("fen")).toBe(fen);
    expect(board.attributes("last-move")).toBe(lastMove);
    expect(board.attributes("board-label")).toBe("Custom Chess");
  });

  it("should render shogi-board when type is 'shogi'", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const wrapper = mount(BoardComponents, {
      props: {
        type: "shogi",
        sfen,
        handSenteLabel: "Sente pieces",
      },
      global: {
        stubs: {
          "chess-board": true,
          "shogi-board": true,
        },
      },
    });

    const board = wrapper.find("shogi-board-stub");
    expect(board.exists()).toBe(true);
    expect(board.element.getAttribute("sfen")).toBe(sfen);
    expect(board.element.getAttribute("hand-sente-label")).toBe("Sente pieces");
  });

  it("should not set optional attributes when undefined", () => {
    const fen = createFEN("8/8/8/8/8/8/8/8 w - - 0 1");
    const wrapper = mount(BoardComponents, {
      props: {
        type: "chess",
        fen,
      },
      global: {
        stubs: {
          "chess-board": true,
          "shogi-board": true,
        },
      },
    });

    const board = wrapper.find("chess-board-stub");
    expect(board.attributes("last-move")).toBeUndefined();
    expect(board.attributes("board-label")).toBeUndefined();
    expect(board.attributes("error-message")).toBeUndefined();
  });

  it("should warn when required props are missing", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mount(BoardComponents, {
      props: {
        type: "chess",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fen: undefined as unknown as any,
      },
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("'fen' is required"),
    );

    consoleSpy.mockRestore();
  });
});
