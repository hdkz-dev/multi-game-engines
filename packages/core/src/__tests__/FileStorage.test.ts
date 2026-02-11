import { describe, it, expect, vi, beforeEach } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  // IndexedDB の詳細なモック
  const mockIDB = {
    open: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal("indexedDB", mockIDB);
    vi.resetAllMocks();
  });

  it("should attempt to open IndexedDB and perform set operation", async () => {
    const storage = new IndexedDBStorage();
    
    // Mock for put request
    const mockPutRequest = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onsuccess: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onerror: null as any,
    };

    // Mock for transaction and store
    const mockStore = {
      put: vi.fn().mockReturnValue(mockPutRequest),
    };
    const mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    };

    // Mock for open request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockOpenRequest: any = {
      result: {
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        transaction: vi.fn().mockReturnValue(mockTransaction),
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    mockIDB.open.mockReturnValue(mockOpenRequest);

    // setを開始。内部でgetDB()が走り、open()が呼ばれる。
    const setPromise = storage.set("test", new ArrayBuffer(0));
    
    // 1. DBオープン成功を通知
    if (mockOpenRequest.onsuccess) mockOpenRequest.onsuccess();

    // 非同期の隙間を埋めるために少し待つ
    await new Promise(resolve => setTimeout(resolve, 0));

    // 2. この時点で内部的に transaction().objectStore().put() が呼ばれているはず
    // putRequest.onsuccess を発火させて、setのPromiseを解決させる
    if (mockPutRequest.onsuccess) mockPutRequest.onsuccess();

    await expect(setPromise).resolves.toBeUndefined();
    expect(mockIDB.open).toHaveBeenCalledWith("multi-game-engines-cache", 1);
  });
});
