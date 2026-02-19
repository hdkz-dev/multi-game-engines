import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../elements.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";

describe("shogi-board Web Component", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should be defined", () => {
    const el = document.createElement("shogi-board");
    document.body.appendChild(el);
    expect(customElements.get("shogi-board")).toBeDefined();
    expect(document.querySelector("shogi-board")).not.toBeNull();
  });

  it("should accept SFEN property", async () => {
    const el = document.createElement("shogi-board");
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    el.sfen = sfen;
    expect(el.sfen).toBe(sfen);
  });
});
