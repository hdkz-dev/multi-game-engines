import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../WorkerCommunicator.js";

describe("WorkerCommunicator", () => {
  let currentMockWorker: MockWorker | null = null;

  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((ev: { data: unknown }) => void) | null = null;
    onerror: ((ev: { message: string }) => void) | null = null;
    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      currentMockWorker = this;
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", MockWorker);
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("postMessage が内部の Worker に正しく委譲されること", () => {
    const communicator = new WorkerCommunicator("test.js");
    communicator.postMessage("hello");
    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("hello");
  });

  it("expectMessage が特定のメッセージを待機し、Promise で返すこと", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage((data) => data === "ok");

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "ok" });
    }

    const response = await responsePromise;
    expect(response).toBe("ok");
  });

  it("expectMessage がタイムアウトした場合に reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage(
      (data) => data === "ok",
      { timeoutMs: 100 },
    );

    await expect(responsePromise).rejects.toThrow(/timed out/);
  });

  it("AbortSignal を受け取り、中断された場合に reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const controller = new AbortController();
    const responsePromise = communicator.expectMessage(
      (data) => data === "ok",
      { signal: controller.signal },
    );

    controller.abort("reason");
    await expect(responsePromise).rejects.toBe("reason");
  });

  it("バッファリング機能により、expect 以前に届いたメッセージも取得できること", async () => {
    const communicator = new WorkerCommunicator("test.js");

    // まだ期待していないメッセージを送る
    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "buffered" });
    }

    const response = await communicator.expectMessage(
      (data) => data === "buffered",
    );
    expect(response).toBe("buffered");
  });

  it("メッセージバッファが上限を超えた場合、古いものから破棄されること", () => {
    new WorkerCommunicator("test.js");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (let i = 0; i < 110; i++) {
      if (currentMockWorker?.onmessage) {
        currentMockWorker.onmessage({ data: i });
      }
    }

    expect(spy).toHaveBeenCalledWith(expect.stringContaining("overflow"));
    spy.mockRestore();
  });

  it("述語関数 (predicate) がエラーを投げても、他の処理に影響しないこと", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const responsePromise = communicator.expectMessage((data) => {
      if (data === "bad") throw new Error("Boom");
      return data === "good";
    });

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "bad" });
      currentMockWorker.onmessage({ data: "good" });
    }

    const response = await responsePromise;
    expect(response).toBe("good");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("terminate 時に保留中の expectation が全てキャンセルされること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage(
      (data) => data === "never",
    );

    communicator.terminate();

    await expect(responsePromise).rejects.toThrow(/terminated/);
    expect(currentMockWorker?.terminate).toHaveBeenCalled();
  });

  it("Worker のエラー時に保留中の expectation が全てキャンセルされること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage(
      (data) => data === "never",
    );

    if (currentMockWorker?.onerror) {
      currentMockWorker.onerror({ message: "Worker Error" } as ErrorEvent);
    }

    await expect(responsePromise).rejects.toThrow("Worker Error");
  });

  it("onMessage で全てのメッセージを購読できること", () => {
    const communicator = new WorkerCommunicator("test.js");
    const callback = vi.fn();
    communicator.onMessage(callback);

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "ok" });
    }

    expect(callback).toHaveBeenCalledWith("ok");
  });
});
