import { describe, it, expect, vi, beforeEach } from "vitest";
import { EdaxAdapter } from "../edax.js";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("EdaxAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with correct metadata", () => {
    const adapter = new EdaxAdapter();
    expect(adapter.id).toBe("edax");
    expect(adapter.name).toBe("Edax");
  });

  it("should change status to loading then ready on load", async () => {
    const adapter = new EdaxAdapter();
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    await adapter.load();
    
    expect(statusSpy).toHaveBeenCalledWith("loading");
    expect(statusSpy).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });
});
