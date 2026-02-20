import "@testing-library/jest-dom/vitest";
import { vi, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

/**
 * 2026 Zenith Practice: 型定義の不整合を解消するため、
 * 明示的な型キャストを用いて matchers を拡張。
 */
expect.extend(matchers.default || matchers);

// requestAnimationFrame のグローバルモック
let mockTimestamp = 0;
const step = 16;

vi.stubGlobal("performance", {
  now: () => mockTimestamp,
});

vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  const handle = setTimeout(() => {
    mockTimestamp += step;
    cb(mockTimestamp);
  }, step);
  return handle;
});

vi.useFakeTimers();
