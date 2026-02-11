import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../workers/WorkerCommunicator";
import { EngineError } from "../errors/EngineError";

describe("WorkerCommunicator", () => {
  /**
   * Worker のモック実装。
   * インターフェースを明示的に満たすように型定義を調整。
   */
  let currentMockWorker: MockWorker | null = null;

  class MockWorker implements Worker {
    onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    onerror: ((this: AbstractWorker, ev: ErrorEvent) => unknown) | null = null;
    onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
    
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn().mockReturnValue(true);

    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      currentMockWorker = this;
    }
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("メッセージを送信し、期待されるレスポンスを待機できること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    await communicator.spawn();

    const responsePromise = communicator.expectMessage((data) => data === "ok");
    communicator.postMessage("ping");

    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("ping", []);

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "ok" } as MessageEvent);
    }

    await expect(responsePromise).resolves.toBe("ok");
  });

  it("Worker でエラーが発生した際、待機中の Promise が reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    await communicator.spawn();

    const responsePromise = communicator.expectMessage((data) => data === "ok");

    if (currentMockWorker?.onerror) {
      currentMockWorker.onerror({ message: "crash" } as ErrorEvent);
    }

    await expect(responsePromise).rejects.toThrow(EngineError);
  });

  it("タイムアウト時に適切なエラーが投げられること", async () => {
    vi.useFakeTimers();
    const communicator = new WorkerCommunicator("test.js");
    await communicator.spawn();

    const responsePromise = communicator.expectMessage((data) => data === "ok", { timeoutMs: 100 });

    vi.advanceTimersByTime(101);

    await expect(responsePromise).rejects.toThrow(/timed out/i);
    vi.useRealTimers();
  });

  it("AbortSignal によって処理を中断できること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    await communicator.spawn();

    const controller = new AbortController();
    const responsePromise = communicator.expectMessage((data) => data === "ok", { signal: controller.signal });

    controller.abort();

    await expect(responsePromise).rejects.toThrow(/aborted/i);
  });

  it("terminate 時に Worker が終了されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    await communicator.spawn();
    
    communicator.terminate();
    expect(currentMockWorker?.terminate).toHaveBeenCalled();
  });
});
