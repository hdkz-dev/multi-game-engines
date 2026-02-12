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

  it("メッセージバッファが上限を超えた場合、古いものから破棄されること", async () => {
    const communicator = new WorkerCommunicator("test.js");
    
    // 上限 (100) を超えるメッセージを送信
    for (let i = 0; i < 110; i++) {
      if (currentMockWorker?.onmessage) {
        currentMockWorker.onmessage({ data: `msg-${i}` } as MessageEvent);
      }
    }

    // 古いメッセージ (msg-0) は既に消えているはず
    // msg-10 は残っているはず (110 - 100 = 10)
    await expect(communicator.expectMessage((data) => data === "msg-0", { timeoutMs: 10 })).rejects.toThrow();
    const response = await communicator.expectMessage((data) => data === "msg-10");
    expect(response).toBe("msg-10");
  });

  it("述語関数 (predicate) がエラーを投げても、他のリスナーに影響しないこと", async () => {
    const communicator = new WorkerCommunicator("test.js");
    
    // エラーを投げる述語
    const responsePromise = communicator.expectMessage((data) => {
      if (data === "bad") throw new Error("Boom");
      return data === "good";
    });

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "bad" } as MessageEvent);
      currentMockWorker.onmessage({ data: "good" } as MessageEvent);
    }

    await expect(responsePromise).resolves.toBe("good");
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
