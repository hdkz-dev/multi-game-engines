import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { MortalAdapter } from "../mortal.js";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("MortalAdapter", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with correct metadata", () => {
    const adapter = new MortalAdapter();
    expect(adapter.id).toBe("mortal");
  });

  it("should change status correctly on load", async () => {
    const adapter = new MortalAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
