import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSFEN } from "@multi-game-engines/domain-shogi";
import { ShogiBoard } from "../elements.js";

describe("ShogiBoard", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(1234.56);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    if (!customElements.get("shogi-board")) {
      customElements.define("shogi-board", ShogiBoard);
    }
    const el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);
    expect(customElements.get("shogi-board")).toBeDefined();
    expect(document.querySelector("shogi-board")).not.toBeNull();
  });

  it("should accept SFEN property", async () => {
    const el = document.createElement("shogi-board") as ShogiBoard;
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    el.sfen = sfen;
    expect(el.sfen).toBe(sfen);
  });
});
