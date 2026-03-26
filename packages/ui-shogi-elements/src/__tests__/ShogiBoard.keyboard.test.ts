import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../index.js";
import type { ShogiBoard } from "../index.js";

describe("shogi-board keyboard navigation", () => {
  let el: ShogiBoard;

  beforeEach(async () => {
    document.body.innerHTML = "";
    el = document.createElement("shogi-board") as ShogiBoard;
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

  const pressKey = (key: string, ctrlKey = false) => {
    const board = el.shadowRoot?.querySelector(".board") as HTMLElement;
    board.dispatchEvent(
      new KeyboardEvent("keydown", { key, ctrlKey, bubbles: true }),
    );
  };

  it("should have initial focus on square index 0 (9a)", () => {
    const square0 = getSquare(0);
    expect(square0.tabIndex).toBe(0);
    expect(square0.getAttribute("data-square")).toBe("9a");
  });

  it("should move focus down with ArrowDown", async () => {
    pressKey("ArrowDown");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(9).tabIndex).toBe(0); // 9b
    expect(getSquare(9).getAttribute("data-square")).toBe("9b");
  });

  it("should move focus right with ArrowRight", async () => {
    pressKey("ArrowRight");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(1).tabIndex).toBe(0); // 8a
    expect(getSquare(1).getAttribute("data-square")).toBe("8a");
  });

  it("should move focus to end of row with End", async () => {
    pressKey("End");
    await el.updateComplete;

    expect(getSquare(0).tabIndex).toBe(-1);
    expect(getSquare(8).tabIndex).toBe(0); // 1a
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

  it("should move focus to the first square with Ctrl+Home", async () => {
    const square40 = getSquare(40);
    square40.click();
    await el.updateComplete;
    expect(square40.tabIndex).toBe(0);

    pressKey("Home", true);
    await el.updateComplete;

    expect(getSquare(40).tabIndex).toBe(-1);
    expect(getSquare(0).tabIndex).toBe(0);
  });

  it("should move focus to the last square with Ctrl+End", async () => {
    const square40 = getSquare(40);
    square40.click();
    await el.updateComplete;
    expect(square40.tabIndex).toBe(0);

    pressKey("End", true);
    await el.updateComplete;

    expect(getSquare(40).tabIndex).toBe(-1);
    expect(getSquare(80).tabIndex).toBe(0);
  });

  it("should move focus to the top row with PageUp", async () => {
    const square40 = getSquare(40);
    square40.click();
    await el.updateComplete;
    expect(square40.tabIndex).toBe(0);

    pressKey("PageUp");
    await el.updateComplete;

    expect(getSquare(40).tabIndex).toBe(-1);
    expect(getSquare(4).tabIndex).toBe(0);
  });

  it("should move focus to the bottom row with PageDown", async () => {
    const square40 = getSquare(40);
    square40.click();
    await el.updateComplete;
    expect(square40.tabIndex).toBe(0);

    pressKey("PageDown");
    await el.updateComplete;

    expect(getSquare(40).tabIndex).toBe(-1);
    expect(getSquare(76).tabIndex).toBe(0);
  });

  it("should not move focus out of bounds (top/left)", async () => {
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getSquare(0).tabIndex).toBe(0);

    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getSquare(0).tabIndex).toBe(0);
  });
});
