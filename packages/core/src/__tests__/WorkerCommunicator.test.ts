import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../workers/WorkerCommunicator";
import { EngineError } from "../errors/EngineError";

describe("WorkerCommunicator", () => {
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

    const responsePromise = communicator.expectMessage((data) => data === "ok");
    communicator.postMessage("ping");

    expect(currentMockWorker?.postMessage).toHaveBeenCalledWith("ping");

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "ok" } as MessageEvent);
    }

    await expect(responsePromise).resolves.toBe("ok");
  });

  it("Worker でエラーが発生した際、待機中の Promise が reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");

    const responsePromise = communicator.expectMessage((data) => data === "ok");

    if (currentMockWorker?.onerror) {
      currentMockWorker.onerror({ message: "crash" } as ErrorEvent);
    }

    await expect(responsePromise).rejects.toThrow(EngineError);
  });

  it("タイムアウト時に適切なエラーが投げられること", async () => {
    vi.useFakeTimers();
    const communicator = new WorkerCommunicator("test.js");

    const responsePromise = communicator.expectMessage((data) => data === "ok", 100);

    vi.advanceTimersByTime(101);

    await expect(responsePromise).rejects.toThrow(/timed out/i);
    vi.useRealTimers();
  });

  it("terminate 時に Worker が終了されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    
    communicator.terminate();
    expect(currentMockWorker?.terminate).toHaveBeenCalled();
  });

  it("先行して届いたメッセージもバッファから解決できること", async () => {
    const communicator = new WorkerCommunicator("test.js");

    // 1. expectMessage 前にメッセージを送り込む
    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "early-bird" } as MessageEvent);
    }

    // 2. その後で expectMessage を呼ぶ
    const response = await communicator.expectMessage((data) => data === "early-bird");
    expect(response).toBe("early-bird");
  });
});
