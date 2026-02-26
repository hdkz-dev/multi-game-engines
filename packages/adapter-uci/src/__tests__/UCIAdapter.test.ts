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
    } else if (msg === "uci") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "id name TestEngine" });
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
    id: "test-engine",
    adapter: "uci",
    sources: {
      main: {
        url: "engine.js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
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
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:mock"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
  });

  it("should initialize with config", () => {
    const adapter = new UCIAdapter(config);
    expect(adapter.id).toBe("test-engine");
  });

  it("should change status correctly on load", async () => {
    const adapter = new UCIAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should throw EngineError if loader is missing", async () => {
    const adapter = new UCIAdapter(config);
    await expect(adapter.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.loaderRequired" }),
    );
  });
});
