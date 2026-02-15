import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * 2026 Zenith Practice: テストの決定論性を保証するグローバルモック。
 */

// 決定論的なタイムスタンプ管理
let mockTimestamp = 0;
const step = 16; // 60fps 相当

// performance.now() のモック
vi.stubGlobal("performance", {
  now: () => mockTimestamp,
});

// requestAnimationFrame の決定論的モック
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  const handle = setTimeout(() => {
    mockTimestamp += step;
    cb(mockTimestamp);
  }, step);
  return handle;
});

// タイマーの初期化
vi.useFakeTimers();
