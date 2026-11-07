/**
 * Browser-safe fallback for the optional native subpath.
 * Native binaries remain available through the Node.js conditional export.
 */
import { WorkerCommunicator } from "./workers/WorkerCommunicator.js";
import type { ICommunicator } from "./workers/ICommunicator.js";
import type { RuntimeConfig } from "./workers/resolveRuntime.js";

export type { ICommunicator, RuntimeConfig };

/** Reject native process construction in a browser bundle. */
export class NativeCommunicator {
  constructor(_binaryPath: string) {
    throw new Error("NativeCommunicator is unavailable outside Node.js");
  }
}

/** Browser/default package resolution never selects native process APIs. */
export function isNodeEnvironment(): boolean {
  return false;
}

/** Select the browser worker transport without importing Node.js builtins. */
export function resolveRuntime(config: RuntimeConfig): ICommunicator {
  if (!config.workerUrl) {
    throw new Error(
      "Multi-Runtime Bridge: workerUrl is required in browser environments",
    );
  }
  return new WorkerCommunicator(config.workerUrl);
}
