import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RemoteRegistry } from "../index.js";

describe("RemoteRegistry", () => {
  const mockUrl = "https://example.com/engines.json";
  const mockData = {
    version: "1.0.0",
    engines: {
      remote: {
        name: "Remote Engine",
        adapter: "uci",
        latest: "1.0",
        versions: {
          "1.0": {
            assets: {
              main: {
                url: "https://example.com/remote.js",
                sri: "sha384-bCh+jjHqO5/k1PVx7yJktl7cuplMcT1TDIfN7BbAjNTZHu9wDlApzTehK3HzbfR8",
                type: "worker-js",
              },
            },
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch and resolve remote engines after load", async () => {
    const encodedData = new TextEncoder().encode(JSON.stringify(mockData));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encodedData.buffer,
    } as Response);

    const registry = new RemoteRegistry(mockUrl);

    // Before load
    expect(registry.resolve("remote")).toBeNull();
    expect(registry.getSupportedEngines()).toEqual([]);

    await registry.load();

    expect(fetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(registry.getSupportedEngines()).toContain("remote");

    const remote = registry.resolve("remote");
    expect(remote).not.toBeNull();
    expect(remote?.["main"]?.url).toBe("https://example.com/remote.js");
  });

  it("should verify SRI hash if provided", async () => {
    const encodedData = new TextEncoder().encode(JSON.stringify(mockData));
    // SHA-384 hash of the mockData JSON string (approximate for test)
    const hashBuffer = await crypto.subtle.digest("SHA-384", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSri = "sha384-" + btoa(String.fromCharCode(...hashArray));

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encodedData.buffer,
    } as Response);

    const registry = new RemoteRegistry(mockUrl, expectedSri);
    await registry.load();
    expect(registry.isLoaded).toBe(true);

    // Mismatch case
    const wrongSri = "sha384-wronghash";
    const invalidRegistry = new RemoteRegistry(mockUrl, wrongSri);
    await expect(invalidRegistry.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "registry.sriMismatch" }),
    );
  });

  it("should throw error if fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    } as Response);

    const registry = new RemoteRegistry(mockUrl);
    await expect(registry.load()).rejects.toThrow(
      expect.objectContaining({ i18nKey: "registry.fetchFailed" }),
    );
  });

  it("should throw timeout error on AbortError", async () => {
    const abortError = new DOMException(
      "The operation was aborted",
      "AbortError",
    );
    vi.mocked(fetch).mockRejectedValue(abortError);

    const registry = new RemoteRegistry(mockUrl);
    await expect(registry.load()).rejects.toThrow(
      expect.objectContaining({ code: "NETWORK_ERROR" }),
    );
  });

  it("should re-throw non-AbortError errors directly", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.mocked(fetch).mockRejectedValue(networkError);

    const registry = new RemoteRegistry(mockUrl);
    await expect(registry.load()).rejects.toThrow("Failed to fetch");
  });

  it("should reject remote manifest with invalid schema", async () => {
    const invalidData = { version: "1.0.0", engines: { bad: { name: 123 } } };
    const encodedData = new TextEncoder().encode(JSON.stringify(invalidData));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encodedData.buffer,
    } as Response);

    const registry = new RemoteRegistry(mockUrl);
    await expect(registry.load()).rejects.toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  it("should share loading promise for concurrent load calls", async () => {
    const encodedData = new TextEncoder().encode(JSON.stringify(mockData));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encodedData.buffer,
    } as Response);

    const registry = new RemoteRegistry(mockUrl);
    const p1 = registry.load();
    const p2 = registry.load();

    await Promise.all([p1, p2]);
    // fetch should only be called once
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(registry.isLoaded).toBe(true);
  });

  it("should skip load if already loaded", async () => {
    const encodedData = new TextEncoder().encode(JSON.stringify(mockData));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encodedData.buffer,
    } as Response);

    const registry = new RemoteRegistry(mockUrl);
    await registry.load();
    expect(registry.isLoaded).toBe(true);

    // Second load should be a no-op
    await registry.load();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
