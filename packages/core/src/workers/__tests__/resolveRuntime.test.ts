import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveRuntime, isNodeEnvironment } from "../resolveRuntime.js";
import { WorkerCommunicator } from "../WorkerCommunicator.js";
import { NativeCommunicator } from "../NativeCommunicator.js";

// ── WorkerCommunicator mock (browser path) ───────────────────────────────────
vi.mock("../WorkerCommunicator.js", () => {
  class WorkerCommunicator {
    postMessage = vi.fn();
    onMessage = vi.fn(() => () => {});
    terminate = vi.fn().mockResolvedValue(undefined);
  }
  return { WorkerCommunicator };
});

// ── NativeCommunicator mock (Node.js path) ───────────────────────────────────
vi.mock("../NativeCommunicator.js", () => {
  class NativeCommunicator {
    spawn = vi.fn().mockResolvedValue(undefined);
    postMessage = vi.fn();
    onMessage = vi.fn(() => () => {});
    terminate = vi.fn().mockResolvedValue(undefined);
  }
  return { NativeCommunicator };
});

// ── Helpers to simulate Node.js vs browser runtime ──────────────────────────

function forceNodeEnv() {
  // Ensure process.versions.node is set (it is in Vitest/Node.js already)
  // This helper documents the assumption; no mutation needed.
}

function forceBrowserEnv(fn: () => void) {
  // Temporarily hide process.versions to simulate a browser environment.
  const origProcess = globalThis.process;
  Object.defineProperty(globalThis, "process", {
    value: undefined,
    writable: true,
    configurable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, "process", {
      value: origProcess,
      writable: true,
      configurable: true,
    });
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("isNodeEnvironment()", () => {
  it("returns true in the current Vitest/Node.js environment", () => {
    expect(isNodeEnvironment()).toBe(true);
  });

  it("returns false when process is undefined (simulated browser)", () => {
    let result: boolean | undefined;
    forceBrowserEnv(() => {
      result = isNodeEnvironment();
    });
    expect(result).toBe(false);
  });
});

describe("resolveRuntime()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Node.js path ───────────────────────────────────────────────────────────

  it("returns a NativeCommunicator when binaryPath is provided in Node.js", () => {
    forceNodeEnv();
    const comm = resolveRuntime({ binaryPath: "/usr/bin/stockfish" });

    expect(comm).toBeInstanceOf(NativeCommunicator);
  });

  it("throws when binaryPath is missing in Node.js environment", () => {
    forceNodeEnv();
    expect(() => resolveRuntime({ workerUrl: "blob:..." })).toThrow(
      /binaryPath is required/i,
    );
  });

  it("prefers NativeCommunicator over WorkerCommunicator when both keys supplied in Node.js", () => {
    forceNodeEnv();
    const comm = resolveRuntime({
      workerUrl: "blob:unused",
      binaryPath: "/usr/bin/engine",
    });

    expect(comm).toBeInstanceOf(NativeCommunicator);
  });

  // ── Browser path ──────────────────────────────────────────────────────────

  it("returns a WorkerCommunicator when workerUrl is provided in browser", () => {
    forceBrowserEnv(() => {
      const comm = resolveRuntime({
        workerUrl: "blob:http://localhost/worker",
      });

      expect(comm).toBeInstanceOf(WorkerCommunicator);
    });
  });

  it("throws when workerUrl is missing in browser environment", () => {
    forceBrowserEnv(() => {
      expect(() => resolveRuntime({ binaryPath: "/path/not/used" })).toThrow(
        /workerUrl is required/i,
      );
    });
  });

  it("uses WorkerCommunicator and ignores binaryPath in browser even if both supplied", () => {
    forceBrowserEnv(() => {
      const comm = resolveRuntime({
        workerUrl: "blob:http://localhost/worker",
        binaryPath: "/usr/bin/engine",
      });

      expect(comm).toBeInstanceOf(WorkerCommunicator);
    });
  });

  it("throws a descriptive error for empty config in browser", () => {
    forceBrowserEnv(() => {
      expect(() => resolveRuntime({})).toThrow(/workerUrl is required/i);
    });
  });

  it("throws a descriptive error for empty config in Node.js", () => {
    forceNodeEnv();
    expect(() => resolveRuntime({})).toThrow(/binaryPath is required/i);
  });
});
