import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { forceCloseDatabase, IDBFactory } from "fake-indexeddb";
import { IndexedDBStorage } from "../IndexedDBStorage.js";

describe("IndexedDBStorage", () => {
  let storage: IndexedDBStorage;

  beforeEach(() => {
    // テスト間のDB状態をリセット
    globalThis.indexedDB = new IDBFactory();
    storage = new IndexedDBStorage();
    // 2026 Best Practice: 決定性向上のためのモック
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set and get data", async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    await storage.set("test-key", data);
    const result = await storage.get("test-key");
    expect(result).toEqual(data);
  });

  it("should return null for non-existent keys", async () => {
    const result = await storage.get("non-existent");
    expect(result).toBeNull();
  });

  it("should check if key exists", async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    await storage.set("test-key", data);
    const exists = await storage.has("test-key");
    expect(exists).toBe(true);
    const nonExistent = await storage.has("missing");
    expect(nonExistent).toBe(false);
  });

  it("should delete entry", async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    await storage.set("test-key", data);
    await storage.delete("test-key");
    const exists = await storage.has("test-key");
    expect(exists).toBe(false);
  });

  it("should clear all entries", async () => {
    await storage.set("key1", new Uint8Array([1]).buffer);
    await storage.set("key2", new Uint8Array([2]).buffer);
    await storage.clear();
    expect(await storage.has("key1")).toBe(false);
    expect(await storage.has("key2")).toBe(false);
  });

  it("should handle connection loss and re-open", async () => {
    await storage.set("key1", new Uint8Array([1]).buffer);

    // 内部DBを取得して手動で閉じる（ライフサイクルハンドラの検証）
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();
    // fake-indexeddb の公式 API で異常クローズをシミュレート
    // Note: fake-indexeddb v6 の型定義の不備（インスタンスではなくクラスを要求する）を
    // 回避するため、型定義に合わせたキャストを使用。
    forceCloseDatabase(
      db as unknown as Parameters<typeof forceCloseDatabase>[0],
    );

    // 次の操作で再オープンされるはず
    await storage.set("key2", new Uint8Array([2]).buffer);
    expect(await storage.has("key1")).toBe(true);
    expect(await storage.has("key2")).toBe(true);
  });

  it("should handle version change and re-open", async () => {
    await storage.set("key1", new Uint8Array([1]).buffer);

    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();
    // onversionchange をシミュレート
    if (db.onversionchange) {
      db.onversionchange(new IDBVersionChangeEvent("versionchange"));
    }

    // 再オープンされるはず
    await storage.set("key2", new Uint8Array([2]).buffer);
    expect(await storage.has("key1")).toBe(true); // 再オープン後もkey1が保持される
    expect(await storage.has("key2")).toBe(true);
  });

  /**
   * Spy on `db.transaction` so that the FIRST call (the ensureDb keep-alive
   * probe) and SECOND call (the spawned real transaction we delegate the
   * keep-alive to) succeed via the real impl, and any subsequent call is
   * routed to `breakImpl`. This is the call we want to disrupt — the actual
   * operation kicked off by get/set/delete/has/clear.
   *
   * We capture `originalTxn` BEFORE installing the spy to avoid the spy
   * recursively consuming itself.
   */
  type TxnArgs = [string[], IDBTransactionMode?];
  const installTransactionSpy = (
    db: IDBDatabase,
    breakImpl: (...args: TxnArgs) => IDBTransaction,
  ): {
    realTxnForKeepAlive: (...args: TxnArgs) => IDBTransaction;
  } => {
    const originalTxn = db.transaction.bind(db) as (
      ...a: TxnArgs
    ) => IDBTransaction;
    let callIndex = 0;
    vi.spyOn(db, "transaction").mockImplementation((...args: unknown[]) => {
      callIndex += 1;
      if (callIndex === 1) {
        return originalTxn(...(args as TxnArgs));
      }
      return breakImpl(...(args as TxnArgs));
    });
    return { realTxnForKeepAlive: originalTxn };
  };

  it("should reject when indexedDB.open fails", async () => {
    const originalIndexedDB = globalThis.indexedDB;
    const failingFactory = {
      open: vi.fn(() => {
        const req = {
          result: null,
          error: new Error("Open failed"),
          onerror: null as ((this: unknown, ev: unknown) => unknown) | null,
          onsuccess: null as ((this: unknown, ev: unknown) => unknown) | null,
          onupgradeneeded: null as
            | ((this: unknown, ev: unknown) => unknown)
            | null,
        };
        // Fire onerror asynchronously after handlers are attached
        queueMicrotask(() => req.onerror?.call(req, {}));
        return req;
      }),
    };
    globalThis.indexedDB = failingFactory as unknown as IDBFactory;

    const fresh = new IndexedDBStorage();
    await expect(fresh.get("any")).rejects.toThrow(/Open failed/);

    globalThis.indexedDB = originalIndexedDB;
  });

  it("should reject when get's request.onerror fires", async () => {
    await storage.set("key", new Uint8Array([1]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();

    const { realTxnForKeepAlive } = installTransactionSpy(db, (...args) => {
      const txn = realTxnForKeepAlive(...args);
      const originalStore = txn.objectStore.bind(txn);
      vi.spyOn(txn, "objectStore").mockImplementation((name: string) => {
        const store = originalStore(name);
        vi.spyOn(store, "get").mockImplementation(() => {
          const req: Partial<IDBRequest> = {
            error: new DOMException("read-fail", "DataError"),
            onerror: null,
            onsuccess: null,
          };
          queueMicrotask(() => {
            const cb = req.onerror;
            if (typeof cb === "function") {
              (cb as (ev: Event) => void)(new Event("error"));
            }
          });
          return req as IDBRequest;
        });
        return store;
      });
      return txn;
    });

    await expect(storage.get("key")).rejects.toThrow(/read-fail/);
  });

  it("should reject when the transaction throws synchronously and reset db on InvalidStateError", async () => {
    await storage.set("key", new Uint8Array([1]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();

    const err = Object.assign(new Error("invalid state"), {
      name: "InvalidStateError",
    });
    installTransactionSpy(db, () => {
      throw err;
    });

    await expect(storage.get("key")).rejects.toThrow(/invalid state/);

    // The next call should re-open a fresh DB (db cache cleared by handleDbError).
    // Verify the storage is still usable.
    await storage.set("key2", new Uint8Array([2]).buffer);
    expect(await storage.has("key2")).toBe(true);
  });

  it("should reject when the transaction throws with a non-recovery error (handleDbError no-op branch)", async () => {
    await storage.set("key", new Uint8Array([1]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();

    const err = Object.assign(new Error("oops"), { name: "ConstraintError" });
    installTransactionSpy(db, () => {
      throw err;
    });

    await expect(storage.get("key")).rejects.toThrow(/oops/);
  });

  it.each([
    ["set", "put", "PutFail"],
    ["delete", "delete", "DeleteFail"],
    ["has", "count", "CountFail"],
    ["clear", "clear", "ClearFail"],
  ] as const)(
    "should reject %s when its request.onerror fires",
    async (op, storeMethod, domName) => {
      // Pre-populate so set/has/etc. hit the keep-alive path consistently
      await storage.set("seed", new Uint8Array([0]).buffer);
      const db = await (
        storage as unknown as { getDB(): Promise<IDBDatabase> }
      ).getDB();

      const { realTxnForKeepAlive } = installTransactionSpy(db, (...args) => {
        const txn = realTxnForKeepAlive(...args);
        const originalStore = txn.objectStore.bind(txn);
        vi.spyOn(txn, "objectStore").mockImplementation((name: string) => {
          const store = originalStore(name);
          vi.spyOn(
            store as unknown as Record<string, () => IDBRequest>,
            storeMethod as string,
          ).mockImplementation(() => {
            const req: Partial<IDBRequest> = {
              error: new DOMException(domName, domName),
              onerror: null,
              onsuccess: null,
            };
            queueMicrotask(() => {
              const cb = req.onerror;
              if (typeof cb === "function") {
                (cb as (ev: Event) => void)(new Event("error"));
              }
            });
            return req as IDBRequest;
          });
          return store;
        });
        return txn;
      });

      const invocation =
        op === "set"
          ? storage.set("k", new Uint8Array([1]).buffer)
          : op === "delete"
            ? storage.delete("k")
            : op === "has"
              ? storage.has("k")
              : storage.clear();

      await expect(invocation).rejects.toThrow(new RegExp(domName));
    },
  );

  it("should reject when transaction.onabort fires", async () => {
    await storage.set("seed", new Uint8Array([0]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();

    const { realTxnForKeepAlive } = installTransactionSpy(db, (...args) => {
      const txn = realTxnForKeepAlive(...args);
      queueMicrotask(() => {
        const cb = txn.onabort;
        if (typeof cb === "function") {
          (cb as (ev: Event) => void)(new Event("abort"));
        }
      });
      return txn;
    });

    await expect(storage.has("anything")).rejects.toThrow(
      /Transaction aborted/,
    );
  });

  it("handleDbError should reset db on TransactionInactiveError", async () => {
    await storage.set("k", new Uint8Array([1]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();

    const err = Object.assign(new Error("tx inactive"), {
      name: "TransactionInactiveError",
    });
    installTransactionSpy(db, () => {
      throw err;
    });
    await expect(storage.get("k")).rejects.toThrow(/tx inactive/);

    expect(await storage.has("k")).toBe(true);
  });

  it("handleDbError should pass through errors without a name property", async () => {
    await storage.set("seed", new Uint8Array([0]).buffer);
    const db = await (
      storage as unknown as { getDB(): Promise<IDBDatabase> }
    ).getDB();
    installTransactionSpy(db, () => {
      throw "non-object error";
    });
    await expect(storage.get("k")).rejects.toBe("non-object error");
  });
});
