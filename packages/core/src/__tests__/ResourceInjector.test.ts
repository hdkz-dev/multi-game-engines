import { describe, it, expect, vi } from "vitest";
import { ResourceInjector } from "../workers/ResourceInjector.js";

describe("ResourceInjector", () => {
  it("should resolve paths", () => {
    // @ts-expect-error accessing private static for testing
    ResourceInjector.resources = {
      "path/to/resource.wasm": "blob:resource-url",
    };

    expect(ResourceInjector.resolve("path/to/resource.wasm")).toBe(
      "blob:resource-url",
    );
    expect(ResourceInjector.resolve("./path/to/resource.wasm")).toBe(
      "blob:resource-url",
    );
    expect(ResourceInjector.resolve("unknown/path")).toBe("unknown/path");
  });

  describe("adaptEmscriptenModule", () => {
    it("should override locateFile to use resolved Blob URLs", () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = {
        "engine.wasm": "blob:engine-url",
      };

      const moduleParams = {
        locateFile: (path: string, prefix: string) => prefix + path,
      };

      ResourceInjector.adaptEmscriptenModule(moduleParams);

      // Should use Blob URL if resolved
      expect(moduleParams.locateFile("engine.wasm", "/assets/")).toBe(
        "blob:engine-url",
      );

      // Should fallback to original logic if not resolved
      expect(moduleParams.locateFile("other.file", "/assets/")).toBe(
        "/assets/other.file",
      );
    });
  });

  describe("mountToVFS", () => {
    it("should fetch and write file to Emscripten FS", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = {
        "eval.nnue": "blob:eval-url",
      };

      const mockFS = {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
      };
      const mockModule = { FS: mockFS };

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      await ResourceInjector.mountToVFS(mockModule, "/eval.nnue", "eval.nnue");

      expect(global.fetch).toHaveBeenCalledWith("blob:eval-url");
      expect(mockFS.writeFile).toHaveBeenCalledWith(
        "/eval.nnue",
        expect.any(Uint8Array),
      );
    });

    it("should create directories if needed", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = {
        "data/config.json": "blob:config-url",
      };

      const mockFS = {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
      };
      const mockModule = { FS: mockFS };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      await ResourceInjector.mountToVFS(
        mockModule,
        "/data/config.json",
        "data/config.json",
      );

      expect(mockFS.mkdir).toHaveBeenCalledWith("/data");
      expect(mockFS.writeFile).toHaveBeenCalledWith(
        "/data/config.json",
        expect.any(Uint8Array),
      );
    });
  });
});
