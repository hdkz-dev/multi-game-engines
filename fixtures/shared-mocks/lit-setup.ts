import { vi } from "vitest";

// 2026 Best Practice: any を排除し、限定的な型キャストでグローバル変数を設定
(
  globalThis as typeof globalThis & {
    litDisableDevMode: boolean;
  }
).litDisableDevMode = true;

// 2026 Best Practice: グローバルなパフォーマンスタイマーのモック化（主要メソッドを網羅）
vi.stubGlobal("performance", {
  now: vi.fn(() => 0),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
});

// 2026 Best Practice: グローバルなメッセージチャネルのモック化（型安全性の確保）
type MessageHandler = ((event: { data: unknown }) => void) | null;

vi.stubGlobal(
  "MessageChannel",
  class MessageChannel {
    port1 = {
      onmessage: null as MessageHandler,
      postMessage: (data: unknown) => {
        if (typeof this.port2.onmessage === "function") {
          this.port2.onmessage({ data });
        }
      },
    };
    port2 = {
      onmessage: null as MessageHandler,
      postMessage: (data: unknown) => {
        if (typeof this.port1.onmessage === "function") {
          this.port1.onmessage({ data });
        }
      },
    };
  },
);
