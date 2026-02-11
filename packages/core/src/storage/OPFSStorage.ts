import { IFileStorage } from "../types";

/**
 * OPFS (Origin Private File System) を使用したストレージ実装。
 * 高速なファイルアクセスが可能で、大容量バイナリの保存に適しています。
 */
export class OPFSStorage implements IFileStorage {
  private rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

  private getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootPromise) {
      this.rootPromise = navigator.storage.getDirectory();
    }
    return this.rootPromise;
  }

  async set(key: string, data: ArrayBuffer | Blob): Promise<void> {
    const root = await this.getRoot();
    const fileHandle = await root.getFileHandle(key, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    try {
      const root = await this.getRoot();
      const fileHandle = await root.getFileHandle(key);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch {
      // ファイルが存在しない場合は null を返す
      return null;
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
    try {
      const root = await this.getRoot();
      await root.removeEntry(key);
    } catch {
      // 存在しない場合は無視
    }
  }

  async clear(): Promise<void> {
    const root = await this.getRoot();
    /**
     * OPFS のディレクトリハンドルから全エントリを反復処理して削除。
     * 標準の TypeScript 型定義に keys() が含まれない場合があるため、
     * 実行環境の動的チェックを行った上で意図的に any を使用。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('keys' in root && typeof (root as any).keys === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const name of (root as any).keys()) {
        await root.removeEntry(name, { recursive: true });
      }
    }
  }
}
