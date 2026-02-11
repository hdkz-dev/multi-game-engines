import { IFileStorage } from "../types";

/**
 * OPFS (Origin Private File System) を使用したストレージ実装。
 */
export class OPFSStorage implements IFileStorage {
  private rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

  private getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.rootPromise) {
      this.rootPromise = navigator.storage.getDirectory().catch((err) => {
        this.rootPromise = null; // 次回呼び出し時に再試行を許可
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
      // 書き込みエラー時は確実にストリームを破棄し、ファイルロックを解除
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
      /** 
       * ファイルが存在しない場合は null を返し、
       * 権限エラーや破損などの致命的例外は再送出する。
       */
      if (err instanceof DOMException && err.name === 'NotFoundError') {
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
      if (err instanceof DOMException && err.name === 'NotFoundError') {
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
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        return;
      }
      throw err;
    }
  }

  async clear(): Promise<void> {
    const root = await this.getRoot();
    
    // 実行環境における反復処理のサポートを確認
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('keys' in root && typeof (root as any).keys === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const name of (root as any).keys()) {
        try {
          await root.removeEntry(name, { recursive: true });
        } catch {
          // 個別エントリの削除失敗はログ出力に留め、全体処理を続行
        }
      }
    } else {
      console.warn('[OPFSStorage] directory.keys() is unavailable. clear() operation skipped.');
    }
  }
}
