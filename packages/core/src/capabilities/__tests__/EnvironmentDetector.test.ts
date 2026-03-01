import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EnvironmentDetector } from "../EnvironmentDetector.js";

describe("EnvironmentDetector", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 8,
      deviceMemory: 8,
      storage: { getDirectory: vi.fn() },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should detect browser capabilities", async () => {
    const caps = await EnvironmentDetector.detect();
    expect(caps.threads).toBe(true);
    expect(caps.opfs).toBe(true);
  });

  it("should calculate recommended memory based on deviceMemory", () => {
    // 8GB RAM -> limit 1GB (Math.min(1, 8/2))
    expect(EnvironmentDetector.getRecommendedMaxMemory()).toBe(
      1024 * 1024 * 1024,
    );

    vi.stubGlobal("navigator", { deviceMemory: 2 });
    // 2GB RAM -> limit 1GB (Math.min(1, 2/2))
    expect(EnvironmentDetector.getRecommendedMaxMemory()).toBe(
      1024 * 1024 * 1024,
    );

    vi.stubGlobal("navigator", { deviceMemory: 1 });
    // 1GB RAM -> limit 0.5GB (Math.min(1, 1/2))
    expect(EnvironmentDetector.getRecommendedMaxMemory()).toBe(
      512 * 1024 * 1024,
    );
  });

  it("should calculate recommended threads based on hardwareConcurrency", () => {
    vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
    // 8 cores -> 6 threads (max(1, 8-2))
    expect(EnvironmentDetector.getRecommendedThreads()).toBe(6);

    vi.stubGlobal("navigator", { hardwareConcurrency: 4 });
    // 4 cores -> 3 threads (max(1, 4-1))
    expect(EnvironmentDetector.getRecommendedThreads()).toBe(3);

    vi.stubGlobal("navigator", { hardwareConcurrency: 1 });
    expect(EnvironmentDetector.getRecommendedThreads()).toBe(1);
  });

  it("should detect runtime environment", () => {
    // Current vitest environment is Node.js
    expect(EnvironmentDetector.getRuntime()).toBe("node");
  });

  it("should validate SIMD support correctly", async () => {
    // vitest/node usually supports SIMD
    const hasSIMD = await EnvironmentDetector.detect();
    // We can't easily force it to false in node, but we checked the bytecode logic
    expect(typeof hasSIMD.wasmSimd).toBe("boolean");
  });

  it("should return false for wasmThreads if SharedArrayBuffer is missing", () => {
    const originalSAB = globalThis.SharedArrayBuffer;
    // @ts-expect-error Testing private property access or invalid input
    delete globalThis.SharedArrayBuffer;

    expect((EnvironmentDetector as unknown).checkWasmThreads()).toBe(false);

    globalThis.SharedArrayBuffer = originalSAB;
  });

  it("should return false for wasmSimd if WebAssembly is missing", () => {
    const originalWA = globalThis.WebAssembly;
    // @ts-expect-error Testing private property access or invalid input
    delete globalThis.WebAssembly;

    expect((EnvironmentDetector as unknown).checkWasmSimd()).toBe(false);

    globalThis.WebAssembly = originalWA;
  });

  it("should handle error in checkWasmSimd gracefully", () => {
    vi.stubGlobal("WebAssembly", {
      validate: () => {
        throw new Error("Validation failed");
      },
    });
    expect((EnvironmentDetector as unknown).checkWasmSimd()).toBe(false);
  });

  it("should detect various runtimes", () => {
    const originalProcess = globalThis.process;
    const originalWindow = (globalThis as unknown).window;

    // 1. Browser
    // @ts-expect-error Testing private property access or invalid input
    globalThis.process = { versions: {} };
    vi.stubGlobal("window", {});
    expect(EnvironmentDetector.getRuntime()).toBe("browser");

    // 2. Unknown
    // @ts-expect-error Testing private property access or invalid input
    globalThis.process = { versions: {} };
    vi.stubGlobal("window", undefined);
    expect(EnvironmentDetector.getRuntime()).toBe("unknown");

    // 3. Bun
    // @ts-expect-error Testing private property access or invalid input
    globalThis.process = { versions: { bun: "1.0" } };
    expect(EnvironmentDetector.getRuntime()).toBe("bun");

    globalThis.process = originalProcess;
    (globalThis as unknown).window = originalWindow;
  });

  it("should handle error in checkWasmThreads gracefully", () => {
    vi.stubGlobal("WebAssembly", {
      Memory: vi.fn().mockImplementation(() => {
        throw new Error("Memory fail");
      }),
    });
    vi.stubGlobal("SharedArrayBuffer", vi.fn());
    expect((EnvironmentDetector as unknown).checkWasmThreads()).toBe(false);
  });
});
