import type { ICommunicator } from "./ICommunicator.js";
import { WorkerCommunicator } from "./WorkerCommunicator.js";
import { NativeCommunicator } from "./NativeCommunicator.js";

/**
 * Configuration for the Multi-Runtime Bridge communicator selector.
 *
 * Supply **either** `workerUrl` (browser / WASM) **or** `binaryPath`
 * (Node.js native), never both.  If both are present, `binaryPath` takes
 * priority when running in Node.js, and `workerUrl` is used in browser
 * environments.
 */
export interface RuntimeConfig {
  /**
   * Blob or remote URL of the engine Web Worker JS entry point.
   * Required for browser / WASM mode.
   */
  workerUrl?: string | undefined;

  /**
   * Absolute file-system path to the native engine binary.
   * Required for Node.js / native mode.
   *
   * @example "/usr/local/bin/stockfish"
   * @example "C:\\Engines\\stockfish.exe"
   */
  binaryPath?: string | undefined;
}

/**
 * Detect whether the current execution context is Node.js (or Bun).
 *
 * Returns `true` when `process.versions.node` is available, which is a
 * reliable indicator of Node.js / Bun / Deno-compat environments.
 * Returns `false` in browsers and Service Workers.
 */
export function isNodeEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node === "string"
  );
}

/**
 * Select and instantiate the appropriate `ICommunicator` for the
 * current runtime.
 *
 * | Environment | Config requirement       | Communicator selected     |
 * |-------------|--------------------------|---------------------------|
 * | Browser     | `workerUrl` required     | `WorkerCommunicator`      |
 * | Node.js     | `binaryPath` required    | `NativeCommunicator`      |
 *
 * @throws {Error} If the required config key is missing for the detected
 *   runtime.
 *
 * @example
 * ```typescript
 * // Works in both browser and Node.js:
 * const comm = resolveRuntime({
 *   workerUrl: blobUrl,       // provided after EngineLoader.loadResource()
 *   binaryPath: "/usr/bin/stockfish",
 * });
 * comm.onMessage((line) => parser.feed(line));
 * if (comm instanceof NativeCommunicator) await comm.spawn();
 * ```
 */
export function resolveRuntime(config: RuntimeConfig): ICommunicator {
  if (isNodeEnvironment()) {
    if (!config.binaryPath) {
      throw new Error(
        "Multi-Runtime Bridge: binaryPath is required in Node.js environments. " +
          "Pass the absolute path to the engine binary via config.binaryPath.",
      );
    }
    return new NativeCommunicator(config.binaryPath);
  }

  if (!config.workerUrl) {
    throw new Error(
      "Multi-Runtime Bridge: workerUrl is required in browser environments. " +
        "Load the engine Worker script first and pass the blob URL via config.workerUrl.",
    );
  }
  return new WorkerCommunicator(config.workerUrl);
}
