import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ChunkedDownloader,
  ChunkedDownloadError,
} from "../ChunkedDownloader.js";
import { IFileStorage, ILoadProgress } from "../../types.js";

// SHA-256 of 0x00 0x01 0x02 ... 0x0f (16 bytes)
// computed: 3db92d3f5c7e1d9c4b5a6e8f2a1b0c3d (example — we mock crypto.subtle)
const MOCK_BYTES_16 = new Uint8Array([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
]);
const VALID_SHA256_SRI = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // will be mocked
const INVALID_SRI = "sha256-INVALID_HASH_VALUE==============================";

function makeBuffer(size: number): ArrayBuffer {
  return new Uint8Array(size).fill(0xAB).buffer;
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
        headers: { get: () => null },
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

    const result = await downloader.download("https://example.com/file.wasm", {
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
    await downloader.download("https://example.com/file.wasm", {
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

    const result = await downloader.download(
      "https://cdn.example.com/big.wasm",
      {
        chunkSize: 4,
      },
    );

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
    await downloader.download("https://cdn.example.com/big.wasm", {
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

    const result = await downloader.download("https://example.com/file.wasm");

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

    const result = await downloader.download("https://example.com/small.wasm");
    expect(result.buffer.byteLength).toBe(4);
  });

  // ---- SRI 検証 ----

  it("passes SRI verification when digest matches", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);
    // crypto.subtle.digest が 32 byte 0 → base64 = "AAAA..."
    const validSri = `sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;

    await expect(
      downloader.download("https://example.com/file.wasm", { sri: validSri }),
    ).resolves.toBeDefined();
  });

  it("throws ChunkedDownloadError on SRI mismatch", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloader.download("https://example.com/file.wasm", {
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
      downloader.download("https://example.com/missing.wasm"),
    ).rejects.toBeInstanceOf(ChunkedDownloadError);
  });

  // ---- キャッシュ書き込み ----

  it("writes downloaded buffer to storage after successful download", async () => {
    const fetchMock = makeFetchMock({ singleBuffer: makeBuffer(8) });
    vi.stubGlobal("fetch", fetchMock);

    const sri = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    await downloader.download("https://cdn.example.com/engine.wasm", {
      sri,
      storage,
    });

    expect(storage.set).toHaveBeenCalledOnce();
    const [key] = vi.mocked(storage.set).mock.calls[0]!;
    expect(key).toContain("chunked:");
  });

  // ---- cacheKey ----

  it("generates deterministic cache keys", () => {
    const url = "https://cdn.example.com/engine.wasm";
    const sri = "sha384-abc123def456";
    const key1 = downloader.cacheKey(url, sri);
    const key2 = downloader.cacheKey(url, sri);
    expect(key1).toBe(key2);
    expect(key1).toContain("chunked:");
  });
});
