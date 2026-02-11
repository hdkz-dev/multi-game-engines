import { IFileStorage } from "../types";

/**
 * IndexedDB を使用したストレージ実装。
 * OPFS が利用できない環境でのフォールバックとして機能します。
 */
export class IndexedDBStorage implements IFileStorage {
  private readonly DB_NAME = "multi-game-engines-cache";
  private readonly STORE_NAME = "files";
  private db: IDBDatabase | null = null;

  /**
   * データベース接続を取得します。
   * 接続が切断された場合やバージョン変更時には自動的にクリアされます。
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(this.STORE_NAME)) {
          request.result.createObjectStore(this.STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        
        // ライフサイクル管理
        db.onclose = () => { this.db = null; };
        db.onversionchange = () => {
          db.close();
          this.db = null;
        };

        this.db = db;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, data: ArrayBuffer | Blob): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(data, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);
      request.onsuccess = async () => {
        const result = request.result;
        if (!result) return resolve(null);
        if (result instanceof Blob) {
          resolve(await result.arrayBuffer());
        } else {
          resolve(result as ArrayBuffer);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async has(key: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, "readonly");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.count(key);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, "readwrite");
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
