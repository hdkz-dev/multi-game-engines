import { describe, it, expect, vi, beforeEach } from "vitest";
import { YaneuraouAdapter } from "../yaneuraou.js";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg &&
      typeof msg === "object" &&
      (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({
            data: { type: "MG_RESOURCES_READY" },
          } as MessageEvent);
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: unknown = null;
}

describe("YaneuraouAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with correct metadata", () => {
    const adapter = new YaneuraouAdapter();
    expect(adapter.id).toBe("yaneuraou");
  });

  it("should change status correctly on load", async () => {
    const adapter = new YaneuraouAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
