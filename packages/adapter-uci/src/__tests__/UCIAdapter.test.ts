import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { UCIAdapter } from "../UCIAdapter.js";
import { IEngineConfig } from "@multi-game-engines/core";

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
    // 2026: ハンドシェイク対応
    if (msg === "uci") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "uciok" });
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("UCIAdapter", () => {
  const config: IEngineConfig = {
    id: "test-uci",
    adapter: "uci",
    name: "Test UCI Engine",
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
    const adapter = new UCIAdapter(config);
    expect(adapter.id).toBe("test-uci");
    expect(adapter.name).toBe("Test UCI Engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new UCIAdapter(config);
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });
});
