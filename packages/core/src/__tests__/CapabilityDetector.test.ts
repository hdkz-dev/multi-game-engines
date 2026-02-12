import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CapabilityDetector } from "../capabilities/CapabilityDetector";

describe("CapabilityDetector", () => {
  beforeEach(() => {
    // 各テストの前にモックをリセットし、最新の Web API を備えた環境をシミュレート
    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn().mockResolvedValue({}),
      },
      ml: {}, // WebNN
      gpu: {}, // WebGPU
    });
    vi.stubGlobal("SharedArrayBuffer", {});
    vi.stubGlobal("WebTransport", {});
    vi.stubGlobal("WebAssembly", {
      validate: vi.fn().mockReturnValue(true),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should detect capabilities correctly in a modern browser environment", async () => {
    const caps = await CapabilityDetector.detect();
    
    expect(caps.opfs).toBe(true);
    expect(caps.wasmThreads).toBe(true);
    expect(caps.wasmSimd).toBe(true);
    expect(caps.webNN).toBe(true);
    expect(caps.webGPU).toBe(true);
    expect(caps.webTransport).toBe(true);
  });

  it("should report missing capabilities in a restricted environment", async () => {
    // 一部の API を未定義にして制限環境をシミュレート
    vi.stubGlobal("navigator", {}); 
    vi.stubGlobal("SharedArrayBuffer", undefined);
    
    const caps = await CapabilityDetector.detect();
    
    expect(caps.opfs).toBe(false);
    expect(caps.wasmThreads).toBe(false);
    expect(caps.details?.opfs).toBeDefined();
  });

  it("should handle Node.js-like environment where navigator is undefined", async () => {
    // Node.js 環境をシミュレート
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("SharedArrayBuffer", undefined);
    vi.stubGlobal("WebTransport", undefined);

    const caps = await CapabilityDetector.detect();

    expect(caps.opfs).toBe(false);
    expect(caps.wasmThreads).toBe(false);
    expect(caps.webNN).toBe(false);
    expect(caps.webGPU).toBe(false);
    expect(caps.details?.opfs).toBeDefined();
  });
});
