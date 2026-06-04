import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { FairyStockfishAdapter } from "../FairyStockfishAdapter.js";
import { createFairyStockfishEngine } from "../index.js";
import type { IEngineLoader } from "@multi-game-engines/core";

describe("FairyStockfishAdapter", () => {
  let mockLoader: IEngineLoader;
  const mockConfig = {
    sources: {
      main: {
        url: "stockfish.js",
        __unsafeNoSRI: true as const,
        type: "worker-js" as const,
      },
    },
  };

  beforeAll(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockReturnValue(undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoader = {
      loadResource: vi.fn().mockResolvedValue("blob:mock"),
      loadResources: vi.fn().mockResolvedValue({ main: "blob:mock" }),
      revoke: vi.fn(),
      revokeAll: vi.fn(),
      revokeByEngineId: vi.fn(),
    };
  });

  it("initializes with Fairy-Stockfish metadata", () => {
    const adapter = new FairyStockfishAdapter(mockConfig);
    expect(adapter.id).toBe("fairy-stockfish");
  });

  it("creates an engine facade through the factory", () => {
    const engine = createFairyStockfishEngine({
      sources: mockConfig.sources,
    });
    expect(engine).toBeDefined();
  });

  it("reaches ready status on UCI handshake", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        onmessage: ((ev: { data: unknown }) => void) | null = null;
        postMessage(msg: unknown) {
          const onmessage = this.onmessage;
          queueMicrotask(() => {
            if (msg === "uci") {
              onmessage?.({ data: "uciok" });
            } else if (msg === "isready") {
              onmessage?.({ data: "readyok" });
            }
          });
        }
        terminate() {}
      },
    );

    const adapter = new FairyStockfishAdapter(mockConfig);
    await adapter.load(mockLoader);
    expect(adapter.status).toBe("ready");
  });
});
