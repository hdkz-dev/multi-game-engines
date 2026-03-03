import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";

/**
 * 2026 Zenith Tier: Worker との物理的な通信を管理。
 * メッセージの送受信、期待される応答の待機、およびライフサイクル（終了）を制御。
 */
export class WorkerCommunicator {
  private worker: Worker;
  private pendingExpectations = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void; predicate: (data: any) => boolean }>();
  private messageListeners = new Set<(data: any) => void>();

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (event) => this.handleMessage(event.data);
    this.worker.onerror = (error) => this.handleError(error);
  }

  postMessage(message: any): void {
    this.worker.postMessage(message);
  }

  onMessage(callback: (data: any) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * 特定の条件を満たすメッセージを待機します。
   */
  expectMessage<T>(predicate: (data: any) => boolean, timeout = 5000): Promise<T> {
    const id = Math.random().toString(36).substring(2);
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingExpectations.has(id)) {
          this.pendingExpectations.delete(id);
          reject(new EngineError({
            code: EngineErrorCode.TIMEOUT,
            message: "Timed out waiting for worker message",
          }));
        }
      }, timeout);

      this.pendingExpectations.set(id, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
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
    // 物理的整合性: 保留中の expectation を全てリジェクトしてハングを防止
    for (const expectation of this.pendingExpectations.values()) {
      expectation.reject(new Error("Worker terminated"));
    }
    this.pendingExpectations.clear();
    this.messageListeners.clear();
    
    this.worker.terminate();
  }

  private handleMessage(data: any): void {
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
    for (const expectation of this.pendingExpectations.values()) {
      expectation.reject(new Error(error.message || "Worker error"));
    }
    this.pendingExpectations.clear();
  }
}
