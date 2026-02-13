import { describe, it, expect, vi, beforeEach } from "vitest";
import { YaneuraouAdapter } from "../yaneuraou.js";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
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
