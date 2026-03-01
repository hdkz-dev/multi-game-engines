import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NativeCommunicator } from "../NativeCommunicator.js";

const { mockChild } = vi.hoisted(() => {
  // Use a simple mock object that implements the necessary EventEmitter interface
  // to avoid issues with hoisted imports of node:events
  const listeners = new Map<string, Set<(...args: unknown[]) => unknown>>();
  const m: any = {
    on: vi.fn((event, cb) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
      return m;
    }),
    emit: vi.fn((event, ...args) => {
      listeners.get(event)?.forEach((cb) => {
        cb(...args);
      });
      return true;
    }),
    removeAllListeners: vi.fn(() => {
      listeners.clear();
      return m;
    }),
    stdout: {
      on: vi.fn((event, cb) => {
        if (!m._stdoutListeners) m._stdoutListeners = new Map();
        if (!m._stdoutListeners.has(event))
          m._stdoutListeners.set(event, new Set());
        m._stdoutListeners.get(event).add(cb);
        return m.stdout;
      }),
      emit: vi.fn((event, ...args) => {
        m._stdoutListeners?.get(event)?.forEach((cb: unknown) => {
          if (typeof cb === "function") cb(...args);
        });
        return true;
      }),
      removeAllListeners: vi.fn(() => {
        m._stdoutListeners?.clear();
        return m.stdout;
      }),
    },
    stdin: { write: vi.fn() },
    kill: vi.fn(),
    _stdoutListeners: new Map(),
  };
  return { mockChild: m };
});

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockChild),
}));

describe("NativeCommunicator", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    mockChild.removeAllListeners();
    mockChild.stdout.removeAllListeners();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should spawn and communicate with a process", async () => {
    vi.mock("node:child_process", () => ({
      spawn: vi.fn(() => mockChild),
    }));

    const comm = new NativeCommunicator("dummy-path");
    await comm.spawn();

    const onMsg = vi.fn();
    comm.onMessage(onMsg);

    // Simulate stdout data
    mockChild.stdout.emit("data", Buffer.from("info depth 1\nbestmove e2e4\n"));

    expect(onMsg).toHaveBeenCalledWith("info depth 1");
    expect(onMsg).toHaveBeenCalledWith("bestmove e2e4");

    comm.postMessage("test");
    expect(mockChild.stdin.write).toHaveBeenCalledWith("test\n");

    comm.terminate();
    expect(mockChild.kill).toHaveBeenCalled();
  });

  it("should handle process errors", async () => {
    const comm = new NativeCommunicator("dummy-path");
    await comm.spawn();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockChild.emit("error", new Error("Spawn failed"));

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should handle unexpected process exit", async () => {
    const comm = new NativeCommunicator("dummy-path");
    await comm.spawn();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      mockChild.emit("exit", 1, "SIGTERM");
    }).not.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should handle large stdout outputs without truncation", async () => {
    const comm = new NativeCommunicator("dummy-path");
    await comm.spawn();

    const onMsg = vi.fn();
    comm.onMessage(onMsg);

    // Send a huge string in chunks
    const largeLine = "info " + "a".repeat(100000);
    mockChild.stdout.emit("data", Buffer.from(largeLine.substring(0, 50000)));
    mockChild.stdout.emit(
      "data",
      Buffer.from(largeLine.substring(50000) + "\n"),
    );

    expect(onMsg).toHaveBeenCalledWith(largeLine);
  });
});
