import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResourceInjector } from "../ResourceInjector.js";

describe("ResourceInjector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error accessing private static for testing
    ResourceInjector.resources = {};
  });

  it("should resolve relative paths within trust boundary", () => {
    // @ts-expect-error accessing private static for testing
    ResourceInjector.resources = { "dir/file.bin": "blob:url" };
    expect(ResourceInjector.resolve("dir/file.bin")).toBe("blob:url");
  });

  it("should throw on path traversal attempts", () => {
    expect(() => ResourceInjector.resolve("../secret.js")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.securityViolation" }),
    );
    expect(() => ResourceInjector.resolve("/absolute/path")).toThrow(
      expect.objectContaining({ i18nKey: "engine.errors.securityViolation" }),
    );
  });

  it("should detect traversal payloads discovered via recursive object traversal", () => {
    const payload = {
      safe: "ok/file.bin",
      nested: {
        level1: {
          level2: "../secret.js",
        },
      },
    };

    const collectStrings = (value: unknown): string[] => {
      if (typeof value === "string") return [value];
      if (value && typeof value === "object") {
        return Object.values(value as Record<string, unknown>).flatMap(
          collectStrings,
        );
      }
      return [];
    };

    for (const path of collectStrings(payload)) {
      if (path.includes("../") || path.startsWith("/")) {
        expect(() => ResourceInjector.resolve(path)).toThrow(
          expect.objectContaining({
            i18nKey: "engine.errors.securityViolation",
          }),
        );
      }
    }
  });

  describe("mountToVFS", () => {
    it("should fetch resource and write to FS", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = { "dir/file.bin": "blob:url" };
      const mockFS = {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
      };
      const mockModule = { FS: mockFS };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      });

      await ResourceInjector.mountToVFS(
        mockModule,
        "/dir/file.bin",
        "dir/file.bin",
      );

      expect(mockFS.mkdir).toHaveBeenCalledWith("/dir");
      expect(mockFS.writeFile).toHaveBeenCalledWith(
        "/dir/file.bin",
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

      expect(mockFS.writeFile).toHaveBeenCalledWith(
        "/dir/file.bin",
        expect.any(Uint8Array),
      );
    });

    it("should throw if resource is not found in registry", async () => {
      const mockFS = { mkdir: vi.fn(), writeFile: vi.fn() };
      await expect(
        ResourceInjector.mountToVFS({ FS: mockFS }, "/path", "unknown.bin"),
      ).rejects.toThrow("Resource unknown.bin not found in registry");
    });

    it("should throw if fetch fails", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = { "error.file": "blob:url" };
      const mockFS = {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
      };
      const mockModule = { FS: mockFS };

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
