import { describe, it, expect, vi, afterEach } from "vitest";
import { HardwareAccelerator } from "../HardwareAccelerator.js";

describe("HardwareAccelerator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should detect WebGPU correctly", async () => {
    // Mock WebGPU
    vi.stubGlobal("navigator", {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({}),
      },
    });

    expect(await HardwareAccelerator.checkWebGPU()).toBe(true);

    // Mock missing WebGPU
    vi.stubGlobal("navigator", {});
    expect(await HardwareAccelerator.checkWebGPU()).toBe(false);
  });

  it("should detect WebNN correctly", async () => {
    vi.stubGlobal("navigator", { ml: {} });
    expect(await HardwareAccelerator.checkWebNN()).toBe(true);

    vi.stubGlobal("navigator", {});
    expect(await HardwareAccelerator.checkWebNN()).toBe(false);
  });

  it("should recommend the best acceleration", async () => {
    vi.stubGlobal("navigator", { ml: {} });
    expect(await HardwareAccelerator.getBestAcceleration()).toBe("webnn");

    vi.stubGlobal("navigator", {
      gpu: { requestAdapter: vi.fn().mockResolvedValue({}) },
    });
    expect(await HardwareAccelerator.getBestAcceleration()).toBe("webgpu");

    vi.stubGlobal("navigator", {});
    expect(await HardwareAccelerator.getBestAcceleration()).toBe("none");
  });

  it("should handle WebGPU error gracefully", async () => {
    vi.stubGlobal("navigator", {
      gpu: {
        requestAdapter: vi.fn().mockRejectedValue(new Error("GPU error")),
      },
    });
    expect(await HardwareAccelerator.checkWebGPU()).toBe(false);
  });
});
