import { IFileStorage } from "../types";

/**
 * OPFS (Origin Private File System) を使用した高速なファイルストレージ実装。
 */
export class OPFSStorage implements IFileStorage {
  private rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

  private getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootPromise) {
      this.rootPromise = navigator.storage.getDirectory().catch((err) => {
        this.rootPromise = null;
        throw err;
      });
    }
    return this.rootPromise;
  }

  async set(key: string, data: ArrayBuffer | Blob): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle(key, { create: true });
    const writable = await fileHandle.createWritable();
    
    try {
      await writable.write(data);
      await writable.close();
    } catch (err) {
      await writable.abort().catch(() => {});
      throw err;
    }
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle(key);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch (err) {
      // 2026 Best Practice: NotFoundError のみを null とし、他は例外として扱う
      if (err instanceof DOMException && err.name === "NotFoundError") {
        return null;
      }
      throw err;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const root = await this.getRoot();
      await root.getFileHandle(key);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const root = await this.getRoot();
    await root.removeEntry(key);
  }

  async clear(): Promise<void> {
    const root = await this.getRoot();
    // 互換性チェック
    const r = root as any;
    if (typeof r.keys === "function") {
      for await (const name of r.keys()) {
        await root.removeEntry(name, { recursive: true }).catch(() => {});
      }
    }
  }
}
