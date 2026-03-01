import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "../elements.js";
import type { ShogiBoard } from "../elements.js";

/**
 * ShogiBoard キーボードナビゲーション（Roving Tabindex）のテスト。
 *
 * 対象: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End
 * ボード: 9×9 グリッド（index: 0-80）
 */
describe("shogi-board keyboard navigation", () => {
  let el: ShogiBoard;

  beforeEach(async () => {
    vi.spyOn(performance, "now").mockReturnValue(1234.56);
    document.body.innerHTML = "";
    el = document.createElement("shogi-board") as ShogiBoard;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /**
   * ヘルパー: 指定 index のマスにフォーカスを設定する。
   */
  async function focusSquare(index: number) {
    const sq = el.shadowRoot?.querySelector(
      `[data-index="${index}"]`,
    ) as HTMLElement;
    sq?.click();
    await el.updateComplete;
  }

  /**
   * ヘルパー: board グリッドに keydown イベントを発火する。
   */
  function pressKey(key: string) {
    const board = el.shadowRoot?.querySelector(".board") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    board?.dispatchEvent(event);
  }

  /**
   * ヘルパー: 現在フォーカスされているマスの data-index を取得する。
   */
  function getFocusedIndex(): string | null {
    const focused = el.shadowRoot?.querySelector(
      '.square[tabindex="0"]',
    ) as HTMLElement;
    return focused?.getAttribute("data-index") ?? null;
  }

  // --- 初期状態 ---
  it("should set initial focus on index 0", () => {
    expect(getFocusedIndex()).toBe("0");
  });

  // --- ArrowRight ---
  it("ArrowRight should move focus one column to the right", async () => {
    await focusSquare(0);
    pressKey("ArrowRight");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("1");
  });

  it("ArrowRight should not exceed column boundary (col 8)", async () => {
    await focusSquare(8); // row 0, col 8
    pressKey("ArrowRight");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("8");
  });

  // --- ArrowLeft ---
  it("ArrowLeft should move focus one column to the left", async () => {
    await focusSquare(4);
    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("3");
  });

  it("ArrowLeft should not go below column 0", async () => {
    await focusSquare(0);
    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");
  });

  // --- ArrowDown ---
  it("ArrowDown should move focus one row down (+9)", async () => {
    await focusSquare(0);
    pressKey("ArrowDown");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("9");
  });

  it("ArrowDown should clamp at index 80 (last row)", async () => {
    await focusSquare(76); // row 8, col 4
    pressKey("ArrowDown");
    await el.updateComplete;
    // 76 + 9 = 85 > 80 → clamped to 80
    expect(getFocusedIndex()).toBe("80");
  });

  // --- ArrowUp ---
  it("ArrowUp should move focus one row up (-9)", async () => {
    await focusSquare(18); // row 2, col 0
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("9");
  });

  it("ArrowUp should clamp at index 0 (first row)", async () => {
    await focusSquare(4); // row 0, col 4
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");
  });

  // --- Home ---
  it("Home should move focus to the first column of the current row", async () => {
    await focusSquare(14); // row 1, col 5
    pressKey("Home");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("9"); // row 1, col 0
  });

  // --- End ---
  it("End should move focus to the last column of the current row", async () => {
    await focusSquare(14); // row 1, col 5
    pressKey("End");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("17"); // row 1, col 8
  });

  it("PageUp should move focus to the same column in the first row", async () => {
    await focusSquare(40); // row 4, col 4
    pressKey("PageUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("4"); // row 0, col 4
  });

  it("PageDown should move focus to the same column in the last row", async () => {
    await focusSquare(40); // row 4, col 4
    pressKey("PageDown");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("76"); // row 8, col 4
  });

  it("Home (ctrl) should move focus to index 0", async () => {
    await focusSquare(40);
    const board = el.shadowRoot?.querySelector(".board") as HTMLElement;
    board?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Home",
        ctrlKey: true,
        bubbles: true,
      }),
    );
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");
  });

  it("End (ctrl) should move focus to index 80", async () => {
    await focusSquare(40);
    const board = el.shadowRoot?.querySelector(".board") as HTMLElement;
    board?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "End",
        ctrlKey: true,
        bubbles: true,
      }),
    );
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("80");
  });

  // --- 複合テスト ---
  it("should navigate correctly with multiple key presses", async () => {
    await focusSquare(0);
    // 右 → 下 → 下 → 右 → End
    pressKey("ArrowRight");
    await el.updateComplete;
    pressKey("ArrowDown");
    await el.updateComplete;
    pressKey("ArrowDown");
    await el.updateComplete;
    pressKey("ArrowRight");
    await el.updateComplete;
    // Now at row 2, col 2 → index 20
    expect(getFocusedIndex()).toBe("20");
    pressKey("End");
    await el.updateComplete;
    // End → row 2, col 8 → index 26
    expect(getFocusedIndex()).toBe("26");
  });

  // --- 無関係キーの無視 ---
  it("should ignore unrelated keys", async () => {
    await focusSquare(5);
    pressKey("a");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("5");
  });

  // --- tabindex 管理 ---
  it("should have exactly one square with tabindex=0", async () => {
    const tabZero = el.shadowRoot?.querySelectorAll('.square[tabindex="0"]');
    expect(tabZero?.length).toBe(1);
  });

  it("should set all other squares to tabindex=-1", async () => {
    const tabMinusOne = el.shadowRoot?.querySelectorAll(
      '.square[tabindex="-1"]',
    );
    expect(tabMinusOne?.length).toBe(80); // 81 total - 1 focused
  });
});
