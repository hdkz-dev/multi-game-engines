import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { KataGoAdapter } from "../katago.js";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg &&
      typeof msg === "object" &&
      (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: { type: "MG_RESOURCES_READY" } });
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("KataGoAdapter", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with correct metadata", () => {
    const adapter = new KataGoAdapter();
    expect(adapter.id).toBe("katago");
  });

  it("should change status correctly on load", async () => {
    const adapter = new KataGoAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
