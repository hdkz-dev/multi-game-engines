import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkerCommunicator } from "../WorkerCommunicator.js";

describe("WorkerCommunicator", () => {
  const mockWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null as unknown,
    onerror: null as unknown,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorker.onmessage = null;
    mockWorker.onerror = null;

    // 物理的修正: Worker をクラス（コンストラクタ）としてスタブ化するために function を使用
    const WorkerMock = vi.fn().mockImplementation(function (this: unknown) {
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
    const log: unknown[] = [];
    comm.onMessage((data) => log.push(data));

    const onmessage = mockWorker.onmessage as
      | ((ev: { data: unknown }) => void)
      | null;
    if (typeof onmessage === "function") {
      onmessage({ data: "response" });
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
