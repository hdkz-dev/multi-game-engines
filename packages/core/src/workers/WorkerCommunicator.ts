import { EngineError } from "../errors/EngineError";
import { EngineErrorCode } from "../types";

/**
 * WebWorker との低レイヤー通信を管理するクラス。
 * 
 * 主な機能:
 * - メッセージの送受信 (postMessage)
 * - 特定のレスポンスを待機する Promise ベースのインターフェース (expectMessage)
 * - Worker 内部エラーの検知と、待機中の Promise への例外伝播
 */
export class WorkerCommunicator {
  private worker: Worker | null = null;
  /** メッセージ受信時の全リスナー */
  private messageListeners = new Set<(data: unknown) => void>();
  /** 
   * expectMessage で待機中のプロミスを管理するためのセット。
   * エラー発生時に一括で reject するために使用。
   */
  private pendingExpectations = new Set<{
    predicate: (data: unknown) => boolean;
    // 外部から指定された任意の型 T へ変換するため、意図的に any を使用。
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (data: any) => void;
    reject: (reason: Error) => void;
  }>();

  constructor(private readonly workerUrl: string) {}

  /**
   * Worker インスタンスを生成し、メッセージハンドリングを開始します。
   */
  async spawn(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker(this.workerUrl);
    
    // 正常なメッセージの受信
    this.worker.onmessage = (e: MessageEvent) => {
      // 1. グローバルリスナーへの通知
      this.messageListeners.forEach((listener) => listener(e.data));

      // 2. 待機中の expectMessage プロミスの解決チェック
      for (const exp of this.pendingExpectations) {
        if (exp.predicate(e.data)) {
          this.pendingExpectations.delete(exp);
          exp.resolve(e.data);
        }
      }
    };

    // Worker 内部でのエラー発生時
    this.worker.onerror = (e: ErrorEvent) => {
      const error = new EngineError(
        EngineErrorCode.INTERNAL_ERROR,
        `Worker error: ${e.message}`
      );
      
      // 待機中の全ての Promise を異常終了させる (ハングアップ防止)
      this.pendingExpectations.forEach((exp) => exp.reject(error));
      this.pendingExpectations.clear();
      
      console.error("WorkerCommunicator Error:", e);
    };
  }

  /**
   * Worker へメッセージを送信します。
   * 
   * @param message 送信データ (文字列、バイナリ、または UCI コマンド)
   * @param transfer ゼロコピー転送を行う ArrayBuffer 等のリスト
   */
  postMessage(message: string | Uint8Array | object, transfer?: Transferable[]): void {
    if (!this.worker) {
      throw new EngineError(EngineErrorCode.INTERNAL_ERROR, "Worker has not been spawned yet.");
    }
    this.worker.postMessage(message, transfer || []);
  }

  /**
   * 条件に合致するメッセージが Worker から届くまで非同期で待機します。
   * 
   * @param predicate 受信データが期待するものか判定する関数
   * @returns 期待するデータが届いた時に解決される Promise
   */
  expectMessage<T>(predicate: (data: unknown) => boolean): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pendingExpectations.add({ predicate, resolve, reject });
    });
  }

  /**
   * メッセージの購読を開始します。
   * 
   * @returns 購読を解除するための関数
   */
  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Worker を即座に終了し、全ての待機状態をクリアします。
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageListeners.clear();
    this.pendingExpectations.clear();
  }
}
