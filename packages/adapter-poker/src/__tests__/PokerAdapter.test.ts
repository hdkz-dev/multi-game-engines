import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PokerAdapter, createPokerAdapter } from "../PokerAdapter.js";
import { IEngineConfig, IEngineLoader } from "@multi-game-engines/core";

const { NativeCommunicatorMock } = vi.hoisted(() => ({
  NativeCommunicatorMock: vi.fn(),
}));

vi.mock("@multi-game-engines/core/node", () => ({
  NativeCommunicator: NativeCommunicatorMock,
}));

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
    } else if (typeof msg === "string") {
      try {
        const parsed = JSON.parse(msg) as Record<string, unknown>;
        if (parsed["cmd"] === "ready") {
          setTimeout(() => {
            if (typeof this.onmessage === "function") {
              this.onmessage({
                data: JSON.stringify({ ready: true }),
              });
            }
          }, 0);
        }
      } catch {
        // ignore
      }
    }
  });
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("PokerAdapter", () => {
  const config: IEngineConfig = {
    id: "test-poker",
    adapter: "poker",
    name: "Test Poker Engine",
    sources: {
      main: {
        url: "https://example.com/poker-engine.js",
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

  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
    mockLoader.loadResources.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should initialize with config metadata", () => {
    const adapter = new PokerAdapter(config);
    expect(adapter.id).toBe("test-poker");
    expect(adapter.name).toBe("Test Poker Engine");
  });

  it("should reach ready status on load", async () => {
    const adapter = new PokerAdapter(config);
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should throw loaderRequired when no loader provided", async () => {
    const adapter = new PokerAdapter(config);
    await expect(adapter.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.loaderRequired" }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should throw missingMainEntryPoint when main resource missing", async () => {
    const noMainLoader = {
      ...mockLoader,
      loadResources: vi.fn().mockResolvedValue({}),
    };
    const adapter = new PokerAdapter(config);
    await expect(
      adapter.load(noMainLoader as unknown as IEngineLoader),
    ).rejects.toThrow(
      expect.objectContaining({
        i18nKey: "engine.errors.missingMainEntryPoint",
      }),
    );
    expect(adapter.status).toBe("error");
  });

  it("should emit loading then ready status sequence", async () => {
    const adapter = new PokerAdapter(config);
    const statuses: string[] = [];
    adapter.onStatusChange((s) => statuses.push(s));
    await adapter.load(mockLoader as unknown as IEngineLoader);
    expect(statuses).toEqual(["loading", "ready"]);
  });

  it("createPokerAdapter factory returns a PokerAdapter instance", () => {
    const adapter = createPokerAdapter(config);
    expect(adapter).toBeInstanceOf(PokerAdapter);
    expect(adapter.id).toBe("test-poker");
  });
});

describe("PokerAdapter — native mode (Node.js + binaryPath)", () => {
  const nativeConfig: IEngineConfig = {
    id: "deepstack-native",
    adapter: "poker",
    binaryPath: "/mock/deepstack",
  };

  beforeEach(() => {
    NativeCommunicatorMock.mockImplementation(function () {
      return {
        spawn: vi.fn().mockResolvedValue(undefined),
        postMessage: vi.fn(),
        onMessage: vi.fn().mockReturnValue(() => {}),
        expectMessage: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ ready: true })),
        terminate: vi.fn().mockResolvedValue(undefined),
      };
    });
  });

  afterEach(() => {
    NativeCommunicatorMock.mockReset();
  });

  it("should reach ready status without a loader when binaryPath is set", async () => {
    const adapter = new PokerAdapter(nativeConfig);
    await adapter.load();
    expect(adapter.status).toBe("ready");
  });

  it("should emit loading → ready status sequence in native mode", async () => {
    const adapter = new PokerAdapter(nativeConfig);
    const statuses: string[] = [];
    adapter.onStatusChange((s) => statuses.push(s));
    await adapter.load();
    expect(statuses).toEqual(["loading", "ready"]);
  });

  it("should set status to error when NativeCommunicator.spawn rejects", async () => {
    NativeCommunicatorMock.mockImplementation(function () {
      return {
        spawn: vi.fn().mockRejectedValue(new Error("binary not found")),
        postMessage: vi.fn(),
        onMessage: vi.fn().mockReturnValue(() => {}),
        expectMessage: vi.fn(),
        terminate: vi.fn().mockResolvedValue(undefined),
      };
    });
    const adapter = new PokerAdapter(nativeConfig);
    await expect(adapter.load()).rejects.toThrow("binary not found");
    expect(adapter.status).toBe("error");
  });
});
