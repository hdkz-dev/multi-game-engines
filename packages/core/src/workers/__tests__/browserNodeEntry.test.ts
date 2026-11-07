import { describe, it, expect, vi } from "vitest";
import {
  NativeCommunicator,
  isNodeEnvironment,
  resolveRuntime,
} from "../../node-browser.js";
import { WorkerCommunicator } from "../WorkerCommunicator.js";

vi.mock("../WorkerCommunicator.js", () => ({
  WorkerCommunicator: vi.fn(
    class {
      postMessage = vi.fn();
      onMessage = vi.fn(() => () => {});
      expectMessage = vi.fn();
      terminate = vi.fn().mockResolvedValue(undefined);
    },
  ),
}));

describe("browser-safe optional native entry", () => {
  it("rejects native process construction even when tested in Node.js", () => {
    expect(() => new NativeCommunicator("/usr/bin/engine")).toThrow(
      "NativeCommunicator is unavailable outside Node.js",
    );
    expect(isNodeEnvironment()).toBe(false);
  });

  it("uses workerUrl even when a native path is supplied", () => {
    const worker = resolveRuntime({
      workerUrl: "blob:verified-worker",
      binaryPath: "/usr/bin/engine",
    });
    expect(worker).toBeInstanceOf(WorkerCommunicator);
    expect(WorkerCommunicator).toHaveBeenLastCalledWith("blob:verified-worker");
  });

  it.each([{}, { binaryPath: "/usr/bin/engine" }])(
    "rejects missing browser worker configuration: %s",
    (config) => {
      expect(() => resolveRuntime(config)).toThrow("workerUrl is required");
    },
  );
});
