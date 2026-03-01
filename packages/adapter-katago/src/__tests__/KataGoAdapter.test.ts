import { describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach, } from "vitest";
import { KataGoAdapter } from "../index.js";
import { IEngineLoader } from "@multi-game-engines/core";
import { IGoSearchOptions } from "@multi-game-engines/adapter-gtp";

class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: unknown = null;
}

describe("KataGoAdapter", () => {
  const mockLoader: Partial<IEngineLoader> = {
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
    vi.clearAllMocks();
  });

  it("should initialize with correct metadata", () => {
    const adapter = new KataGoAdapter();
    expect(adapter.id).toBe("katago");
  });

  it("should change status correctly on load with valid SRI", async () => {
    // Provide syntactically valid Base64 SRI for ALL sources to pass validation check
    const adapter = new KataGoAdapter({
      sources: {
        main: {
          url: "test.js",
          type: "worker-js",
          sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
        wasm: {
          url: "test.wasm",
          type: "wasm",
          sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
      },
    });
    await adapter.load(mockLoader as IEngineLoader);
    expect(adapter.status).toBe("ready");
  });

  it("should reject placeholder SRI hashes on load", async () => {
    const adapter = new KataGoAdapter({
      sources: {
        main: {
          url: "test.js",
          type: "worker-js",
          sri: "sha384-ThisIsAPlaceholderSRIHashThatShouldBeRejectedByValidation64Chars",
        },
      },
    });
    await expect(adapter.load(mockLoader as IEngineLoader)).rejects.toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.sriMismatch" }),
    );
    expect(adapter.status).not.toBe("ready");
  });

  it("should reject control characters in search options (injection guard)", () => {
    const adapter = new KataGoAdapter();
    const maliciousInputs = ["Q16\nquit", "Q16\0", { board: "Q16\r\nstop" }];

    for (const input of maliciousInputs) {
      expect(() =>
        adapter.parser.createSearchCommand(
          typeof input === "string"
            ? { board: input }
            : (input as unknown as IGoSearchOptions),
        ),
      ).toThrow(
        expect.objectContaining({ i18nKey: "engine.errors.injectionDetected" }),
      );
    }
  });
});
