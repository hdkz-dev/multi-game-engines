import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// requestAnimationFrame のグローバルモック
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
  setTimeout(() => cb(Date.now()), 16),
);
