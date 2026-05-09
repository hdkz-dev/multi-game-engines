import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkerCommunicator } from "../WorkerCommunicator.js";

describe("WorkerCommunicator", () => {
  const mockWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null as unknown,
    onerror: null as unknown,
  };

  const deliver = (data: unknown): void => {
    const onmessage = mockWorker.onmessage as
      | ((ev: { data: unknown }) => void)
      | null;
    onmessage?.({ data });
  };

  const fireWorkerError = (message: string): void => {
    const onerror = mockWorker.onerror as
      | ((ev: { message?: string }) => void)
      | null;
    onerror?.({ message });
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post messages to worker", () => {
    const comm = new WorkerCommunicator("test.js");
    comm.postMessage("hello");
    expect(mockWorker.postMessage).toHaveBeenCalledWith("hello");
  });

  it("should handle incoming messages", () => {
    const comm = new WorkerCommunicator("test.js");
    const log: unknown[] = [];
    comm.onMessage((data) => log.push(data));

    deliver("response");

    expect(log).toContain("response");
  });

  it("should allow unsubscribing a registered listener", () => {
    const comm = new WorkerCommunicator("test.js");
    const spy = vi.fn();
    const unsubscribe = comm.onMessage(spy);

    deliver("a");
    unsubscribe();
    deliver("b");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("a");
  });

  it("should reject expectations when terminated", async () => {
    const comm = new WorkerCommunicator("test.js");
    const promise = comm.expectMessage((d) => d === "ok");

    await comm.terminate();
    await expect(promise).rejects.toThrow("Worker terminated");
  });

  it("should physically terminate the underlying Worker", async () => {
    const comm = new WorkerCommunicator("test.js");
    await comm.terminate();
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  describe("expectMessage", () => {
    it("should resolve when a matching message arrives", async () => {
      const comm = new WorkerCommunicator("test.js");
      const promise = comm.expectMessage<string>((d) => d === "uciok", 500);

      deliver("noise");
      deliver("uciok");

      await expect(promise).resolves.toBe("uciok");
    });

    it("should not resolve when a non-matching message arrives", async () => {
      vi.useFakeTimers();
      try {
        const comm = new WorkerCommunicator("test.js");
        const promise = comm.expectMessage<string>((d) => d === "match", {
          timeoutMs: 100,
        });
        const settled = promise.catch((e: Error) => e);

        deliver("nope");
        deliver(42);
        await vi.advanceTimersByTimeAsync(150);

        const err = await settled;
        expect((err as Error).message).toMatch(/Timed out/);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should reject with TIMEOUT when no message matches in time", async () => {
      vi.useFakeTimers();
      try {
        const comm = new WorkerCommunicator("test.js");
        const promise = comm.expectMessage(() => false, { timeoutMs: 100 });
        const settled = promise.catch((e: Error) => e);

        await vi.advanceTimersByTimeAsync(150);

        const err = await settled;
        expect((err as Error).message).toMatch(/Timed out/);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should reject with CANCELLED when AbortSignal fires", async () => {
      const comm = new WorkerCommunicator("test.js");
      const ac = new AbortController();
      const promise = comm.expectMessage(() => false, {
        timeoutMs: 5000,
        signal: ac.signal,
      });

      ac.abort();

      await expect(promise).rejects.toThrow(/Operation cancelled/);
    });

    it("should accept a numeric timeout argument (back-compat)", async () => {
      vi.useFakeTimers();
      try {
        const comm = new WorkerCommunicator("test.js");
        const promise = comm.expectMessage(() => false, 50);
        const settled = promise.catch((e: Error) => e);

        await vi.advanceTimersByTimeAsync(80);
        const err = await settled;
        expect((err as Error).message).toMatch(/Timed out/);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not reject after a match has already resolved (timer is cleared)", async () => {
      vi.useFakeTimers();
      try {
        const comm = new WorkerCommunicator("test.js");
        const promise = comm.expectMessage<string>((d) => d === "ready", {
          timeoutMs: 100,
        });
        deliver("ready");
        await expect(promise).resolves.toBe("ready");

        // Advancing past the timeout must NOT throw an unhandled rejection
        await vi.advanceTimersByTimeAsync(500);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should resolve concurrent waiters independently", async () => {
      const comm = new WorkerCommunicator("test.js");
      const p1 = comm.expectMessage<string>((d) => d === "alpha", 500);
      const p2 = comm.expectMessage<string>((d) => d === "beta", 500);

      deliver("beta");
      await expect(p2).resolves.toBe("beta");
      deliver("alpha");
      await expect(p1).resolves.toBe("alpha");
    });
  });

  describe("error handling", () => {
    it("should reject all pending expectations when the worker fires onerror", async () => {
      const comm = new WorkerCommunicator("test.js");
      const p1 = comm.expectMessage(() => false, 5000);
      const p2 = comm.expectMessage(() => false, 5000);

      fireWorkerError("boom");

      await expect(p1).rejects.toThrow(/boom/);
      await expect(p2).rejects.toThrow(/boom/);
    });

    it("should still log the error event when onerror has no message", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const comm = new WorkerCommunicator("test.js");
      const p = comm.expectMessage(() => false, 5000);

      fireWorkerError("");

      await expect(p).rejects.toThrow(/Worker error/);
      expect(errSpy).toHaveBeenCalled();
    });
  });
});
