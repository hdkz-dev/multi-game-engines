import { IFileStorage } from "../types.js";

/**
 * IndexedDB を使用したファイルストレージ実装。
 * OPFS が利用できない環境（古いブラウザや特定のコンテキスト）でのフォールバックとして使用されます。
 */
export class IndexedDBStorage implements IFileStorage {
  private static DB_NAME = "multi-game-engines-cache";
  private static STORE_NAME = "files";
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBStorage.DB_NAME, 1);
      let blockedTimer: ReturnType<typeof setTimeout> | null = null;

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IndexedDBStorage.STORE_NAME)) {
          db.createObjectStore(IndexedDBStorage.STORE_NAME);
        }
      };

      request.onblocked = () => {
        // 2026 Best Practice: ブロックは一時的な可能性があるため、タイムアウト待機を導入
        if (!blockedTimer) {
          blockedTimer = setTimeout(() => {
            this.dbPromise = null;
            reject(new Error("IndexedDB open blocked by another connection"));
          }, 10000);
        }
      };

      request.onsuccess = () => {
        if (blockedTimer) clearTimeout(blockedTimer);
        const db = request.result;
        this.db = db;

        // 2026 Best Practice: 接続が無効になったらキャッシュをクリア
        db.onclose = () => {
          this.db = null;
          this.dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          this.db = null;
          this.dbPromise = null;
        };

        resolve(db);
      };

      request.onerror = () => {
        if (blockedTimer) clearTimeout(blockedTimer);
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        IndexedDBStorage.STORE_NAME,
        "readonly",
      );
      const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        IndexedDBStorage.STORE_NAME,
        "readwrite",
      );
      const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
      store.put(data, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        IndexedDBStorage.STORE_NAME,
        "readwrite",
      );
      const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
      store.delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async has(key: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        IndexedDBStorage.STORE_NAME,
        "readonly",
      );
      const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
      const request = store.count(key);

      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        IndexedDBStorage.STORE_NAME,
        "readwrite",
      );
      const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
}
