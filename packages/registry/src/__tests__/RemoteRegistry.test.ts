import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoteRegistry } from "../index.js";

describe("RemoteRegistry", () => {
  const mockUrl = "https://example.com/engines.json";
  const mockData = {
    engines: {
      remote: {
        latest: "1.0",
        versions: {
          "1.0": {
            assets: {
              main: {
                url: "remote.js",
                sri: "sha384-remote",
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

  it("should fetch and resolve remote engines after load", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const registry = new RemoteRegistry(mockUrl);

    // Before load
    expect(registry.resolve("remote")).toBeNull();
    expect(registry.getSupportedEngines()).toEqual([]);

    await registry.load();

    expect(fetch).toHaveBeenCalledWith(mockUrl);
    expect(registry.getSupportedEngines()).toContain("remote");

    const remote = registry.resolve("remote");
    expect(remote).not.toBeNull();
    expect(remote?.["main"]?.url).toBe("remote.js");
  });

  it("should throw error if fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    } as Response);

    const registry = new RemoteRegistry(mockUrl);
    await expect(registry.load()).rejects.toThrow(/Failed to fetch/);
  });
});
