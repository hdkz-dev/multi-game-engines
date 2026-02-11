import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../workers/WorkerCommunicator";
import { EngineErrorCode } from "../types";
import { EngineError } from "../errors/EngineError";

describe("WorkerCommunicator", () => {
  let currentMockWorker: MockWorker | null = null;
  const originalLocation = globalThis.location;

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

    // Mock location environment for security checks if not present
    if (!globalThis.location) {
        globalThis.location = {
            href: "http://localhost:3000/",
            origin: "http://localhost:3000",
        } as Location;
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Restore original location
    if (globalThis.location !== originalLocation) {
        globalThis.location = originalLocation;
    }
  });

  it("メッセージを送信し、期待されるレスポンスを待機できること", async () => {
    const communicator = new WorkerCommunicator("blob:test.js");

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
    const communicator = new WorkerCommunicator("blob:test.js");

    const responsePromise = communicator.expectMessage((data) => data === "ok", { timeoutMs: 100 });

    vi.advanceTimersByTime(101);

    await expect(responsePromise).rejects.toThrow(/timed out/i);
    vi.useRealTimers();
  });

  it("AbortSignal によって処理を中断できること", async () => {
    const communicator = new WorkerCommunicator("blob:test.js");
    const controller = new AbortController();
    
    const responsePromise = communicator.expectMessage((data) => data === "ok", { signal: controller.signal });

    controller.abort("manual abort");

    await expect(responsePromise).rejects.toBe("manual abort");
  });

  it("先行して届いたメッセージもバッファから解決できること", async () => {
    const communicator = new WorkerCommunicator("blob:test.js");

    if (currentMockWorker?.onmessage) {
      currentMockWorker.onmessage({ data: "early-bird" } as MessageEvent);
    }

    const response = await communicator.expectMessage((data) => data === "early-bird");
    expect(response).toBe("early-bird");
  });

  // --- Security Tests ---

  it("クロスオリジンのURLはセキュリティ違反としてブロックされること", () => {
    expect(() => {
        new WorkerCommunicator("http://evil.com/worker.js");
    }).toThrowError(EngineError);

    try {
         new WorkerCommunicator("http://evil.com/worker.js");
    } catch (e) {
        const err = e as EngineError;
        expect(err.code).toBe(EngineErrorCode.SECURITY_VIOLATION);
        expect(err.message).toContain("must be from the same origin");
    }
  });

  it("同一オリジンのURLは許可されること", () => {
    expect(() => {
        new WorkerCommunicator("http://localhost:3000/worker.js");
    }).not.toThrow();
  });

  it("Blob URLは許可されること", () => {
    expect(() => {
        new WorkerCommunicator("blob:http://localhost:3000/uuid");
    }).not.toThrow();
  });
});
