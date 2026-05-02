/**
 * Unit tests for createKataGoEngine factory.
 *
 * onnxruntime-web is mocked so no real model is loaded.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createKataGoEngine } from "../index.js";

const mockSession = {
  run: vi.fn().mockResolvedValue({
    policy: { data: new Float32Array(19 * 19 + 1).fill(0.1) },
  }),
  release: vi.fn().mockResolvedValue(undefined),
};

vi.mock("onnxruntime-web", () => ({
  InferenceSession: { create: vi.fn().mockResolvedValue(mockSession) },
  Tensor: class {
    constructor(
      _t: string,
      public data: Float32Array,
      _s: number[],
    ) {}
  },
}));

describe("createKataGoEngine", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return an engine instance with the expected interface", () => {
    const engine = createKataGoEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.load).toBe("function");
    expect(typeof engine.onInfo).toBe("function");
    expect(typeof engine.onSearchResult).toBe("function");
  });

  it("should return an engine with id 'katago'", () => {
    const engine = createKataGoEngine();
    expect(engine.id).toBe("katago");
  });

  it("should accept a custom config and return an engine", () => {
    const engine = createKataGoEngine({ version: "1.14" });
    expect(engine).toBeDefined();
    expect(engine.id).toBe("katago");
  });

  it("should not require OfficialRegistry — no registry dependency", () => {
    // createKataGoEngine() must not throw even without registry configured.
    expect(() => createKataGoEngine()).not.toThrow();
  });

  it("should pass custom model URL to adapter via config.sources", async () => {
    const { InferenceSession } = await import("onnxruntime-web");
    const engine = createKataGoEngine({
      sources: {
        main: { url: "https://example.com/custom.onnx" } as never,
      },
    });
    await engine.load();
    expect(InferenceSession.create).toHaveBeenCalledWith(
      "https://example.com/custom.onnx",
      expect.any(Object),
    );
  });
});
