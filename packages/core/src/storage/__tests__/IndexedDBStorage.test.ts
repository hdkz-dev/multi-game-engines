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
    // Note: 型定義の問題により as any を使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forceCloseDatabase(db as any);

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
});
