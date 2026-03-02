import { ChildProcess, spawn } from "node:child_process";

/**
 * 2026 Zenith Tier: OS ネイティブバイナリと通信するためのコミュニケーター。
 * Node.js/Bun 環境でのみ動作し、child_process を使用します。
 */
export class NativeCommunicator {
  private child: ChildProcess | null = null;
  private messageListeners: Set<(data: unknown) => void> = new Set();
  private buffer = "";

  constructor(private readonly binaryPath: string) {}

  /**
   * エンジンプロセスを起動します。
   */
  async spawn(): Promise<void> {
    if (this.child) return;

    this.child = spawn(this.binaryPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    if (!this.child.stdout || !this.child.stdin) {
      throw new Error("Failed to initialize engine process streams.");
    }

    this.child.stdout.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          for (const listener of this.messageListeners) {
            listener(trimmed);
          }
        }
      }
    });

    // プロセス終了時のクリーンアップ
    this.child.on("exit", () => {
      this.child = null;
    });
  }

  /**
   * エンジンにメッセージを送信します。
   */
  postMessage(message: string): void {
    if (!this.child || !this.child.stdin) {
      throw new Error("NativeCommunicator not connected.");
    }
    this.child.stdin.write(`${message}\n`);
  }

  /**
   * メッセージ受信リスナーを登録します。
   */
  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * エンジンプロセスを物理的に終了し、完全に停止するまで待機します。
   * (2026 Zenith Tier: Guaranteed Deterministic Cleanup)
   */
  async terminate(): Promise<void> {
    if (!this.child) return;

    const child = this.child;
    this.child = null;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 2000); // 2秒待機して強制終了

      child.on("exit", () => {
        clearTimeout(timer);
        resolve();
      });

      child.kill("SIGTERM");
    });
  }
}
