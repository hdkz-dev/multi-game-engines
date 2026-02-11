import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  // IndexedDB の簡易モック
  const mockIDB = {
    open: vi.fn().mockReturnValue({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            put: vi.fn().mockReturnValue({ onsuccess: null }),
            get: vi.fn().mockReturnValue({ onsuccess: null }),
            count: vi.fn().mockReturnValue({ onsuccess: null }),
            delete: vi.fn().mockReturnValue({ onsuccess: null }),
            clear: vi.fn().mockReturnValue({ onsuccess: null }),
          }),
        }),
      },
    }),
  };

  beforeEach(() => {
    vi.stubGlobal("indexedDB", mockIDB);
  });

  it("should attempt to open IndexedDB", async () => {
    const storage = new IndexedDBStorage();
    // getDB は private なので、間接的に set などで呼ぶ
    void storage.set("test", new ArrayBuffer(0));
    
    // モックの success を発火させる
    const request = mockIDB.open();
    request.onsuccess();
    
    // transaction の success を発火させる (簡易化のため Promise.resolve されるように振る舞わせる)
    // 実際の実装ではもう少し詳細なモックが必要ですが、ここでは呼び出しを確認
    expect(mockIDB.open).toHaveBeenCalledWith("multi-game-engines-cache", 1);
  });
});
