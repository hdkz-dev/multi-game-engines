import { vi } from "vitest";

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
