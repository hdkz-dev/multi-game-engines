import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../workers/WorkerCommunicator";

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
  }

  beforeEach(() => {
    currentMockWorker = null;
    vi.stubGlobal("Worker", vi.fn().mockImplementation(function() {
      const worker = new MockWorker();
      currentMockWorker = worker;
      return worker;
    }));
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

  it("タイムアウト時に適切なエラーが投げられること", async () => {
    vi.useFakeTimers();
    const communicator = new WorkerCommunicator("test.js");

    const responsePromise = communicator.expectMessage((data) => data === "ok", { timeoutMs: 100 });

    vi.advanceTimersByTime(101);

    await expect(responsePromise).rejects.toThrow(/timed out/i);
    vi.useRealTimers();
  });

  it("AbortSignal によって処理を中断できること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const controller = new AbortController();
    
    const responsePromise = communicator.expectMessage((data) => data === "ok", { signal: controller.signal });

    controller.abort("manual abort");

    await expect(responsePromise).rejects.toBe("manual abort");
  });

  it("先行して届いたメッセージもバッファから解決できること", async () => {
    const communicator = new WorkerCommunicator("test.js");

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "early-bird" } as MessageEvent);
    }

    const response = await communicator.expectMessage((data) => data === "early-bird");
    expect(response).toBe("early-bird");
  });

  it("terminate() 時に保留中の待機 Promise が Reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage((data) => data === "never");

    communicator.terminate();

    await expect(responsePromise).rejects.toThrow("Communicator terminated");
  });

  it("Worker のエラー時に保留中の待機 Promise が Reject されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    const responsePromise = communicator.expectMessage((data) => data === "never");

    if (currentMockWorker?.onerror) {
      currentMockWorker.onerror({ message: "Worker crashed" } as ErrorEvent);
    }

    await expect(responsePromise).rejects.toThrow("Worker crashed");
  });
});
