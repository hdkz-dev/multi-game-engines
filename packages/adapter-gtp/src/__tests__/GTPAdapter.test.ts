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
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg !== null &&
      typeof msg === "object" &&
      "type" in msg &&
      msg.type === "MG_INJECT_RESOURCES"
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

  const mockLoader = {
    loadResource: vi.fn().mockResolvedValue("blob:mock"),
    loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
    revokeByEngineId: vi.fn(),
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });
});
