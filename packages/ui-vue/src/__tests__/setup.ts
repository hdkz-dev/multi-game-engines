import { vi, beforeEach } from "vitest";

// requestAnimationFrame のグローバルモック
let mockTimestamp = 0;
const step = 16;
let rafId = 0;
const rafCallbacks = new Map<number, ReturnType<typeof setTimeout>>();

beforeEach(() => {
  mockTimestamp = 0;
  rafId = 0;
  rafCallbacks.clear();
});

vi.stubGlobal("performance", {
  now: () => mockTimestamp,
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
});

vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback): number => {
  const id = ++rafId;
  const timeoutHandle = setTimeout(() => {
    mockTimestamp += step;
    cb(mockTimestamp);
    rafCallbacks.delete(id);
  }, step);
  rafCallbacks.set(id, timeoutHandle);
  return id;
});

vi.stubGlobal("cancelAnimationFrame", (id: number): void => {
  const handle = rafCallbacks.get(id);
  if (handle) {
    clearTimeout(handle);
    rafCallbacks.delete(id);
  }
});

vi.useFakeTimers();
