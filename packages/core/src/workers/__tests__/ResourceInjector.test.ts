import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResourceInjector } from "../ResourceInjector.js";

describe("ResourceInjector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(performance, "now").mockReturnValue(0);
    // @ts-expect-error accessing private static for testing
    ResourceInjector.resources = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe("waitForReady", () => {
    it("should resolve immediately if already ready", async () => {
      // @ts-expect-error accessing private static
      ResourceInjector.isReady = true;
      await expect(ResourceInjector.waitForReady()).resolves.toBeUndefined();
      // @ts-expect-error reset
      ResourceInjector.isReady = false;
    });

    it("should wait until resources are injected via listen", async () => {
      // @ts-expect-error accessing private static
      ResourceInjector.isReady = false;
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.readyCallbacks = [];

      const readyPromise = ResourceInjector.waitForReady();

      // Manually trigger the handler (simulate MG_INJECT_RESOURCES injection)
      // @ts-expect-error accessing private static for testing
      const callbacks = [...ResourceInjector.readyCallbacks];
      callbacks.forEach((cb) => cb());

      await readyPromise;
      // @ts-expect-error reset
      ResourceInjector.isReady = false;
    });
  });

  describe("listen", () => {
    it("should process MG_INJECT_RESOURCES message and invoke callbacks", () => {
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.isReady = false;
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.resources = {};
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.readyCallbacks = [];

      const callbackFired = vi.fn();
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.readyCallbacks.push(callbackFired);

      const originalAddEventListener = globalThis.addEventListener;
      let capturedHandler: ((ev: MessageEvent) => void) | null = null;
      globalThis.addEventListener = vi.fn((type, handler) => {
        if (type === "message") {
          capturedHandler = handler as (ev: MessageEvent) => void;
        }
      }) as typeof globalThis.addEventListener;

      ResourceInjector.listen();

      // @ts-expect-error testing mock handler invocation
      capturedHandler?.({
        data: { type: "MG_INJECT_RESOURCES", resources: { "a.bin": "blob:a" } },
      } as MessageEvent);

      expect(callbackFired).toHaveBeenCalled();
      // @ts-expect-error accessing private static field for testing
      expect(ResourceInjector.isReady).toBe(true);

      globalThis.addEventListener = originalAddEventListener;
      // @ts-expect-error reset
      ResourceInjector.isReady = false;
    });

    it("should forward non-inject messages to onMessage", () => {
      const originalAddEventListener = globalThis.addEventListener;
      let capturedHandler: ((ev: MessageEvent) => void) | null = null;
      globalThis.addEventListener = vi.fn((type, handler) => {
        if (type === "message") {
          capturedHandler = handler as (ev: MessageEvent) => void;
        }
      }) as typeof globalThis.addEventListener;

      const onMessage = vi.fn();
      ResourceInjector.listen(onMessage);

      const ev = { data: { type: "OTHER", value: 42 } } as MessageEvent;
      // @ts-expect-error testing mock handler invocation
      capturedHandler?.(ev);
      expect(onMessage).toHaveBeenCalledWith(ev);

      // Non-object data should be ignored
      // @ts-expect-error testing mock handler invocation
      capturedHandler?.({ data: null } as MessageEvent);
      expect(onMessage).toHaveBeenCalledTimes(1);

      globalThis.addEventListener = originalAddEventListener;
    });

    it("should throw on invalid resources in MG_INJECT_RESOURCES", () => {
      const originalAddEventListener = globalThis.addEventListener;
      let capturedHandler: ((ev: MessageEvent) => void) | null = null;
      globalThis.addEventListener = vi.fn((type, handler) => {
        if (type === "message") {
          capturedHandler = handler as (ev: MessageEvent) => void;
        }
      }) as typeof globalThis.addEventListener;

      ResourceInjector.listen();

      expect(() => {
        capturedHandler?.({
          data: { type: "MG_INJECT_RESOURCES", resources: null },
        } as MessageEvent);
      }).toThrow();

      globalThis.addEventListener = originalAddEventListener;
    });
  });

  describe("interceptFetch", () => {
    it("should intercept fetch and resolve blob URLs", async () => {
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.resources = { "model.bin": "blob:mock" };

      const mockOriginalFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });
      globalThis.fetch = mockOriginalFetch;

      ResourceInjector.interceptFetch();

      // Call the intercepted fetch with a resolvable path
      await globalThis.fetch("model.bin");
      expect(mockOriginalFetch).toHaveBeenCalledWith("blob:mock", undefined);

      // Call with non-resolvable path (passes through)
      await globalThis.fetch("other.bin");
      expect(mockOriginalFetch).toHaveBeenCalledWith("other.bin", undefined);

      // @ts-expect-error reset
      ResourceInjector.resources = {};
    });
  });

  describe("adaptEmscriptenModule", () => {
    it("should override locateFile to resolve blob URLs", () => {
      // @ts-expect-error accessing private static field for testing
      ResourceInjector.resources = { "model.wasm": "blob:wasm" };

      const moduleParams = {
        locateFile: (path: string, prefix: string) => prefix + path,
      };
      ResourceInjector.adaptEmscriptenModule(moduleParams);

      expect(moduleParams.locateFile("model.wasm", "")).toBe("blob:wasm");
      expect(moduleParams.locateFile("other.js", "/prefix/")).toBe(
        "/prefix/other.js",
      );

      // @ts-expect-error reset
      ResourceInjector.resources = {};
    });

    it("should handle module without locateFile", () => {
      const moduleParams = {};
      ResourceInjector.adaptEmscriptenModule(moduleParams as never);
      // @ts-expect-error accessing private static field for testing
      expect(typeof moduleParams.locateFile).toBe("function");
    });

    it("should do nothing if moduleParams is falsy", () => {
      expect(() =>
        ResourceInjector.adaptEmscriptenModule(null as never),
      ).not.toThrow();
    });
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

    it("should throw if resource is not found in registry (non-blob)", async () => {
      const mockFS = { mkdir: vi.fn(), writeFile: vi.fn() };
      await expect(
        ResourceInjector.mountToVFS({ FS: mockFS }, "/path", "unknown.bin"),
      ).rejects.toThrow("Resource not found or invalid scheme in registry");
    });

    it("should throw if resource registry entry points to external URL", async () => {
      // @ts-expect-error accessing private static for testing
      ResourceInjector.resources = { "evil.js": "https://evil.com/script.js" };
      const mockFS = { mkdir: vi.fn(), writeFile: vi.fn() };
      await expect(
        ResourceInjector.mountToVFS({ FS: mockFS }, "/evil.js", "evil.js"),
      ).rejects.toThrow("Resource not found or invalid scheme in registry");
    });

    it("should throw if module or FS is missing", async () => {
      await expect(
        ResourceInjector.mountToVFS({} as never, "/path", "file.bin"),
      ).rejects.toThrow();
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
