/**
 * @multi-game-engines/core/node
 *
 * Node.js-only entry point.  Import this subpath when building adapters that
 * run in Node.js (CLI tools, desktop apps, server-side analysis pipelines).
 *
 * **Do not import this from browser code.**  Browser bundles (webpack,
 * Turbopack, Vite) will fail to resolve the `node:child_process` dependency
 * that NativeCommunicator uses internally.
 *
 * @example
 * ```typescript
 * import { NativeCommunicator, resolveRuntime } from "@multi-game-engines/core/node";
 *
 * const comm = resolveRuntime({ binaryPath: "/usr/bin/stockfish" });
 * if (comm instanceof NativeCommunicator) await comm.spawn();
 * ```
 */

export type { ICommunicator } from "./workers/ICommunicator.js";
export { NativeCommunicator } from "./workers/NativeCommunicator.js";
export { resolveRuntime, isNodeEnvironment } from "./workers/resolveRuntime.js";
export type { RuntimeConfig } from "./workers/resolveRuntime.js";
