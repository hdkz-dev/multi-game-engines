import { IFileStorage } from "../types";

/**
 * OPFS (Origin Private File System) を使用したストレージ実装。
 * 高速なファイルアクセスが可能で、大容量バイナリの保存に適しています。
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
      if ((err as DOMException).name === 'NotFoundError') {
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
    } catch (err) {
      if ((err as DOMException).name === 'NotFoundError') {
        return false;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const root = await this.getRoot();
      await root.removeEntry(key);
    } catch (err) {
      if ((err as DOMException).name === 'NotFoundError') {
        return;
      }
      throw err;
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
        try {
          await root.removeEntry(name, { recursive: true });
        } catch {
          // 個別の削除失敗は無視して続行
        }
      }
    } else {
      console.warn('[OPFSStorage] clear() is not supported: directory.keys() unavailable');
    }
  }
}
