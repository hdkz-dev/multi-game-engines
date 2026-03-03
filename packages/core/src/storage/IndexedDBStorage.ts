import { IFileStorage } from "../types.js";

/**
 * 2026 Zenith Tier: IndexedDB を使用した物理ストレージ実装。
 */
export class IndexedDBStorage implements IFileStorage {
  private static readonly DB_NAME = "multi-game-engines";
  private static readonly STORE_NAME = "engine-cache";
  private db: IDBDatabase | null = null;

  /**
   * テスト用: 内部 DB インスタンスを取得します。
   */
  async getDB(): Promise<IDBDatabase> {
    return this.ensureDb();
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([IndexedDBStorage.STORE_NAME], "readonly");
        const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
      } catch (err) {
        this.handleDbError(err);
        reject(err);
      }
    });
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([IndexedDBStorage.STORE_NAME], "readwrite");
        const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
        const request = store.put(data, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
      } catch (err) {
        this.handleDbError(err);
        reject(err);
      }
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([IndexedDBStorage.STORE_NAME], "readwrite");
        const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
      } catch (err) {
        this.handleDbError(err);
        reject(err);
      }
    });
  }

  async has(key: string): Promise<boolean> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([IndexedDBStorage.STORE_NAME], "readonly");
        const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
        const request = store.count(key);

        request.onsuccess = () => resolve(request.result > 0);
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
      } catch (err) {
        this.handleDbError(err);
        reject(err);
      }
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([IndexedDBStorage.STORE_NAME], "readwrite");
        const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
      } catch (err) {
        this.handleDbError(err);
        reject(err);
      }
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    // 物理的な接続ロスや InvalidState を検知
    if (this.db) {
      try {
        // ダミーのトランザクションで生存確認
        this.db.transaction([IndexedDBStorage.STORE_NAME], "readonly");
        return this.db;
      } catch {
        this.db = null;
      }
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBStorage.DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IndexedDBStorage.STORE_NAME)) {
          db.createObjectStore(IndexedDBStorage.STORE_NAME);
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => { this.db = null; };
        this.db.onerror = () => { this.db = null; };
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private handleDbError(err: any): void {
    if (err && (err.name === "InvalidStateError" || err.name === "TransactionInactiveError")) {
      this.db = null;
    }
  }
}
