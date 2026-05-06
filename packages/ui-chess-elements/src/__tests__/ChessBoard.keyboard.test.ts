import { describe, it, expect, afterEach } from "vitest";
import { ChessBoard } from "../index.js";

async function setup(orientation?: "white" | "black"): Promise<ChessBoard> {
  document.body.innerHTML = "";
  const el = document.createElement("chess-board");
  if (orientation) (el as ChessBoard).orientation = orientation;
  document.body.appendChild(el);
  await (el as ChessBoard).updateComplete;
  // instanceof keeps ChessBoard as a value import so the module side-effect
  // (customElements.define) is not elided by the TypeScript/esbuild transform.
  if (!(el instanceof ChessBoard))
    throw new Error("chess-board not registered");
  return el;
}

function sq(el: ChessBoard, i: number): HTMLElement {
  return el.shadowRoot!.querySelector(`[data-index="${i}"]`) as HTMLElement;
}

function pressKey(el: ChessBoard, key: string, ctrlKey = false): void {
  const board = el.shadowRoot!.querySelector(".board") as HTMLElement;
  board.dispatchEvent(
    new KeyboardEvent("keydown", { key, ctrlKey, bubbles: true }),
  );
}

async function focusSquare(el: ChessBoard, i: number): Promise<void> {
  sq(el, i).click();
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("chess-board keyboard navigation", () => {
  it("should have initial focus on square index 0 (a8)", async () => {
    const el = await setup();
    expect(sq(el, 0).tabIndex).toBe(0);
    expect(sq(el, 0).getAttribute("data-square")).toBe("a8");
  });

  it("should move focus down with ArrowDown", async () => {
    const el = await setup();
    pressKey(el, "ArrowDown");
    await el.updateComplete;

    expect(sq(el, 0).tabIndex).toBe(-1);
    expect(sq(el, 8).tabIndex).toBe(0);
    expect(sq(el, 8).getAttribute("data-square")).toBe("a7");
  });

  it("should move focus right with ArrowRight", async () => {
    const el = await setup();
    pressKey(el, "ArrowRight");
    await el.updateComplete;

    expect(sq(el, 0).tabIndex).toBe(-1);
    expect(sq(el, 1).tabIndex).toBe(0);
    expect(sq(el, 1).getAttribute("data-square")).toBe("b8");
  });

  it("should move focus to end of row with End", async () => {
    const el = await setup();
    pressKey(el, "End");
    await el.updateComplete;

    expect(sq(el, 0).tabIndex).toBe(-1);
    expect(sq(el, 7).tabIndex).toBe(0);
  });

  it("should move focus to start of row with Home", async () => {
    const el = await setup();
    await focusSquare(el, 5);
    expect(sq(el, 5).tabIndex).toBe(0);

    pressKey(el, "Home");
    await el.updateComplete;

    expect(sq(el, 5).tabIndex).toBe(-1);
    expect(sq(el, 0).tabIndex).toBe(0);
  });

  it("should not move focus out of bounds (top)", async () => {
    const el = await setup();
    pressKey(el, "ArrowUp");
    await el.updateComplete;
    expect(sq(el, 0).tabIndex).toBe(0);
  });

  it("should not move focus out of bounds (left)", async () => {
    const el = await setup();
    pressKey(el, "ArrowLeft");
    await el.updateComplete;
    expect(sq(el, 0).tabIndex).toBe(0);
  });
});

describe("chess-board keyboard navigation — orientation=black", () => {
  it("should have ARIA label matching logical coordinate regardless of orientation", async () => {
    const el = await setup("black");
    const firstSquare = el.shadowRoot!.querySelector(".square");
    expect(firstSquare?.getAttribute("data-square")).toBe("h1");
  });

  it("ArrowUp at visual top (h1) should stay", async () => {
    const el = await setup("black");
    await focusSquare(el, 63);
    pressKey(el, "ArrowUp");
    await el.updateComplete;
    expect(sq(el, 63).tabIndex).toBe(0);
  });

  it("ArrowDown from h1 should move to h2 (squareIdx=55)", async () => {
    const el = await setup("black");
    await focusSquare(el, 63);
    pressKey(el, "ArrowDown");
    await el.updateComplete;
    expect(sq(el, 63).tabIndex).toBe(-1);
    expect(sq(el, 55).tabIndex).toBe(0);
    expect(sq(el, 55).getAttribute("data-square")).toBe("h2");
  });

  it("ArrowLeft at visual left edge (h1) should stay", async () => {
    const el = await setup("black");
    await focusSquare(el, 63);
    pressKey(el, "ArrowLeft");
    await el.updateComplete;
    expect(sq(el, 63).tabIndex).toBe(0);
  });

  it("ArrowRight from h1 should move to g1 (squareIdx=62)", async () => {
    const el = await setup("black");
    await focusSquare(el, 63);
    pressKey(el, "ArrowRight");
    await el.updateComplete;
    expect(sq(el, 63).tabIndex).toBe(-1);
    expect(sq(el, 62).tabIndex).toBe(0);
    expect(sq(el, 62).getAttribute("data-square")).toBe("g1");
  });

  it("ArrowRight at visual right edge (a1, squareIdx=56) should stay", async () => {
    const el = await setup("black");
    await focusSquare(el, 56);
    pressKey(el, "ArrowRight");
    await el.updateComplete;
    expect(sq(el, 56).tabIndex).toBe(0);
  });

  it("ArrowLeft from a1 should move to b1 (squareIdx=57)", async () => {
    const el = await setup("black");
    await focusSquare(el, 56);
    pressKey(el, "ArrowLeft");
    await el.updateComplete;
    expect(sq(el, 56).tabIndex).toBe(-1);
    expect(sq(el, 57).tabIndex).toBe(0);
    expect(sq(el, 57).getAttribute("data-square")).toBe("b1");
  });

  it("Home should move to visual row start (h file, col=7) in black orientation", async () => {
    const el = await setup("black");
    await focusSquare(el, 60);
    pressKey(el, "Home");
    await el.updateComplete;
    expect(sq(el, 60).tabIndex).toBe(-1);
    expect(sq(el, 63).tabIndex).toBe(0);
  });

  it("End should move to visual row end (a file, col=0) in black orientation", async () => {
    const el = await setup("black");
    await focusSquare(el, 60);
    pressKey(el, "End");
    await el.updateComplete;
    expect(sq(el, 60).tabIndex).toBe(-1);
    expect(sq(el, 56).tabIndex).toBe(0);
  });

  it("Ctrl+Home should move to visual top-left (h1, squareIdx=63)", async () => {
    const el = await setup("black");
    await focusSquare(el, 20);
    pressKey(el, "Home", true);
    await el.updateComplete;
    expect(sq(el, 63).tabIndex).toBe(0);
  });

  it("Ctrl+End should move to visual bottom-right (a8, squareIdx=0)", async () => {
    const el = await setup("black");
    await focusSquare(el, 20);
    pressKey(el, "End", true);
    await el.updateComplete;
    expect(sq(el, 0).tabIndex).toBe(0);
  });

  it("PageUp should move to visual top of column (row=7) in black orientation", async () => {
    const el = await setup("black");
    await focusSquare(el, 36);
    pressKey(el, "PageUp");
    await el.updateComplete;
    expect(sq(el, 36).tabIndex).toBe(-1);
    expect(sq(el, 60).tabIndex).toBe(0);
  });

  it("PageDown should move to visual bottom of column (row=0) in black orientation", async () => {
    const el = await setup("black");
    await focusSquare(el, 36);
    pressKey(el, "PageDown");
    await el.updateComplete;
    expect(sq(el, 36).tabIndex).toBe(-1);
    expect(sq(el, 4).tabIndex).toBe(0);
  });

  it("ArrowUp from visual bottom (h8, squareIdx=7) should move to h7 (squareIdx=15)", async () => {
    const el = await setup("black");
    await focusSquare(el, 7);
    pressKey(el, "ArrowUp");
    await el.updateComplete;
    expect(sq(el, 7).tabIndex).toBe(-1);
    expect(sq(el, 15).tabIndex).toBe(0);
    expect(sq(el, 15).getAttribute("data-square")).toBe("h7");
  });
});
