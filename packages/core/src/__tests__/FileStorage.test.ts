import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  // IndexedDB の簡易モックインターフェース
  // 必要最小限のプロパティのみを定義して any を回避する
  interface MockIDBRequest {
    result: unknown;
    error: Error | null;
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

  it("should attempt to open IndexedDB and perform set operation", async () => {
    const storage = new IndexedDBStorage();
    
    // Putリクエストのモック
    const mockPutRequest: Partial<MockIDBRequest> = {
      onsuccess: null,
      onerror: null,
    };

    // StoreとTransactionのモック
    const mockStore = {
      put: vi.fn().mockReturnValue(mockPutRequest),
    };
    const mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    };

    // Openリクエストのモック
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

    // setを実行。内部で open() が呼ばれる。
    const setPromise = storage.set("test", new ArrayBuffer(0));
    
    // 1. DBオープン成功をシミュレート
    // 非同期処理の進行を待つため、イベントループを回す
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (mockOpenRequest.onsuccess) {
      mockOpenRequest.onsuccess(new Event("success"));
    }

    // 2. トランザクションと put が呼ばれた後の成功をシミュレート
    await new Promise(resolve => setTimeout(resolve, 0));

    if (mockPutRequest.onsuccess) {
      mockPutRequest.onsuccess(new Event("success"));
    }

    // エラーなく完了することを検証
    await expect(setPromise).resolves.toBeUndefined();
    expect(mockIDB.open).toHaveBeenCalledWith("multi-game-engines-cache", 1);
  });
});
