import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

/**
 * expectMessage のオプション。
 */
export interface IExpectMessageOptions {
  /** タイムアウト時間 (ms) */
  timeoutMs?: number;
  /** キャンセル用のシグナル */
  signal?: AbortSignal;
}

/**
 * 待機中のメッセージ期待値を管理する内部インターフェース。
 */
interface IPendingExpectation {
  predicate: (data: unknown) => boolean;
  /** 
   * 外部から指定された任意の型 T へ安全に変換するため、
   * Promise 解決用として内部的に使用。外部インターフェースでは型安全。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (data: any) => void;
  reject: (reason: Error) => void;
  cleanup: () => void;
}

/**
 * WebWorker との低レイヤー通信を管理するクラス。
 */
export class WorkerCommunicator {
  private worker: Worker | null = null;
  private messageListeners = new Set<(data: unknown) => void>();
  private pendingExpectations = new Set<IPendingExpectation>();

  constructor(private readonly workerUrl: string) {}

  /**
   * Worker インスタンスを生成し、メッセージハンドリングを開始します。
   */
  async spawn(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker(this.workerUrl);
    
    this.worker.onmessage = (e: MessageEvent) => {
      this.messageListeners.forEach((listener) => listener(e.data));

      for (const exp of this.pendingExpectations) {
        try {
          if (exp.predicate(e.data)) {
            exp.cleanup();
            this.pendingExpectations.delete(exp);
            exp.resolve(e.data);
            break; // 最初のマッチで終了
          }
        } catch (err) {
          console.error("[WorkerCommunicator] Predicate failed:", err);
        }
      }
    };

    this.worker.onerror = (e: ErrorEvent) => {
      const error = new EngineError(
        EngineErrorCode.INTERNAL_ERROR,
        `Worker internal error: ${e.message}`
      );
      this.rejectAll(error);
      console.error("[WorkerCommunicator] Error:", e);
    };
  }

  /**
   * 全ての待機中のリクエストを拒否し、クリーンアップします。
   */
  private rejectAll(error: Error): void {
    this.pendingExpectations.forEach((exp) => {
      exp.cleanup();
      exp.reject(error);
    });
    this.pendingExpectations.clear();
  }

  /**
   * Worker へメッセージを送信します。
   */
  postMessage(message: string | Uint8Array | object, transfer?: Transferable[]): void {
    if (!this.worker) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Worker not spawned.");
    }
    this.worker.postMessage(message, transfer || []);
  }

  /**
   * 条件に合致するメッセージを待機します。
   */
  expectMessage<T>(
    predicate: (data: unknown) => boolean,
    options: IExpectMessageOptions = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      
      const cleanup = () => {
        if (timer) clearTimeout(timer);
        options.signal?.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        this.pendingExpectations.delete(expectation);
        reject(new EngineError(EngineErrorCode.INTERNAL_ERROR, "Message expectation was aborted"));
      };

      const expectation: IPendingExpectation = {
        predicate,
        resolve,
        reject,
        cleanup,
      };

      if (options.signal) {
        if (options.signal.aborted) return onAbort();
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      if (options.timeoutMs) {
        timer = setTimeout(() => {
          cleanup();
          this.pendingExpectations.delete(expectation);
          reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, `Message expectation timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs);
      }

      this.pendingExpectations.add(expectation);
    });
  }

  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Worker を終了し、待機中の全ての Promise を reject します。
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.rejectAll(new EngineError(EngineErrorCode.INTERNAL_ERROR, "Worker terminated"));
  }
}
