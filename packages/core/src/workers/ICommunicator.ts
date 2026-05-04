/**
 * Common communicator interface shared by WorkerCommunicator (browser/WASM)
 * and NativeCommunicator (Node.js child-process).
 *
 * Adopting this interface in BaseAdapter enables the Multi-Runtime Bridge:
 * the same adapter implementation can target both runtimes without any
 * adapter-level branching.
 *
 * @example
 * ```typescript
 * // In a Node.js script (Stockfish native binary):
 * const comm = new NativeCommunicator("/usr/bin/stockfish");
 * await comm.spawn();
 *
 * // In a browser (Stockfish WASM worker):
 * const comm = new WorkerCommunicator(workerBlobUrl);
 *
 * // Both satisfy ICommunicator — swap freely.
 * ```
 */
export interface ICommunicator {
  /**
   * Send a message/command to the engine.
   *
   * WorkerCommunicator accepts any structured-cloneable value (sent via
   * Worker postMessage).  NativeCommunicator converts the value to a string
   * and writes it to stdin, so prefer string values for cross-runtime compat.
   */
  postMessage(message: unknown): void;

  /**
   * Register a listener for engine output.
   *
   * Returns an unsubscribe function; call it to remove the listener.
   */
  onMessage(callback: (data: unknown) => void): () => void;

  /**
   * Wait for the next message that satisfies `predicate`.
   *
   * Rejects with an `EngineError(TIMEOUT)` after `options.timeoutMs` ms
   * (default 5000) and with `EngineError(CANCELLED)` if the provided
   * `AbortSignal` fires first.
   */
  expectMessage<T>(
    predicate: (data: unknown) => boolean,
    options?:
      | number
      | {
          timeoutMs?: number | undefined;
          signal?: AbortSignal | undefined;
        },
  ): Promise<T>;

  /**
   * Gracefully terminate the engine, then clean up resources.
   */
  terminate(): Promise<void>;
}
