import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkerCommunicator } from "../workers/WorkerCommunicator";

/**
 * Worker のモック用インターフェース。
 * 最小限のプロパティを型定義し、テスト時の安全性を確保。
 */
interface MockWorker {
  postMessage: (message: unknown, transfer: Transferable[]) => void;
  terminate: () => void;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: ErrorEvent) => void) | null;
  addEventListener: (type: string, listener: unknown) => void;
  removeEventListener: (type: string, listener: unknown) => void;
}

describe("WorkerCommunicator", () => {
  const mockWorker: MockWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    // コンストラクタ呼び出しを再現するため function を使用。内部返却値のため any を許容。
    const WorkerMock = vi.fn(function() {
      return mockWorker;
    });
    vi.stubGlobal("Worker", WorkerMock);
  });

  it("should send message to worker and receive expected response", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.spawn();
    
    const promise = comm.expectMessage<string>((data) => data === "ok");
    
    // メッセージ到着をシミュレート
    if (mockWorker.onmessage) {
      mockWorker.onmessage({ data: "ok" } as MessageEvent);
    }
    
    expect(await promise).toBe("ok");
  });

  it("should reject pending promises when worker encounters an error", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.spawn();

    const promise = comm.expectMessage((_) => true);
    
    // Worker エラー（クラッシュ）をシミュレート
    if (mockWorker.onerror) {
      mockWorker.onerror({ message: "Worker crashed" } as ErrorEvent);
    }
    
    await expect(promise).rejects.toThrow("Worker internal error: Worker crashed");
  });

  it("should timeout if message is not received within specified time", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.spawn();

    const promise = comm.expectMessage((_) => true, { timeoutMs: 1000 });
    
    // 1秒進める
    vi.advanceTimersByTime(1000);
    
    await expect(promise).rejects.toThrow("Message expectation timed out after 1000ms");
  });

  it("should abort if AbortSignal is triggered", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.spawn();

    const controller = new AbortController();
    const promise = comm.expectMessage((_) => true, { signal: controller.signal });
    
    // 中断
    controller.abort();
    
    await expect(promise).rejects.toThrow("Message expectation was aborted");
  });

  it("should terminate worker when requested", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.spawn();
    comm.terminate();
    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
