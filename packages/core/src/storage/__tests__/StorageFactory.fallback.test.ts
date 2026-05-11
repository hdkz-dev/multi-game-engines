import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ICapabilities } from "../../types.js";

/**
 * Covers the MemoryStorage fallback when `new IndexedDBStorage()` throws
 * inside `createFileStorage` (storage/index.ts line 32).
 *
 * The real IndexedDBStorage constructor never throws, so this path is only
 * reachable by mocking the IDB module to throw at construction time.
 */
vi.mock("../IndexedDBStorage.js", () => {
  class ThrowingIDB {
    constructor() {
      throw new Error("IndexedDB unavailable");
    }
  }
  return { IndexedDBStorage: ThrowingIDB };
});

describe("createFileStorage: IndexedDBStorage ctor failure", () => {
  let originalProcess: NodeJS.Process;

  beforeEach(() => {
    originalProcess = global.process;
    // Force the browser branch (no Node/Bun versions).
    Object.defineProperty(global, "process", {
      value: { versions: {} },
      writable: true,
    });
  });

  afterEach(() => {
    global.process = originalProcess;
  });

  it("falls back to MemoryStorage when IndexedDBStorage constructor throws", async () => {
    const { createFileStorage, MemoryStorage } = await import("../index.js");

    const caps: ICapabilities = {
      opfs: false,
      wasmThreads: false,
      wasmSimd: false,
      webNN: false,
      webGPU: false,
      webTransport: false,
    };

    const storage = createFileStorage(caps);
    expect(storage).toBeInstanceOf(MemoryStorage);
  });
});
