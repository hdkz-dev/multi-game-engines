import { describe, it, expect, vi, afterEach } from "vitest";
import { CapabilityDetector } from "../CapabilityDetector.js";

describe("CapabilityDetector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should detect OPFS support", async () => {
    vi.stubGlobal("navigator", {
      storage: { getDirectory: () => Promise.resolve({}) },
    });
    const caps = await CapabilityDetector.detect();
    expect(caps.opfs).toBe(true);
  });

  it("should detect absence of OPFS support", async () => {
    vi.stubGlobal("navigator", {
      storage: {},
    });
    const caps = await CapabilityDetector.detect();
    expect(caps.opfs).toBe(false);
  });

  it("should detect WebNN support", async () => {
    vi.stubGlobal("navigator", {
      ml: {},
    });
    const caps = await CapabilityDetector.detect();
    expect(caps.webNN).toBe(true);
  });

  it("should detect Wasm Threads support", async () => {
    vi.stubGlobal("MessageChannel", class {});
    // WebAssembly.Memory mock
    const OriginalWasm = globalThis.WebAssembly;
    vi.stubGlobal("WebAssembly", {
      ...OriginalWasm,
      Memory: class {},
    });

    const caps = await CapabilityDetector.detect();
    expect(caps.wasmThreads).toBe(true);
  });

  it("should detect absence of Wasm Threads support when memory fails", async () => {
    vi.stubGlobal("MessageChannel", class {});
    vi.stubGlobal("WebAssembly", {
      Memory: class {
        constructor() {
          throw new Error("unsupported");
        }
      },
    });

    const caps = await CapabilityDetector.detect();
    expect(caps.wasmThreads).toBe(false);
  });
});
