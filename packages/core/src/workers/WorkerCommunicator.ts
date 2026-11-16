import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";
import type { ICommunicator } from "./ICommunicator.js";

/**
 * 2026 Zenith Tier: Worker との物理的な通信を管理。
 *
 * Implements `ICommunicator` so it can be used interchangeably with
 * `NativeCommunicator` in adapters that support the Multi-Runtime Bridge.
 */
export class WorkerCommunicator implements ICommunicator {
  private worker: Worker;
  private terminalError: Error | undefined;
  private pendingExpectations = new Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (err: unknown) => void;
      predicate: (data: unknown) => boolean;
    }
  >();
  private messageListeners = new Set<(data: unknown) => void>();

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (event) => this.handleMessage(event.data);
    this.worker.onerror = (error) => this.handleError(error);
  }

  /**
   * Worker へメッセージを送信します。
   */
  postMessage(message: unknown): void {
    if (this.terminalError) throw this.terminalError;
    this.worker.postMessage(message);
  }

  private errorListeners = new Set<(error: Error) => void>();

  onError(callback: (error: Error) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * 特定の条件を満たすメッセージを待機します。
   */
  expectMessage<T>(
    predicate: (data: unknown) => boolean,
    options:
      | number
      | {
          timeoutMs?: number | undefined;
          signal?: AbortSignal | undefined;
        } = 5000,
  ): Promise<T> {
    if (this.terminalError) return Promise.reject(this.terminalError);
    const timeoutMs =
      typeof options === "number" ? options : (options.timeoutMs ?? 5000);
    const signal = typeof options === "number" ? undefined : options.signal;
    if (signal?.aborted) {
      return Promise.reject(
        new EngineError({
          code: EngineErrorCode.CANCELLED,
          message: "Operation cancelled",
        }),
      );
    }

    const id = Math.random().toString(36).substring(2);
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingExpectations.has(id)) {
          cleanup();
          this.pendingExpectations.delete(id);
          reject(
            new EngineError({
              code: EngineErrorCode.TIMEOUT,
              message: "Timed out waiting for worker message",
            }),
          );
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abortHandler);
      };

      const abortHandler = () => {
        if (this.pendingExpectations.has(id)) {
          this.pendingExpectations.delete(id);
          cleanup();
          reject(
            new EngineError({
              code: EngineErrorCode.CANCELLED,
              message: "Operation cancelled",
            }),
          );
        }
      };

      signal?.addEventListener("abort", abortHandler);

      this.pendingExpectations.set(id, {
        resolve: (data) => {
          cleanup();
          resolve(data as T);
        },
        reject: (err) => {
          cleanup();
          reject(err);
        },
        predicate,
      });
    });
  }

  /**
   * Worker を物理的に終了し、保留中のタスクを全てリジェクトします。
   */
  async terminate(): Promise<void> {
    for (const expectation of this.pendingExpectations.values()) {
      expectation.reject(new Error("Worker terminated"));
    }
    this.pendingExpectations.clear();
    this.messageListeners.clear();
    this.errorListeners.clear();

    this.worker.terminate();
  }

  private handleMessage(data: unknown): void {
    for (const [id, expectation] of this.pendingExpectations.entries()) {
      if (expectation.predicate(data)) {
        expectation.resolve(data);
        this.pendingExpectations.delete(id);
      }
    }
    for (const listener of this.messageListeners) {
      listener(data);
    }
  }

  private handleError(error: ErrorEvent): void {
    console.error("Worker error:", error);
    const err = new Error(error.message || "Worker error");
    this.terminalError = err;
    for (const expectation of this.pendingExpectations.values()) {
      expectation.reject(err);
    }
    this.pendingExpectations.clear();
    for (const listener of this.errorListeners) listener(err);
  }
}
