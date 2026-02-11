import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

/**
 * WebWorker との型安全な双方向通信を抽象化するクラス。
 * 2026 Best Practice: メッセージバッファリングによるレースコンディション防止。
 */
export class WorkerCommunicator {
  private worker: Worker;
  private messageListeners = new Set<(data: unknown) => void>();
  private pendingExpectations = new Set<{
    predicate: (data: unknown) => boolean;
    resolve: (data: unknown) => void;
    reject: (reason: Error) => void;
  }>();

  // レースコンディション対策: まだ期待されていないメッセージを一時保持するキュー
  private messageBuffer: unknown[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (e: MessageEvent) => this.handleIncomingMessage(e.data);
    this.worker.onerror = (e: ErrorEvent) => this.handleError(e);
  }

  /**
   * メッセージを送信します。
   */
  postMessage(data: unknown): void {
    this.worker.postMessage(data);
  }

  /**
   * 受信メッセージのハンドリング。
   */
  private handleIncomingMessage(data: unknown): void {
    let handled = false;

    // 1. 待機中の expectation を優先的に解決
    for (const exp of this.pendingExpectations) {
      try {
        if (exp.predicate(data)) {
          this.pendingExpectations.delete(exp);
          exp.resolve(data);
          handled = true;
          break; // 最初の一致で終了
        }
      } catch (err) {
        console.error("[WorkerCommunicator] Predicate error:", err);
      }
    }

    // 2. 汎用リスナーへの通知
    for (const listener of this.messageListeners) {
      listener(data);
    }

    // 3. 解決されなかったメッセージはバッファに保存（期待されるメッセージの先行到着対策）
    if (!handled) {
      this.messageBuffer.push(data);
      if (this.messageBuffer.length > this.MAX_BUFFER_SIZE) {
        this.messageBuffer.shift(); // 古いメッセージを捨てる
      }
    }
  }

  /**
   * 特定の条件を満たすメッセージを待機します。
   */
  expectMessage<T>(
    predicate: (data: unknown) => boolean,
    timeoutMs: number = 5000
  ): Promise<T> {
    // 2026 Best Practice: まずバッファ内を探索し、先行して届いているメッセージを処理
    for (let i = 0; i < this.messageBuffer.length; i++) {
      const bufferedData = this.messageBuffer[i];
      if (predicate(bufferedData)) {
        this.messageBuffer.splice(i, 1); // 消費
        return Promise.resolve(bufferedData as T);
      }
    }

    return new Promise<T>((resolve, reject) => {
      const expectation = {
        predicate,
        resolve: (data: unknown) => {
          clearTimeout(timer);
          resolve(data as T);
        },
        reject: (reason: Error) => {
          clearTimeout(timer);
          reject(reason);
        }
      };

      const timer = setTimeout(() => {
        this.pendingExpectations.delete(expectation);
        reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Message expectation timed out"));
      }, timeoutMs);

      this.pendingExpectations.add(expectation);
    });
  }

  /**
   * メッセージリスナーを追加します。
   */
  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * 通信を終了します。
   */
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
