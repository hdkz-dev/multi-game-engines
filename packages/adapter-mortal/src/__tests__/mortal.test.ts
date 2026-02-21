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
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: unknown = null;
  onerror: unknown = null;
}

describe("MortalAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "mortal",
    adapter: "mortal",
    sources: {
      main: {
        url: "http://localhost/mortal.js",
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
    const adapter = new MortalAdapter(mockConfig);
    expect(adapter.id).toBe("mortal");
  });

  it("should change status correctly on load", async () => {
    const adapter = new MortalAdapter(mockConfig);
    await adapter.load(mockLoader);
    expect(adapter.status).toBe("ready");
  });
});
