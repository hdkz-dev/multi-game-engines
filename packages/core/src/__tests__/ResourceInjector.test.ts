import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResourceInjector } from "../workers/ResourceInjector.js";

describe("ResourceInjector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // 内部状態のリセット（static プロパティなので手動でリセットが必要な場合があるが、
    // ここでは新しいマッピングで上書きされることを確認する）
  });

  it("リソースを注入し解決できること", () => {
    const resources = {
      "stockfish.wasm": "blob:http://localhost/wasm-hash",
      "/nnue/default.nnue": "blob:http://localhost/nnue-hash",
    };

    // 擬似的なメッセージイベントを送信
    const handler = vi.fn();
    const mockPostMessage = vi.fn();
    vi.stubGlobal("self", { postMessage: mockPostMessage });
    vi.stubGlobal(
      "addEventListener",
      vi.fn((type, h) => {
        if (type === "message") handler.mockImplementation(h);
      }),
    );

    ResourceInjector.listen();

    const event = {
      data: {
        type: "MG_INJECT_RESOURCES",
        resources,
      },
    } as MessageEvent;

    handler(event);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "MG_RESOURCES_READY",
    });
    expect(ResourceInjector.resolve("stockfish.wasm")).toBe(
      "blob:http://localhost/wasm-hash",
    );
    expect(ResourceInjector.resolve("./stockfish.wasm")).toBe(
      "blob:http://localhost/wasm-hash",
    );
    expect(ResourceInjector.resolve("path/to/stockfish.wasm")).toBe(
      "blob:http://localhost/wasm-hash",
    );
  });

  it("waitForReady が注入完了まで待機できること", async () => {
    const readyPromise = ResourceInjector.waitForReady();
    let resolved = false;
    readyPromise.then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);

    const handler = vi.fn();
    vi.stubGlobal(
      "addEventListener",
      vi.fn((type, h) => {
        if (type === "message") handler.mockImplementation(h);
      }),
    );
    ResourceInjector.listen();

    handler({
      data: {
        type: "MG_INJECT_RESOURCES",
        resources: { "test.wasm": "blob:..." },
      },
    } as MessageEvent);

    await readyPromise;
    expect(resolved).toBe(true);
  });

  it("fetch をインターセプトしてパスを解決できること", async () => {
    const resources = {
      "data.bin": "blob:http://localhost/data-bin-blob",
    };

    // 注入
    const handler = vi.fn();
    vi.stubGlobal(
      "addEventListener",
      vi.fn((type, h) => {
        if (type === "message") handler.mockImplementation(h);
      }),
    );
    ResourceInjector.listen();

    handler({
      data: {
        type: "MG_INJECT_RESOURCES",
        resources,
      },
    } as MessageEvent);

    // fetch のモック
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    ResourceInjector.interceptFetch();

    await fetch("data.bin");
    expect(mockFetch).toHaveBeenCalledWith(
      "blob:http://localhost/data-bin-blob",
      undefined,
    );

    await fetch("other.bin");
    expect(mockFetch).toHaveBeenCalledWith("other.bin", undefined);
  });
});
