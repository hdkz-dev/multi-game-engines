import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { EdaxAdapter } from "../edax.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("EdaxAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "edax",
    adapter: "edax",
    sources: {
      main: {
        url: "http://localhost/edax.js",
        sri: "sha384-dummy",
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
