import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";

/**
 * Web Worker との通信をカプセル化し、バッファリングと期待メッセージの待機機能を提供します。
 */
export class WorkerCommunicator {
  private worker: Worker;
  private buffer: unknown[] = [];
  private maxBufferSize = 100;
  private listeners = new Set<(data: unknown) => void>();
  private expectations = new Set<{
    predicate: (data: unknown) => boolean;
    resolve: (data: unknown) => void;
    reject: (reason: unknown) => void;
  }>();

  constructor(scriptUrl: string) {
    this.worker = new Worker(scriptUrl);
    this.worker.onmessage = (ev) => this.handleMessage(ev.data);
    this.worker.onerror = (ev) => this.handleError(ev);
  }

  postMessage(message: unknown, transfer?: Transferable[]): void {
    if (transfer) {
      this.worker.postMessage(message, transfer);
    } else {
      this.worker.postMessage(message);
    }
  }

  private handleMessage(data: unknown): void {
    // 期待されているメッセージか確認
    for (const exp of this.expectations) {
      try {
        if (exp.predicate(data)) {
          this.expectations.delete(exp);
          exp.resolve(data);
          return;
        }
      } catch (err) {
        console.error("Error in message predicate:", err);
      }
    }

    // 全体のリスナーに通知
    for (const listener of this.listeners) {
      listener(data);
    }

    // バッファに保存
    this.buffer.push(data);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
      console.warn("WorkerCommunicator buffer overflow. Oldest message dropped.");
    }
  }

  private handleError(ev: ErrorEvent | { message: string }): void {
    const message = (ev as ErrorEvent).message || (ev as { message: string }).message || "Unknown worker error";
    console.error("Worker error:", message);
    
    const error = new Error(message);
    for (const exp of this.expectations) {
      exp.reject(error);
    }
    this.expectations.clear();
  }

  onMessage(callback: (data: unknown) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async expectMessage<T>(
    predicate: (data: unknown) => boolean,
    options: { timeoutMs?: number; signal?: AbortSignal } = {}
  ): Promise<T> {
    // まずバッファをチェック
    const bufferedIndex = this.buffer.findIndex(predicate);
    if (bufferedIndex !== -1) {
      const data = this.buffer.splice(bufferedIndex, 1)[0];
      return data as T;
    }

    return new Promise<T>((resolve, reject) => {
      const expectation = { 
        predicate, 
        resolve: resolve as (data: unknown) => void,
        reject: reject as (reason: unknown) => void
      };
      this.expectations.add(expectation);

      const cleanup = () => {
        this.expectations.delete(expectation);
      };

      if (options.timeoutMs) {
        setTimeout(() => {
          if (this.expectations.has(expectation)) {
            cleanup();
            reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Message expectation timed out"));
          }
        }, options.timeoutMs);
      }

      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          if (this.expectations.has(expectation)) {
            cleanup();
            reject(options.signal?.reason);
          }
        });
      }
    });
  }

  terminate(): void {
    this.worker.terminate();
    const error = new Error("Worker terminated");
    for (const exp of this.expectations) {
      exp.reject(error);
    }
    this.expectations.clear();
    this.listeners.clear();
  }
}
