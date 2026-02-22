import { IFileStorage } from "../types.js";

/**
 * Origin Private File System (OPFS) を使用したファイルストレージ実装。
 * 2026年時点でのブラウザ標準 API を使用し、バイナリデータの高速な読み書きを実現します。
 */
export class OPFSStorage implements IFileStorage {
  private async getDirectory(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory();
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    try {
      const root = await this.getDirectory();
      const fileHandle = await root.getFileHandle(key);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch {
      // ファイルが存在しない、またはアクセス権限がない場合は null を返す
      return null;
    }
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    const root = await this.getDirectory();
    const fileHandle = await root.getFileHandle(key, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(data);
      await writable.close();
    } catch (error) {
      try {
        await writable.abort();
      } catch {
        // abort 失敗は二次的エラーのため抑制し、元のエラーを優先する
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const root = await this.getDirectory();
      await root.removeEntry(key);
    } catch {
      // ファイルが存在しない場合は何もしない
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const root = await this.getDirectory();
      await root.getFileHandle(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    const root = await this.getDirectory();
    // 2026 Best Practice: Feature detection for non-standard iterator without using 'any'
    const rootWithKeys = root as FileSystemDirectoryHandle & {
      keys?(): AsyncIterable<string>;
    };

    if (typeof rootWithKeys.keys === "function") {
      for await (const name of rootWithKeys.keys()) {
        await root.removeEntry(name, { recursive: true });
      }
    } else {
      console.warn(
        "[OPFSStorage] Directory iteration not supported in this browser.",
      );
    }
  }
}
