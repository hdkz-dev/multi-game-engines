import { createServer } from "node:http";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ChunkedDownloader,
  ChunkedDownloadError,
  type ChunkedDownloadOptions,
} from "../ChunkedDownloader.js";
import { EngineError } from "../../errors/EngineError.js";
import { EngineErrorCode, IFileStorage, ILoadProgress } from "../../types.js";

const nativeFetch = globalThis.fetch;
const nativeCrypto = globalThis.crypto;

const VALID_SHA256_SRI = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // will be mocked
const INVALID_SRI = "sha256-INVALID_HASH_VALUE==============================";

function makeBuffer(size: number): ArrayBuffer {
  return new Uint8Array(size).fill(171).buffer;
}

function makeFetchMock(options: {
  headAcceptRanges?: boolean;
  contentLength?: number;
  status?: number;
  chunks?: ArrayBuffer[];
  singleBuffer?: ArrayBuffer;
}) {
  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();

    if (method === "HEAD") {
      const headers = new Map<string, string>();
      if (options.headAcceptRanges) headers.set("accept-ranges", "bytes");
      if (options.contentLength !== undefined)
        headers.set("content-length", String(options.contentLength));
      return {
        ok: true,
        status: 200,
        headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
      };
    }

    // Range リクエスト
    const rangeHeader = (init?.headers as Record<string, string> | undefined)?.[
      "Range"
    ];
    if (rangeHeader && options.chunks) {
      const match = /bytes=(\d+)-(\d+)/.exec(rangeHeader);
      const start = match ? parseInt(match[1]!, 10) : 0;
      const chunkIdx = Math.floor(
        start / (options.contentLength! / options.chunks.length),
      );
      const chunk =
        options.chunks[Math.min(chunkIdx, options.chunks.length - 1)];
      return {
        ok: true,
        status: options.status ?? 206,
        headers: {
          get: (key: string) =>
            key === "content-range"
              ? `bytes ${start}-${match?.[2]}/${options.contentLength}`
              : null,
        },
        arrayBuffer: async () => chunk ?? makeBuffer(0),
      };
    }

    // 通常 GET
    return {
      ok: (options.status ?? 200) < 400,
      status: options.status ?? 200,
      headers: { get: () => null },
      arrayBuffer: async () => options.singleBuffer ?? makeBuffer(8),
    };
  });
}

describe("ChunkedDownloader", () => {
  let downloader: ChunkedDownloader;
  let storage: IFileStorage;
  function downloadVerified(
    url: string,
    options: Partial<ChunkedDownloadOptions> = {},
  ) {
    return downloader.download(url, { sri: VALID_SHA256_SRI, ...options });
  }

  beforeEach(() => {
    downloader = new ChunkedDownloader();
    storage = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    // crypto.subtle.digest をスタブ化 — 常に固定値を返す
    vi.stubGlobal("crypto", {
      subtle: {
        digest: vi.fn().mockResolvedValue(
          // base64 が AAAA... になる 32 byte のゼロ配列
          new Uint8Array(32).buffer,
        ),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ---- キャッシュヒット ----

  it("returns cached buffer without fetching", async () => {
    const cached = makeBuffer(100);
    vi.mocked(storage.get).mockResolvedValueOnce(cached);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadVerified("https://example.com/file.wasm", {
      sri: VALID_SHA256_SRI,
      storage,
    });

    expect(result.fromCache).toBe(true);
    expect(result.transferredBytes).toBe(0);
    expect(result.buffer).toBe(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emits completed progress on cache hit", async () => {
    const cached = makeBuffer(1024);
    vi.mocked(storage.get).mockResolvedValueOnce(cached);
    vi.stubGlobal("fetch", vi.fn());

    const events: ILoadProgress[] = [];
    await downloadVerified("https://example.com/file.wasm", {
      sri: VALID_SHA256_SRI,
      storage,
      onProgress: (p) => events.push(p),
    });

    expect(events).toHaveLength(1);
    expect(events[0]!.status).toBe("completed");
    expect(events[0]!.percentage).toBe(100);
  });

  // ---- チャンクダウンロード ----

  it("downloads in chunks when server supports Range requests", async () => {
    const chunk1 = makeBuffer(4);
    const chunk2 = makeBuffer(4);
    const fetchMock = makeFetchMock({
      headAcceptRanges: true,
      contentLength: 8,
      chunks: [chunk1, chunk2],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadVerified("https://cdn.example.com/big.wasm", {
      chunkSize: 4,
    });

    expect(result.fromCache).toBe(false);
    expect(result.buffer.byteLength).toBe(8);
    // HEAD + chunk1 + chunk2 = 3 回の fetch
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("reports progress events during chunked download", async () => {
    const fetchMock = makeFetchMock({
      headAcceptRanges: true,
      contentLength: 8,
      chunks: [makeBuffer(4), makeBuffer(4)],
    });
    vi.stubGlobal("fetch", fetchMock);

    const events: ILoadProgress[] = [];
    await downloadVerified("https://cdn.example.com/big.wasm", {
      chunkSize: 4,
      onProgress: (p) => events.push(p),
    });

    // 開始イベント + chunk1 後 + chunk2 後 (completed)
    expect(events.length).toBeGreaterThanOrEqual(2);
    const last = events[events.length - 1]!;
    expect(last.status).toBe("completed");
    expect(last.percentage).toBe(100);
  });

  // ---- フォールバック (Range 非対応) ----

  it("falls back to single fetch when server does not accept ranges", async () => {
    const singleBuffer = makeBuffer(16);
    const fetchMock = makeFetchMock({
      headAcceptRanges: false,
      singleBuffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadVerified("https://example.com/file.wasm");

    expect(result.fromCache).toBe(false);
    expect(result.buffer.byteLength).toBe(16);
    // HEAD + 1 回の GET = 2 回
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to single fetch when file is smaller than chunkSize", async () => {
    const fetchMock = makeFetchMock({
      headAcceptRanges: true,
      contentLength: 4, // chunkSize(4MB) より小さい
      singleBuffer: makeBuffer(4),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadVerified("https://example.com/small.wasm");
    expect(result.buffer.byteLength).toBe(4);
  });

  // ---- SRI 検証 ----

  it("passes SRI verification when digest matches", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);
    // crypto.subtle.digest が 32 byte 0 → base64 = "AAAA..."
    const validSri = `sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;

    await expect(
      downloadVerified("https://example.com/file.wasm", { sri: validSri }),
    ).resolves.toBeDefined();
  });

  it("throws ChunkedDownloadError on SRI mismatch", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadVerified("https://example.com/file.wasm", {
        sri: INVALID_SRI,
      }),
    ).rejects.toBeInstanceOf(ChunkedDownloadError);
  });

  it("throws ChunkedDownloadError on HTTP error", async () => {
    const fetchMock = makeFetchMock({
      status: 404,
      singleBuffer: makeBuffer(0),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadVerified("https://example.com/missing.wasm"),
    ).rejects.toBeInstanceOf(ChunkedDownloadError);
  });

  // ---- キャッシュ書き込み ----

  it("writes downloaded buffer to storage after successful download", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    const sri = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    await downloadVerified("https://cdn.example.com/engine.wasm", {
      sri,
      storage,
    });

    expect(storage.set).toHaveBeenCalledOnce();
    const [key] = vi.mocked(storage.set).mock.calls[0]!;
    expect(key).toContain("chunked:");
  });

  // ---- cacheKey ----

  it("generates deterministic cache keys", async () => {
    const url = "https://cdn.example.com/engine.wasm";
    const sri = "sha384-abc123def456";
    const key1 = await downloader.cacheKey(url, sri);
    const key2 = await downloader.cacheKey(url, sri);
    expect(key1).toBe(key2);
    expect(key1).toContain("chunked:");
  });

  // ---- error paths ----

  it("treats storage.get rejection as a cache miss and proceeds with fetch", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    const failingStorage: IFileStorage = {
      get: vi.fn().mockRejectedValue(new Error("storage offline")),
      set: vi.fn().mockResolvedValue(undefined),
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    const result = await downloadVerified(
      "https://cdn.example.com/engine.wasm",
      {
        sri: "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        storage: failingStorage,
      },
    );

    expect(result.fromCache).toBe(false);
    expect(failingStorage.get).toHaveBeenCalled();
  });

  it("rejects with ChunkedDownloadError on malformed SRI format", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadVerified("https://cdn.example.com/engine.wasm", {
        sri: "md5-not-a-valid-sri-prefix",
      }),
    ).rejects.toThrow(/Invalid SRI format/);
  });

  it("falls back to single fetch when HEAD request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (_url: string, init?: RequestInit) => {
        const method = (init?.method ?? "GET").toUpperCase();
        if (method === "HEAD") {
          throw new Error("HEAD blocked by CORS");
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          arrayBuffer: async () => makeBuffer(8),
        };
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadVerified(
      "https://cdn.example.com/engine.wasm",
      { sri: "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" },
    );
    expect(result.transferredBytes).toBeGreaterThan(0);
  });

  it("throws ChunkedDownloadError when a Range chunk returns HTTP error", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (_url: string, init?: RequestInit) => {
        const method = (init?.method ?? "GET").toUpperCase();
        if (method === "HEAD") {
          const headers = new Map<string, string>([
            ["accept-ranges", "bytes"],
            ["content-length", "8"],
          ]);
          return {
            ok: true,
            status: 200,
            headers: {
              get: (k: string) => headers.get(k.toLowerCase()) ?? null,
            },
          };
        }
        // First Range request fails mid-stream
        return {
          ok: false,
          status: 503,
          headers: { get: () => null },
          arrayBuffer: async () => makeBuffer(0),
        };
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadVerified("https://cdn.example.com/big.wasm", { chunkSize: 4 }),
    ).rejects.toBeInstanceOf(ChunkedDownloadError);
  });

  it("verifies each chunk against segmentedSri hashes during chunked download", async () => {
    const chunk1 = makeBuffer(4);
    const chunk2 = makeBuffer(4);
    const fetchMock = makeFetchMock({
      headAcceptRanges: true,
      contentLength: 8,
      chunks: [chunk1, chunk2],
    });
    vi.stubGlobal("fetch", fetchMock);
    // crypto.subtle.digest is stubbed to 32 bytes of zeros → base64 "AAAA..."
    const segmentHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    const digestSpy = vi.mocked(
      (
        globalThis as unknown as {
          crypto: { subtle: { digest: ReturnType<typeof vi.fn> } };
        }
      ).crypto.subtle.digest,
    );

    const result = await downloadVerified("https://cdn.example.com/big.wasm", {
      chunkSize: 4,
      segmentedSri: { segmentSize: 4, hashes: [segmentHash, segmentHash] },
    });

    expect(result.buffer.byteLength).toBe(8);
    // 2 chunks => 2 verify calls (per-segment)
    expect(digestSpy).toHaveBeenCalledTimes(3);
  });
  it.each([
    "http://example.com/engine.wasm",
    "http://localhost.example.com/engine.wasm",
    "ftp://example.com/engine.wasm",
    "https://user:password@example.com/engine.wasm",
    "not-a-url",
    "https://exam\nple.com/engine.wasm",
    "https://example.com/engine\t.wasm",
  ])("rejects unsafe URL %s before cache or network access", async (url) => {
    vi.mocked(storage.get).mockResolvedValue(makeBuffer(4));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloadVerified(url, { storage, sri: VALID_SHA256_SRI }),
    ).rejects.toMatchObject({ code: EngineErrorCode.SECURITY_ERROR });
    expect(storage.get).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("omits credentials and rejects redirects in every Range request", async () => {
    const fetchMock = makeFetchMock({
      headAcceptRanges: true,
      contentLength: 8,
      chunks: [makeBuffer(4), makeBuffer(4)],
    });
    vi.stubGlobal("fetch", fetchMock);
    await downloadVerified("http://dashboard.localhost/engine.wasm", {
      chunkSize: 4,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toMatchObject({ credentials: "omit", redirect: "error" });
    }
  });

  it("omits credentials and rejects redirects in fallback GET", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(4) });
    vi.stubGlobal("fetch", fetchMock);
    await downloadVerified("https://example.com/engine.wasm");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://example.com/engine.wasm",
      expect.objectContaining({ credentials: "omit", redirect: "error" }),
    );
  });

  it("does not fall back after a HEAD security refusal", async () => {
    const error = new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: "refused",
    });
    const fetchMock = vi.fn().mockRejectedValue(error);
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloadVerified("https://example.com/engine.wasm"),
    ).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not fetch when already aborted, even on a cache hit", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloadVerified("https://example.com/engine.wasm", {
        signal: controller.signal,
        storage,
        sri: VALID_SHA256_SRI,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(storage.get).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fall back after HEAD aborts", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(() => {
      controller.abort();
      throw controller.signal.reason;
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloadVerified("https://example.com/engine.wasm", {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("never follows an actual HTTP redirect, including HEAD fallback", async () => {
    let targetRequests = 0;
    const server = createServer((request, response) => {
      if (request.url === "/target") {
        targetRequests++;
        response.end("unexpected");
      } else {
        response.writeHead(302, { Location: "/target" });
        response.end();
      }
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    try {
      const address = server.address();
      if (!address || typeof address === "string")
        throw new Error("Missing server address");
      vi.stubGlobal("fetch", nativeFetch);
      await expect(
        downloadVerified(`http://127.0.0.1:${address.port}/redirect`),
      ).rejects.toThrow();
      expect(targetRequests).toBe(0);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        }),
      );
    }
  });
  it("requires SRI before accessing cache or network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloader.download("https://example.com/file", { sri: "", storage }),
    ).rejects.toMatchObject({ code: EngineErrorCode.SECURITY_ERROR });
    expect(storage.get).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid chunk and response limits %s before fetching",
    async (size) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      await expect(
        downloadVerified("https://example.com/file", { chunkSize: size }),
      ).rejects.toThrow("Invalid download size limit");
      await expect(
        downloadVerified("https://example.com/file", { maxBytes: size }),
      ).rejects.toThrow("Invalid download size limit");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    { segmentSize: 4, hashes: [] },
    { segmentSize: 4, hashes: ["invalid"] },
    { segmentSize: 8, hashes: [VALID_SHA256_SRI] },
  ])(
    "rejects invalid segment configuration before fetching",
    async (segmentedSri) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      await expect(
        downloadVerified("https://example.com/file", {
          chunkSize: 4,
          segmentedSri,
        }),
      ).rejects.toThrow("Invalid segmented SRI");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects corrupt cached data without completing or fetching", async () => {
    vi.mocked(storage.get).mockResolvedValue(makeBuffer(4));
    vi.mocked(crypto.subtle.digest).mockResolvedValue(
      new Uint8Array(32).fill(1).buffer,
    );
    const progress = vi.fn<(event: ILoadProgress) => void>();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      downloadVerified("https://example.com/file", {
        storage,
        onProgress: progress,
      }),
    ).rejects.toThrow("SRI verification failed");
    expect(progress).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("keeps full URLs and hashes distinct in fixed-length cache keys", async () => {
    vi.stubGlobal("crypto", nativeCrypto);
    const suffix = "a".repeat(1000);
    const first = await downloader.cacheKey(
      `https://one.example/${suffix}`,
      VALID_SHA256_SRI,
    );
    const second = await downloader.cacheKey(
      `https://two.example/${suffix}`,
      VALID_SHA256_SRI,
    );
    expect(first).not.toBe(second);
    expect(first).toMatch(/^chunked:[a-f0-9]{64}$/);
    expect(
      await downloader.cacheKey(
        "https://example.com/file",
        `${VALID_SHA256_SRI}one`,
      ),
    ).not.toBe(
      await downloader.cacheKey(
        "https://example.com/file",
        `${VALID_SHA256_SRI}two`,
      ),
    );
  });

  it.each(["-1", "1garbage", "1.5", "9007199254740992"])(
    "rejects malformed HEAD Content-Length %s without fallback",
    async (length) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(null, { headers: { "content-length": length } }),
        );
      vi.stubGlobal("fetch", fetchMock);
      await expect(
        downloadVerified("https://example.com/file"),
      ).rejects.toThrow("Invalid Content-Length");
      expect(fetchMock).toHaveBeenCalledOnce();
    },
  );

  it("rejects oversized HEAD and cached data", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ contentLength: 9 }));
    await expect(
      downloadVerified("https://example.com/file", { maxBytes: 8 }),
    ).rejects.toThrow("size limit");
    vi.mocked(storage.get).mockResolvedValue(makeBuffer(9));
    await expect(
      downloadVerified("https://example.com/file", { maxBytes: 8, storage }),
    ).rejects.toThrow("size limit");
  });

  it.each([
    { status: 200, range: "bytes 0-3/8", size: 4 },
    { status: 206, range: "bytes 1-4/8", size: 4 },
    { status: 206, range: "bytes 0-3/9", size: 4 },
    { status: 206, range: "bytes 0-3/8", size: 0 },
    { status: 206, range: "bytes 0-3/8", size: 3 },
    { status: 206, range: "bytes 0-3/8", size: 5 },
  ])(
    "rejects invalid Range response %j without completion",
    async ({ status, range, size }) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            headers: { "accept-ranges": "bytes", "content-length": "8" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(makeBuffer(size), {
            status,
            headers: { "content-range": range },
          }),
        );
      vi.stubGlobal("fetch", fetchMock);
      const progress = vi.fn<(event: ILoadProgress) => void>();
      await expect(
        downloadVerified("https://example.com/file", {
          chunkSize: 4,
          onProgress: progress,
        }),
      ).rejects.toBeInstanceOf(ChunkedDownloadError);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(
        progress.mock.calls.some(([event]) => event.status === "completed"),
      ).toBe(false);
    },
  );

  it.each([{ "content-length": "3" }, { "content-encoding": "gzip" }])(
    "rejects inconsistent Range headers %j",
    async (headers) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(
            new Response(null, {
              headers: { "accept-ranges": "bytes", "content-length": "8" },
            }),
          )
          .mockResolvedValueOnce(
            new Response(makeBuffer(4), {
              status: 206,
              headers: { "content-range": "bytes 0-3/8", ...headers },
            }),
          ),
      );
      await expect(
        downloadVerified("https://example.com/file", { chunkSize: 4 }),
      ).rejects.toBeInstanceOf(ChunkedDownloadError);
    },
  );

  it.each([true, false])(
    "rejects missing segment hashes with HEAD size available: %s",
    async (headSize) => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          ...(headSize ? { contentLength: 8 } : {}),
          singleBuffer: makeBuffer(8),
        }),
      );
      await expect(
        downloadVerified("https://example.com/file", {
          segmentedSri: { segmentSize: 4, hashes: [VALID_SHA256_SRI] },
        }),
      ).rejects.toThrow("Segment hash count");
    },
  );

  it("verifies segments in single-fetch fallback using segmentSize", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ singleBuffer: makeBuffer(8) }));
    await downloadVerified("https://example.com/file", {
      segmentedSri: {
        segmentSize: 4,
        hashes: [VALID_SHA256_SRI, VALID_SHA256_SRI],
      },
    });
    expect(crypto.subtle.digest).toHaveBeenCalledTimes(3);
  });

  it.each([4, 9])(
    "rejects mismatching single response lengths %s",
    async (length) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(
            new Response(null, { headers: { "content-length": "8" } }),
          )
          .mockResolvedValueOnce(
            new Response(makeBuffer(length), {
              headers: { "content-length": String(length) },
            }),
          ),
      );
      await expect(
        downloadVerified("https://example.com/file"),
      ).rejects.toBeInstanceOf(ChunkedDownloadError);
    },
  );

  it("bounds unknown-length streaming bodies and cancels on overflow", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(9));
      },
      cancel,
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 405 }))
        .mockResolvedValueOnce(new Response(stream)),
    );
    await expect(
      downloadVerified("https://example.com/file", { maxBytes: 8 }),
    ).rejects.toThrow("size limit");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("aborts an in-flight stream read and cancels the reader", async () => {
    const controller = new AbortController();
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        controller.abort();
      },
      cancel,
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null))
        .mockResolvedValueOnce(new Response(stream)),
    );
    await expect(
      downloadVerified("https://example.com/file", {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("never completes or caches an SRI mismatch after download", async () => {
    vi.stubGlobal("fetch", makeFetchMock({ singleBuffer: makeBuffer(8) }));
    const progress = vi.fn<(event: ILoadProgress) => void>();
    await expect(
      downloadVerified("https://example.com/file", {
        sri: INVALID_SRI,
        storage,
        onProgress: progress,
      }),
    ).rejects.toThrow();
    expect(
      progress.mock.calls.some(([event]) => event.status === "completed"),
    ).toBe(false);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("accepts encoded single responses without comparing compressed lengths", async () => {
    const headers = { "content-encoding": "gzip", "content-length": "2" };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { headers }))
        .mockResolvedValueOnce(new Response(makeBuffer(8), { headers })),
    );
    expect(
      (await downloadVerified("https://example.com/file")).buffer.byteLength,
    ).toBe(8);
  });
  it("uses real SRI and requires the strongest advertised hash", async () => {
    vi.stubGlobal("crypto", nativeCrypto);
    const bytes = new TextEncoder().encode("verified").buffer;
    const digest = await nativeCrypto.subtle.digest("SHA-512", bytes);
    const hash = `sha512-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
    vi.stubGlobal("fetch", makeFetchMock({ singleBuffer: bytes }));
    await expect(
      downloadVerified("https://example.com/file", {
        sri: `${VALID_SHA256_SRI} ${hash}`,
      }),
    ).resolves.toMatchObject({ buffer: bytes });
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        singleBuffer: new TextEncoder().encode("tampered").buffer,
      }),
    );
    await expect(
      downloadVerified("https://example.com/file", { sri: hash }),
    ).rejects.toThrow("SRI verification failed");
  });

  it("does not turn cache write failure into download failure", async () => {
    vi.mocked(storage.set).mockRejectedValue(new Error("read-only"));
    vi.stubGlobal("fetch", makeFetchMock({ singleBuffer: makeBuffer(4) }));
    await expect(
      downloadVerified("https://example.com/file", { storage }),
    ).resolves.toMatchObject({ fromCache: false });
  });
});
