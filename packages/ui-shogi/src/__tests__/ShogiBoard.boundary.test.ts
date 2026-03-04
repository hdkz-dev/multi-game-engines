import { describe, it, expect, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../index.js";
import { ShogiBoard } from "../index.js";

describe("ShogiBoard: Absolute Boundary Keyboard Navigation", () => {
  let el: ShogiBoard;

  beforeEach(async () => {
    el = await fixture(html`<shogi-board></shogi-board>`);
    await el.updateComplete;
  });

  const getFocusedIndex = () => {
    const active = el.shadowRoot?.activeElement || document.activeElement;
    return active?.getAttribute("data-index");
  };

  const focusSquare = async (index: number) => {
    const square = el.shadowRoot?.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
    square?.focus();
    // 内部状態を同期させるために直接代入（テストの安定性のため）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any)._focusedIndex = index;
    await el.updateComplete;
  };

  const pressKey = (key: string, ctrl = false) => {
    const active = el.shadowRoot?.activeElement || document.activeElement;
    active?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        ctrlKey: ctrl,
        bubbles: true,
        composed: true,
      }),
    );
  };

  it("左端 (col 0) で ArrowLeft を押しても、右端 (col 8) や前の行にラップアンラップしないこと", async () => {
    await focusSquare(9); // 2行目 1列目 (index 9, row 1, col 0)
    pressKey("ArrowLeft");
    await el.updateComplete;

    // index 8 (1行目の最後) に移動してはいけない。その場に留まるべき。
    expect(getFocusedIndex()).toBe("9");
  });

  it("右端 (col 8) で ArrowRight を押しても、次の行の左端にラップしないこと", async () => {
    await focusSquare(8); // 1行目 9列目 (index 8, row 0, col 8)
    pressKey("ArrowRight");
    await el.updateComplete;

    // index 9 に移動してはいけない。
    expect(getFocusedIndex()).toBe("8");
  });

  it("PageUp / PageDown が列を維持したまま、最上段・最下段に正確に移動すること", async () => {
    await focusSquare(40); // row 4, col 4

    pressKey("PageUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("4"); // row 0, col 4

    pressKey("PageDown");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("76"); // row 8, col 4
  });

  it("Ctrl + Home / End が盤面の絶対的な最初 (0) と最後 (80) にジャンプすること", async () => {
    await focusSquare(40);

    pressKey("Home", true);
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");

    pressKey("End", true);
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("80");
  });
});
