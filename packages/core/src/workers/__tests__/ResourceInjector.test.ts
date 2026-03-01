import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { ResourceInjector } from "../ResourceInjector.js";

describe("ResourceInjector", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should resolve paths", () => {
    // @ts-expect-error accessing private static for testing
    ResourceInjector.resources = {
      "path/to/resource.wasm": "blob:resource-url",
    };

    expect(ResourceInjector.resolve("path/to/resource.wasm")).toBe(
      "blob:resource-url",
    );
    expect(ResourceInjector.resolve("unknown/path")).toBe("unknown/path");
  });

  it("should throw on paths with leading dot (Security Constraint)", () => {
    expect(() => ResourceInjector.resolve("./test.js")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.securityViolation" }),
    );
  });

  it("should throw on path traversal attempts", () => {
    expect(() => ResourceInjector.resolve("../secret.js")).toThrow();
    expect(() => ResourceInjector.resolve("/absolute/path")).toThrow();
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
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      await ResourceInjector.mountToVFS(mockModule, "/eval.nnue", "eval.nnue");

      expect(globalThis.fetch).toHaveBeenCalledWith("blob:eval-url");
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

      globalThis.fetch = vi.fn().mockResolvedValue({
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

    it("should handle EEXIST error during directory creation", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = { "dir/file.bin": "blob:url" };
      const mockFS = {
        mkdir: vi.fn().mockImplementation(() => {
          const err = new Error("EEXIST");
          (err as unknown as { code: string }).code = "EEXIST";
          throw err;
        }),
        writeFile: vi.fn(),
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      });

      // Should NOT throw
      await expect(
        ResourceInjector.mountToVFS(
          { FS: mockFS },
          "/dir/file.bin",
          "dir/file.bin",
        ),
      ).resolves.toBeUndefined();
    });

    it("should throw error if fetch fails", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = {
        "error.file": "blob:error-url",
      };

      const mockModule = { FS: { mkdir: vi.fn(), writeFile: vi.fn() } };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        ResourceInjector.mountToVFS(mockModule, "/error.file", "error.file"),
      ).rejects.toThrow("Failed to fetch resource: Not Found");
    });
  });
});
