import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../index.js";
import { ChessBoard } from "../index.js";

describe("chess-board keyboard navigation", () => {
  let el: ChessBoard;

  beforeEach(async () => {
    document.body.innerHTML = "";
    el = document.createElement("chess-board") as ChessBoard;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  const getSquare = (index: number) => {
    return el.shadowRoot?.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
  };

  const pressKey = (key: string) => {
    const board = el.shadowRoot?.querySelector(".board") as HTMLElement;
    board.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  };

  it("should have initial focus on square index 0 (a8)", () => {
    const square0 = getSquare(0);
    expect(square0.tabIndex).toBe(0);
    expect(square0.getAttribute("data-square")).toBe("a8");
  });

  it("should move focus down with ArrowDown", async () => {
    pressKey("ArrowDown");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(8).tabIndex).toBe(0); // a7
    expect(getSquare(8).getAttribute("data-square")).toBe("a7");
  });

  it("should move focus right with ArrowRight", async () => {
    pressKey("ArrowRight");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(1).tabIndex).toBe(0); // b8
    expect(getSquare(1).getAttribute("data-square")).toBe("b8");
  });

  it("should move focus to end of row with End", async () => {
    pressKey("End");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(7).tabIndex).toBe(0); // h8
  });

  it("should move focus to start of row with Home", async () => {
    // First move to index 5
    const square5 = getSquare(5);
    square5.click();
    await el.updateComplete;
    expect(square5.tabIndex).toBe(0);

    pressKey("Home");
    await el.updateComplete;

    expect(getSquare(5).tabIndex).toBe(-1);
    expect(getSquare(0).tabIndex).toBe(0);
  });

  it("should not move focus out of bounds (top)", async () => {
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getSquare(0).tabIndex).toBe(0);
  });

  it("should not move focus out of bounds (left)", async () => {
    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getSquare(0).tabIndex).toBe(0);
  });
});
