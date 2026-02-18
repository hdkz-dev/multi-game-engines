import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { KatagoAdapter } from "../katago.js";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("KatagoAdapter", () => {
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
    const adapter = new KatagoAdapter();
    expect(adapter.id).toBe("katago");
  });

  it("should change status correctly on load", async () => {
    const adapter = new KatagoAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
