import { ChildProcess } from "node:child_process";

/**
 * 2026 Zenith Tier: OS ネイティブバイナリと通信するためのコミュニケーター。
 * Node.js/Bun 環境でのみ動作し、child_process を使用します。
 */
export class NativeCommunicator {
  private child: ChildProcess | null = null;
  private messageListeners = new Set<(data: unknown) => void>();
  private buffer = "";

  constructor(private binaryPath: string) {}

  async spawn(): Promise<void> {
    const { spawn } = await import("node:child_process");
    this.child = spawn(this.binaryPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.child.stdout?.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split(/\r?\n/);
      // 最後の要素は未完了の行である可能性があるため保持
      this.buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          for (const cb of this.messageListeners) cb(line.trim());
        }
      }
    });

    this.child.on("error", (err: Error) => {
      console.error("[NativeCommunicator] Process error:", err);
    });

    this.child.on("exit", (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(
          `[NativeCommunicator] Process exited with code ${code}, signal ${signal}`,
        );
      }
    });
  }

  postMessage(message: string): void {
    if (this.child?.stdin) {
      this.child.stdin.write(`${message}\n`);
    }
  }

  onMessage(callback: (data: unknown) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  terminate(): void {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }
}
