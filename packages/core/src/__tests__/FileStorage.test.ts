import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  /**
   * IndexedDB のリクエストオブジェクトを模倣するインターフェース。
   */
  interface MockIDBRequest extends IDBRequest {
    result: unknown;
    error: DOMException | null;
    onsuccess: ((ev: Event) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onupgradeneeded: ((ev: Event) => void) | null;
  }

  const mockIDB = {
    open: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal("indexedDB", mockIDB);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("IndexedDB を開き、正常にデータを保存（set）できること", async () => {
    const storage = new IndexedDBStorage();
    
    // トランザクションとストアのモック
    const mockPutRequest: Partial<MockIDBRequest> = { onsuccess: null, onerror: null };
    const mockStore = { put: vi.fn().mockReturnValue(mockPutRequest) };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };

    // open() リクエストのモック
    const mockOpenRequest: Partial<MockIDBRequest> = {
      result: {
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        transaction: vi.fn().mockReturnValue(mockTransaction),
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    mockIDB.open.mockReturnValue(mockOpenRequest);

    // 非同期の set を開始
    const setPromise = storage.set("test-key", new ArrayBuffer(8));
    
    // 1. DBオープン成功をシミュレート
    await new Promise(resolve => setTimeout(resolve, 0));
    if (mockOpenRequest.onsuccess) mockOpenRequest.onsuccess(new Event("success"));

    // 2. この時点で内部的に transaction().objectStore().put() が呼ばれているはず
    await new Promise(resolve => setTimeout(resolve, 0));
    if (mockPutRequest.onsuccess) {
      mockPutRequest.onsuccess(new Event("success"));
    }

    // 最終的に Promise が解決されることを検証
    await expect(setPromise).resolves.toBeUndefined();
    expect(mockIDB.open).toHaveBeenCalledWith("multi-game-engines-cache", 1);
  });
});
