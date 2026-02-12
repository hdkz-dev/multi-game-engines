import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  /**
   * IndexedDB のリクエストオブジェクトを模倣するインターフェース。
   */
  interface MockIDBRequest {
    result: unknown;
    error: DOMException | null;
    onsuccess: ((ev: { target: MockIDBRequest }) => void) | null;
    onerror: ((ev: unknown) => void) | null;
    onupgradeneeded: ((ev: unknown) => void) | null;
  }

  interface MockDB {
    objectStoreNames: { contains: ReturnType<typeof vi.fn> };
    transaction: ReturnType<typeof vi.fn>;
  }

  const createMockRequest = (result: unknown = null): MockIDBRequest => ({
    result,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  });

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

  const setupOpenSuccess = (db: MockDB) => {
    const openRequest = createMockRequest(db);
    mockIDB.open.mockReturnValue(openRequest);
    
    // Simulate successful open in next tick
    setTimeout(() => {
      if (openRequest.onsuccess) openRequest.onsuccess({ target: openRequest });
    }, 0);
    
    return openRequest;
  };

  it("should save data correctly using set()", async () => {
    const mockPutRequest = createMockRequest();
    const mockStore = { 
      put: vi.fn().mockReturnValue(mockPutRequest),
      get: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };
    const mockDB: MockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    setupOpenSuccess(mockDB);
    
    setTimeout(() => {
      if (mockPutRequest.onsuccess) mockPutRequest.onsuccess({ target: mockPutRequest });
    }, 10);

    const storage = new IndexedDBStorage();
    await storage.set("test-key", new ArrayBuffer(8));

    expect(mockStore.put).toHaveBeenCalledWith(expect.anything(), "test-key");
  });

  it("should retrieve data correctly using get()", async () => {
    const mockGetRequest = createMockRequest(new ArrayBuffer(8));
    const mockStore = { 
      get: vi.fn().mockReturnValue(mockGetRequest),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };
    const mockDB: MockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    setupOpenSuccess(mockDB);
    
    setTimeout(() => {
      if (mockGetRequest.onsuccess) mockGetRequest.onsuccess({ target: mockGetRequest });
    }, 10);

    const storage = new IndexedDBStorage();
    const result = await storage.get("test-key");

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(mockStore.get).toHaveBeenCalledWith("test-key");
  });

  it("should return true for has() if key exists", async () => {
    const mockGetRequest = createMockRequest(new ArrayBuffer(8));
    const mockStore = { 
      get: vi.fn().mockReturnValue(mockGetRequest),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };
    const mockDB: MockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    setupOpenSuccess(mockDB);
    
    setTimeout(() => {
      if (mockGetRequest.onsuccess) mockGetRequest.onsuccess({ target: mockGetRequest });
    }, 10);

    const storage = new IndexedDBStorage();
    const result = await storage.has("test-key");

    expect(result).toBe(true);
  });

  it("should delete entry correctly", async () => {
    const mockDeleteRequest = createMockRequest();
    const mockStore = { 
      delete: vi.fn().mockReturnValue(mockDeleteRequest),
      get: vi.fn(),
      put: vi.fn(),
      clear: vi.fn()
    };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };
    const mockDB: MockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    setupOpenSuccess(mockDB);
    
    setTimeout(() => {
      if (mockDeleteRequest.onsuccess) mockDeleteRequest.onsuccess({ target: mockDeleteRequest });
    }, 10);

    const storage = new IndexedDBStorage();
    await storage.delete("test-key");

    expect(mockStore.delete).toHaveBeenCalledWith("test-key");
  });

  it("should clear all entries correctly", async () => {
    const mockClearRequest = createMockRequest();
    const mockStore = { 
      clear: vi.fn().mockReturnValue(mockClearRequest),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    const mockTransaction = { objectStore: vi.fn().mockReturnValue(mockStore) };
    const mockDB: MockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue(mockTransaction),
    };

    setupOpenSuccess(mockDB);
    
    setTimeout(() => {
      if (mockClearRequest.onsuccess) mockClearRequest.onsuccess({ target: mockClearRequest });
    }, 10);

    const storage = new IndexedDBStorage();
    await storage.clear();

    expect(mockStore.clear).toHaveBeenCalled();
  });
});
