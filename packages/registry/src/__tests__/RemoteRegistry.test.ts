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
});
