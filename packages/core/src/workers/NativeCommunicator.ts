import type { ChildProcess } from "node:child_process";
import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode } from "../types.js";
import type { ICommunicator } from "./ICommunicator.js";

/**
 * 2026 Zenith Tier: OS ネイティブバイナリと通信するためのコミュニケーター。
 * Node.js/Bun 環境でのみ動作し、child_process を使用します。
 *
 * Implements `ICommunicator` so it can be used interchangeably with
 * `WorkerCommunicator` in adapters that support the Multi-Runtime Bridge.
 *
 * Note: `postMessage` converts the value to a string before writing to
 * stdin, so callers should pass string commands for cross-runtime compatibility.
 *
 * `node:child_process` is imported dynamically inside `spawn` so that
 * browser bundlers (Webpack, Turbopack, Vite) do not encounter a static
 * reference to a Node.js built-in and can safely tree-shake this class away.
 */
export class NativeCommunicator implements ICommunicator {
  private child: ChildProcess | null = null;
  private messageListeners: Set<(data: unknown) => void> = new Set();
  private buffer = "";

  constructor(private readonly binaryPath: string) {}

  /**
   * エンジンプロセスを起動します。
   */
  async spawn(): Promise<void> {
    if (this.child) return;

    // Dynamic import keeps `node:child_process` out of the static module graph
    // so browser bundlers do not attempt to resolve or bundle it.
    const { spawn } = await import("node:child_process");

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
   * 特定の条件を満たすメッセージを待機します。
   *
   * WorkerCommunicator と同一のセマンティクスを提供します。
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
    const timeoutMs =
      typeof options === "number" ? options : (options.timeoutMs ?? 5000);
    const signal = typeof options === "number" ? undefined : options.signal;

    const id = Math.random().toString(36).substring(2);
    const pending = new Map<
      string,
      {
        resolve: (data: unknown) => void;
        reject: (err: unknown) => void;
        predicate: (data: unknown) => boolean;
      }
    >();

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          unsub();
          reject(
            new EngineError({
              code: EngineErrorCode.TIMEOUT,
              message: "Timed out waiting for native engine message",
            }),
          );
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abortHandler);
      };

      const abortHandler = () => {
        if (pending.has(id)) {
          pending.delete(id);
          cleanup();
          unsub();
          reject(
            new EngineError({
              code: EngineErrorCode.CANCELLED,
              message: "Operation cancelled",
            }),
          );
        }
      };

      signal?.addEventListener("abort", abortHandler);

      pending.set(id, {
        resolve: (data) => {
          cleanup();
          unsub();
          resolve(data as T);
        },
        reject: (err) => {
          cleanup();
          unsub();
          reject(err);
        },
        predicate,
      });

      const unsub = this.onMessage((data) => {
        const entry = pending.get(id);
        if (entry && entry.predicate(data)) {
          pending.delete(id);
          entry.resolve(data);
        }
      });
    });
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
