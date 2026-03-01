import { describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll, } from "vitest";
import { EdaxAdapter } from "../EdaxAdapter.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg !== null &&
      typeof msg === "object" &&
      "type" in msg &&
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

describe("EdaxAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "edax",
    adapter: "edax",
    sources: {
      main: {
        url: "http://localhost/edax.js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        type: "worker-js",
      },
    },
  };

  const mockLoader: IEngineLoader = {
    loadResource: vi.fn().mockResolvedValue("blob:http://localhost/main"),
    loadResources: vi
      .fn()
      .mockResolvedValue({ main: "blob:http://localhost/main" }),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
    revokeByEngineId: vi.fn(),
  };

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
    const adapter = new EdaxAdapter(mockConfig);
    expect(adapter.id).toBe("edax");
    expect(adapter.name).toBe("Edax");
  });

  it("should change status to loading then ready on load", async () => {
    const adapter = new EdaxAdapter(mockConfig);
    const statusSpy = vi.fn();
    adapter.onStatusChange(statusSpy);

    await adapter.load(mockLoader);

    expect(statusSpy).toHaveBeenCalledWith("loading");
    expect(statusSpy).toHaveBeenCalledWith("ready");
    expect(adapter.status).toBe("ready");
  });
});
