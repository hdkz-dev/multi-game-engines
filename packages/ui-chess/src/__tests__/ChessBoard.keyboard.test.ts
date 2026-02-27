import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "../elements.js";
import type { ChessBoard } from "../elements.js";

/**
 * ChessBoard キーボードナビゲーション（Roving Tabindex）のテスト。
 *
 * 対象: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End
 * ボード: 8×8 グリッド（index: 0-63）
 */
describe("chess-board keyboard navigation", () => {
  let el: ChessBoard;

  beforeEach(async () => {
    document.body.innerHTML = "";
    el = document.createElement("chess-board") as ChessBoard;
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
      '[tabindex="0"]',
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

  it("ArrowRight should not exceed column boundary (col 7)", async () => {
    await focusSquare(7); // a8 → h8 (col 7)
    pressKey("ArrowRight");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("7");
  });

  // --- ArrowLeft ---
  it("ArrowLeft should move focus one column to the left", async () => {
    await focusSquare(3);
    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("2");
  });

  it("ArrowLeft should not go below column 0", async () => {
    await focusSquare(0);
    pressKey("ArrowLeft");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");
  });

  // --- ArrowDown ---
  it("ArrowDown should move focus one row down (+8)", async () => {
    await focusSquare(0);
    pressKey("ArrowDown");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("8");
  });

  it("ArrowDown should clamp at index 63 (last row)", async () => {
    await focusSquare(60); // row 7, col 4
    pressKey("ArrowDown");
    await el.updateComplete;
    // 60 + 8 = 68 > 63 → clamped to 63
    expect(getFocusedIndex()).toBe("63");
  });

  // --- ArrowUp ---
  it("ArrowUp should move focus one row up (-8)", async () => {
    await focusSquare(16); // row 2, col 0
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("8");
  });

  it("ArrowUp should clamp at index 0 (first row)", async () => {
    await focusSquare(3); // row 0, col 3
    pressKey("ArrowUp");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("0");
  });

  // --- Home ---
  it("Home should move focus to the first column of the current row", async () => {
    await focusSquare(11); // row 1, col 3
    pressKey("Home");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("8"); // row 1, col 0
  });

  // --- End ---
  it("End should move focus to the last column of the current row", async () => {
    await focusSquare(11); // row 1, col 3
    pressKey("End");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("15"); // row 1, col 7
  });

  // --- 複合テスト ---
  it("should navigate correctly with multiple key presses", async () => {
    await focusSquare(0);
    // 右 → 下 → 下 → 右 → Home
    pressKey("ArrowRight");
    await el.updateComplete;
    pressKey("ArrowDown");
    await el.updateComplete;
    pressKey("ArrowDown");
    await el.updateComplete;
    pressKey("ArrowRight");
    await el.updateComplete;
    // Now at row 2, col 2 → index 18
    expect(getFocusedIndex()).toBe("18");
    pressKey("Home");
    await el.updateComplete;
    // Home → row 2, col 0 → index 16
    expect(getFocusedIndex()).toBe("16");
  });

  // --- 無関係キーの無視 ---
  it("should ignore unrelated keys", async () => {
    await focusSquare(5);
    pressKey("a");
    await el.updateComplete;
    expect(getFocusedIndex()).toBe("5");
  });

  // --- tabindex 管理 ---
  it("should have exactly one element with tabindex=0", async () => {
    const tabZero = el.shadowRoot?.querySelectorAll('[tabindex="0"]');
    expect(tabZero?.length).toBe(1);
  });

  it("should set all other squares to tabindex=-1", async () => {
    const tabMinusOne = el.shadowRoot?.querySelectorAll('[tabindex="-1"]');
    expect(tabMinusOne?.length).toBe(63); // 64 total - 1 focused
  });
});
