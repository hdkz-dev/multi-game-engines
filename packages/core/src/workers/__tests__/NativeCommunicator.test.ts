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
    communicator.terminate();

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
});
