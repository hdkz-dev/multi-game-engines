import { vi } from "vitest";

(globalThis as any).litDisableDevMode = true;

// 2026 Best Practice: グローバルなパフォーマンスタイマーのモック化
vi.stubGlobal("performance", {
  now: vi.fn(() => 0),
});

// 2026 Best Practice: グローバルなメッセージチャネルのモック化
vi.stubGlobal(
  "MessageChannel",
  class MessageChannel {
    port1 = {
      onmessage: null,
      postMessage: (data: any) => {
        if (this.port2.onmessage) {
          (this.port2.onmessage as any)({ data });
        }
      },
    };
    port2 = {
      onmessage: null,
      postMessage: (data: any) => {
        if (this.port1.onmessage) {
          (this.port1.onmessage as any)({ data });
        }
      },
    };
  },
);
