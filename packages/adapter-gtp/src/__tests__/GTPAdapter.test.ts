import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { GTPAdapter } from "../GTPAdapter.js";
import { IEngineConfig } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg) => {
    if (msg?.type === "MG_INJECT_RESOURCES") {
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

describe("GTPAdapter", () => {
  const config: IEngineConfig = {
    id: "test-gtp",
    adapter: "gtp",
    name: "Test GTP Engine",
    sources: {
      main: {
        url: "https://example.com/engine.js",
        __unsafeNoSRI: true,
        type: "worker-js",
      },
    },
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with config metadata", () => {
    const adapter = new GTPAdapter(config);
    expect(adapter.id).toBe("test-gtp");
    expect(adapter.name).toBe("Test GTP Engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new GTPAdapter(config);
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
