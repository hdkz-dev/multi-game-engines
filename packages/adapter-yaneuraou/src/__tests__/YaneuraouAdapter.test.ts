import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { YaneuraouAdapter } from "../YaneuraouAdapter.js";
import { IEngineLoader } from "@multi-game-engines/core";

class MockWorker {
  postMessage = vi.fn((msg: unknown) => {
    if (
      msg &&
      typeof msg === "object" &&
      (msg as Record<string, unknown>).type === "MG_INJECT_RESOURCES"
    ) {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({
            data: { type: "MG_RESOURCES_READY" },
          } as unknown as MessageEvent);
        }
      }, 0);
    }
    // 2026: ハンドシェイク対応
    if (msg === "usi") {
      setTimeout(() => {
        if (typeof this.onmessage === "function") {
          this.onmessage({ data: "usiok" } as unknown as MessageEvent);
        }
      }, 0);
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: unknown = null;
}

describe("YaneuraouAdapter", () => {
  const mockLoader = {
    loadResource: vi.fn().mockResolvedValue("blob:mock"),
    loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
    revokeByEngineId: vi.fn(),
  };

  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
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

  it("should initialize with correct metadata", () => {
    const adapter = new YaneuraouAdapter({
      sources: {
        main: { url: "http://mock", __unsafeNoSRI: true, type: "worker-js" },
      },
    });
    expect(adapter.id).toBe("yaneuraou");
  });

  it("should change status correctly on load", async () => {
    const adapter = new YaneuraouAdapter({
      sources: {
        main: { url: "http://mock", __unsafeNoSRI: true, type: "worker-js" },
      },
    });
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });
});
