import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EngineLoader } from "../EngineLoader.js";
import { EngineErrorCode } from "../../types.js";

describe("EngineLoader Security", () => {
  let loader: EngineLoader;
  beforeEach(() => {
    loader = new EngineLoader();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(new Uint8Array([1]))),
    );
  });
  afterEach(() => {
    loader.revokeAll();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([
    "https://example.com/e.js",
    "http://localhost/e.js",
    "http://127.0.0.1/e.js",
    "http://[::1]/e.js",
    "http://dashboard.localhost/e.js",
  ])(
    "allows secure or loopback URL %s with SRI through the public API",
    async (url) => {
      await expect(
        loader.loadResource("test-engine", {
          url,
          type: "worker-js",
          sri: "sha256-abc",
        }),
      ).resolves.toMatch(/^blob:/);
      expect(fetch).toHaveBeenCalledOnce();
    },
  );

  it("rejects remote HTTP before fetching", async () => {
    await expect(
      loader.loadResource("test-engine", {
        url: "http://malicious.com/worker.js",
        type: "worker-js",
        sri: "sha256-abc",
      }),
    ).rejects.toMatchObject({
      code: EngineErrorCode.SECURITY_ERROR,
      message: expect.stringContaining("Insecure connection (HTTP)"),
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects empty SRI before fetching", async () => {
    await expect(
      loader.loadResource("test-engine", {
        url: "https://example.com/worker.js",
        type: "worker-js",
        sri: "",
      }),
    ).rejects.toMatchObject({
      code: EngineErrorCode.SECURITY_ERROR,
      message: expect.stringContaining("SRI hash is required"),
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects the unsafe SRI flag in production through the public API", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      loader.loadResource("test-engine", {
        url: "https://example.com/worker.js",
        type: "worker-js",
        __unsafeNoSRI: true,
      }),
    ).rejects.toMatchObject({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "SRI bypass (__unsafeNoSRI) is not allowed in production.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reports network failures and permits a subsequent retry", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("network failed"));
    const config = {
      url: "https://example.com/worker.js",
      type: "worker-js" as const,
      sri: "sha256-abc",
    };
    await expect(
      loader.loadResource("test-engine", config),
    ).rejects.toMatchObject({ code: EngineErrorCode.NETWORK_ERROR });
    await expect(loader.loadResource("test-engine", config)).resolves.toMatch(
      /^blob:/,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
