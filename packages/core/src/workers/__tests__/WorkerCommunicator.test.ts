import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkerCommunicator } from "../WorkerCommunicator.js";

describe("WorkerCommunicator", () => {
  const mockWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null as any,
    onerror: null as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;
    
    // 物理的修正: Worker をクラス（コンストラクタ）としてスタブ化するために function を使用
    const WorkerMock = vi.fn().mockImplementation(function(this: any) {
      return mockWorker;
    });
    vi.stubGlobal("Worker", WorkerMock);
  });

  it("should post messages to worker", () => {
    const comm = new WorkerCommunicator("test.js");
    comm.postMessage("hello");
    expect(mockWorker.postMessage).toHaveBeenCalledWith("hello");
  });

  it("should handle incoming messages", async () => {
    const comm = new WorkerCommunicator("test.js");
    const log: any[] = [];
    comm.onMessage((data) => log.push(data));

    if (mockWorker.onmessage) {
      mockWorker.onmessage({ data: "response" } as MessageEvent);
    }
    expect(log).toContain("response");
  });

  it("should reject expectations when terminated", async () => {
    const comm = new WorkerCommunicator("test.js");
    const promise = comm.expectMessage((d) => d === "ok");
    
    await comm.terminate();
    await expect(promise).rejects.toThrow("Worker terminated");
  });
});
