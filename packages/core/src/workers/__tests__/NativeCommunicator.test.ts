import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { NativeCommunicator } from "../NativeCommunicator.js";
import { spawn } from "node:child_process";

const { mockChild, resetMockChildListeners } = vi.hoisted(() => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const resetMockChildListeners = () => listeners.clear();

  const m = {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
      return m;
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((cb) => {
        cb(...args);
      });
      return true;
    }),
    send: vi.fn(),
    kill: vi.fn(),
    stdin: {
      write: vi.fn(),
      end: vi.fn(),
    },
    stdout: {
      on: vi.fn((event: string, cb: (data: unknown) => void) => {
        const key = `stdout:${event}`;
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key)!.add(cb as (...args: unknown[]) => void);
        return m.stdout;
      }),
    },
    stderr: {
      on: vi.fn(),
    },
  };
  return { mockChild: m, resetMockChildListeners };
});

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockChild),
}));

describe("NativeCommunicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockChildListeners();
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should spawn a child process with the given path", async () => {
    const communicator = new NativeCommunicator("/path/to/engine");
    await communicator.spawn();

    expect(spawn).toHaveBeenCalledWith(
      "/path/to/engine",
      [],
      expect.any(Object),
    );
  });

  it("should send messages to the child process via stdin", async () => {
    const communicator = new NativeCommunicator("engine");
    await communicator.spawn();
    communicator.postMessage("test message");

    expect(mockChild.stdin.write).toHaveBeenCalledWith("test message\n");
  });

  it("should emit messages received from stdout", async () => {
    const communicator = new NativeCommunicator("engine");
    const messageSpy = vi.fn();
    communicator.onMessage(messageSpy);
    await communicator.spawn();

    type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
    const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
    const stdoutCallback = stdoutOnMock.mock.calls.find(
      (call: [string, (data: Buffer) => void]) => call[0] === "data",
    )?.[1];

    if (stdoutCallback) {
      stdoutCallback(Buffer.from("message from engine\n"));
    }

    expect(messageSpy).toHaveBeenCalledWith("message from engine");
  });

  it("should handle multiple messages in a single stdout chunk", async () => {
    const communicator = new NativeCommunicator("engine");
    const messageSpy = vi.fn();
    communicator.onMessage(messageSpy);
    await communicator.spawn();

    type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
    const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
    const stdoutCallback = stdoutOnMock.mock.calls.find(
      (call: [string, (data: Buffer) => void]) => call[0] === "data",
    )?.[1];

    if (stdoutCallback) {
      stdoutCallback(Buffer.from("msg1\nmsg2\n"));
    }

    expect(messageSpy).toHaveBeenCalledWith("msg1");
    expect(messageSpy).toHaveBeenCalledWith("msg2");
  });

  it("should handle partial messages across stdout chunks", async () => {
    const communicator = new NativeCommunicator("engine");
    const messageSpy = vi.fn();
    communicator.onMessage(messageSpy);
    await communicator.spawn();

    type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
    const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
    const stdoutCallback = stdoutOnMock.mock.calls.find(
      (call: [string, (data: Buffer) => void]) => call[0] === "data",
    )?.[1];

    if (stdoutCallback) {
      stdoutCallback(Buffer.from("partial"));
      stdoutCallback(Buffer.from(" message\n"));
    }

    expect(messageSpy).toHaveBeenCalledWith("partial message");
  });

  it("should terminate the child process on terminate()", async () => {
    const communicator = new NativeCommunicator("engine");
    await communicator.spawn();
    await communicator.terminate();

    expect(mockChild.kill).toHaveBeenCalled();
  });

  it("should handle process exit without crashing", async () => {
    const communicator = new NativeCommunicator("engine");
    await communicator.spawn();

    type OnMock = Mock<
      (event: string, cb: (code: number, signal: string | null) => void) => void
    >;
    const onMock = mockChild.on as unknown as OnMock;
    const exitCallback = onMock.mock.calls.find(
      (call: [string, (code: number, signal: string | null) => void]) =>
        call[0] === "exit",
    )?.[1];

    if (exitCallback) {
      exitCallback(1, null);
    }

    expect(mockChild.on).toHaveBeenCalledWith("exit", expect.any(Function));
  });

  it("should be a no-op when spawn() is called twice", async () => {
    const communicator = new NativeCommunicator("engine");
    await communicator.spawn();
    expect(spawn).toHaveBeenCalledTimes(1);

    await communicator.spawn();
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("should throw if the spawned child has no stdin/stdout", async () => {
    const spawnFn = spawn as unknown as Mock;
    spawnFn.mockReturnValueOnce({
      ...mockChild,
      stdout: null,
      stdin: null,
    });

    const communicator = new NativeCommunicator("engine");
    await expect(communicator.spawn()).rejects.toThrow(
      /Failed to initialize engine process streams/,
    );
  });

  it("should throw if postMessage is called before spawn", () => {
    const communicator = new NativeCommunicator("engine");
    expect(() => communicator.postMessage("uci")).toThrow(
      /NativeCommunicator not connected/,
    );
  });

  it("should ignore empty / whitespace-only lines from stdout", async () => {
    const communicator = new NativeCommunicator("engine");
    const messageSpy = vi.fn();
    communicator.onMessage(messageSpy);
    await communicator.spawn();

    type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
    const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
    const stdoutCallback = stdoutOnMock.mock.calls.find(
      (call: [string, (data: Buffer) => void]) => call[0] === "data",
    )?.[1];

    if (stdoutCallback) {
      stdoutCallback(Buffer.from("\n   \nactual\n"));
    }

    expect(messageSpy).toHaveBeenCalledTimes(1);
    expect(messageSpy).toHaveBeenCalledWith("actual");
  });

  it("should allow unsubscribing a registered listener", async () => {
    const communicator = new NativeCommunicator("engine");
    const messageSpy = vi.fn();
    const unsubscribe = communicator.onMessage(messageSpy);
    await communicator.spawn();

    type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
    const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
    const stdoutCallback = stdoutOnMock.mock.calls.find(
      (call: [string, (data: Buffer) => void]) => call[0] === "data",
    )?.[1];

    unsubscribe();
    stdoutCallback?.(Buffer.from("after-unsub\n"));

    expect(messageSpy).not.toHaveBeenCalled();
  });

  describe("expectMessage", () => {
    const emitStdout = (line: string): void => {
      type OnMock = Mock<(event: string, cb: (data: Buffer) => void) => void>;
      const stdoutOnMock = mockChild.stdout.on as unknown as OnMock;
      const stdoutCallback = stdoutOnMock.mock.calls.find(
        (call: [string, (data: Buffer) => void]) => call[0] === "data",
      )?.[1];
      stdoutCallback?.(Buffer.from(`${line}\n`));
    };

    it("should resolve when a matching message arrives", async () => {
      const communicator = new NativeCommunicator("engine");
      await communicator.spawn();

      const promise = communicator.expectMessage<string>(
        (data) => data === "uciok",
        500,
      );
      emitStdout("noise");
      emitStdout("uciok");

      await expect(promise).resolves.toBe("uciok");
    });

    it("should reject with TIMEOUT when no message matches in time", async () => {
      vi.useFakeTimers();
      try {
        const communicator = new NativeCommunicator("engine");
        await communicator.spawn();

        const promise = communicator.expectMessage<string>(() => false, {
          timeoutMs: 100,
        });
        const settled = promise.catch((e: Error) => e);

        await vi.advanceTimersByTimeAsync(150);
        const err = await settled;

        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(/Timed out/);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should reject with CANCELLED when AbortSignal fires", async () => {
      const communicator = new NativeCommunicator("engine");
      await communicator.spawn();

      const ac = new AbortController();
      const promise = communicator.expectMessage<string>(() => false, {
        timeoutMs: 5000,
        signal: ac.signal,
      });

      ac.abort();

      await expect(promise).rejects.toThrow(/Operation cancelled/);
    });

    it("should accept a numeric timeout argument (back-compat)", async () => {
      vi.useFakeTimers();
      try {
        const communicator = new NativeCommunicator("engine");
        await communicator.spawn();

        const promise = communicator.expectMessage(() => false, 50);
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
        const communicator = new NativeCommunicator("engine");
        await communicator.spawn();

        const promise = communicator.expectMessage<string>(
          (d) => d === "ready",
          { timeoutMs: 100 },
        );
        emitStdout("ready");
        await expect(promise).resolves.toBe("ready");

        // Advancing past the timeout must NOT throw an unhandled rejection
        await vi.advanceTimersByTimeAsync(500);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("terminate", () => {
    it("should be a no-op when no child is running", async () => {
      const communicator = new NativeCommunicator("engine");
      await communicator.terminate();
      expect(mockChild.kill).not.toHaveBeenCalled();
    });

    it("should resolve cleanly when the child exits before the SIGKILL deadline", async () => {
      const communicator = new NativeCommunicator("engine");
      await communicator.spawn();

      const terminate = communicator.terminate();
      // Fire ALL registered exit listeners (spawn's + terminate's). The mock
      // collects every listener under the same event name, so emit hits both.
      mockChild.emit("exit");
      await terminate;

      expect(mockChild.kill).toHaveBeenCalledWith("SIGTERM");
      const killCalls = (mockChild.kill as unknown as Mock).mock.calls;
      expect(killCalls.some((c: unknown[]) => c[0] === "SIGKILL")).toBe(false);
    });

    it("should escalate to SIGKILL when the child does not exit within 2s", async () => {
      vi.useFakeTimers();
      try {
        const communicator = new NativeCommunicator("engine");
        await communicator.spawn();

        const terminate = communicator.terminate();
        await vi.advanceTimersByTimeAsync(2100);
        await terminate;

        const killCalls = (mockChild.kill as unknown as Mock).mock.calls;
        expect(killCalls.some((c: unknown[]) => c[0] === "SIGTERM")).toBe(true);
        expect(killCalls.some((c: unknown[]) => c[0] === "SIGKILL")).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
