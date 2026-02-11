import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

/**
 * WebWorker との型安全な双方向通信を抽象化するクラス。
 * 2026 Best Practice: メッセージバッファリングと AbortSignal による中断制御。
 */
export class WorkerCommunicator {
  private worker: Worker;
  private messageListeners = new Set<(data: unknown) => void>();
  private pendingExpectations = new Set<{
    predicate: (data: unknown) => boolean;
    resolve: (data: unknown) => void;
    reject: (reason: Error) => void;
  }>();

  private messageBuffer: unknown[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (e: MessageEvent) => this.handleIncomingMessage(e.data);
    this.worker.onerror = (e: ErrorEvent) => this.handleError(e);
  }

  postMessage(data: unknown): void {
    this.worker.postMessage(data);
  }

  private handleIncomingMessage(data: unknown): void {
    let handled = false;

    for (const exp of this.pendingExpectations) {
      try {
        if (exp.predicate(data)) {
          this.pendingExpectations.delete(exp);
          exp.resolve(data);
          handled = true;
          break;
        }
      } catch (err) {
        console.error("[WorkerCommunicator] Predicate error:", err);
      }
    }

    for (const listener of this.messageListeners) {
      listener(data);
    }

    // どの expectation にもマッチしなかったメッセージはバッファに保存。
    // 非同期通信において、expectMessage を呼び出す前にレスポンスが届くレースコンディションを防止。
    if (!handled) {
      this.messageBuffer.push(data);
      if (this.messageBuffer.length > this.MAX_BUFFER_SIZE) {
        this.messageBuffer.shift();
      }
    }
  }

  /**
   * 特定の条件を満たすメッセージを待機します。
   * バッファ内に既にマッチするメッセージがある場合は即座に解決します。
   * @param predicate 適合条件
   * @param options タイムアウトや中断シグナル
   */
  expectMessage<T>(
    predicate: (data: unknown) => boolean,
    options: { timeoutMs?: number; signal?: AbortSignal } = {}
  ): Promise<T> {
    const { timeoutMs = 5000, signal } = options;

    // 1. 事前中断チェック
    if (signal?.aborted) {
      return Promise.reject(signal.reason);
    }

    // 2. バッファ内を探索
    for (let i = 0; i < this.messageBuffer.length; i++) {
      const bufferedData = this.messageBuffer[i];
      if (predicate(bufferedData)) {
        this.messageBuffer.splice(i, 1);
        return Promise.resolve(bufferedData as T);
      }
    }

    return new Promise<T>((resolve, reject) => {
      const expectation = {
        predicate,
        resolve: (data: unknown) => {
          cleanup();
          resolve(data as T);
        },
        reject: (reason: Error) => {
          cleanup();
          reject(reason);
        }
      };

      // クリーンアップ処理の集約
      const cleanup = () => {
        this.pendingExpectations.delete(expectation);
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        reject(signal?.reason || new Error("Aborted"));
      };

      const timer = timeoutMs > 0 ? setTimeout(() => {
        cleanup();
        reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Message expectation timed out"));
      }, timeoutMs) : null;

      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }

      this.pendingExpectations.add(expectation);
    });
  }

  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  terminate(): void {
    const error = new Error("Communicator terminated");
    for (const exp of this.pendingExpectations) {
      exp.reject(error);
    }
    this.pendingExpectations.clear();
    this.messageListeners.clear();
    this.messageBuffer = [];
    this.worker.terminate();
  }

  private handleError(e: ErrorEvent): void {
    const error = new EngineError(EngineErrorCode.INTERNAL_ERROR, e.message);
    for (const exp of this.pendingExpectations) {
      exp.reject(error);
    }
    this.pendingExpectations.clear();
  }
}
