import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OPFSStorage } from "../storage/OPFSStorage";

describe("OPFSStorage", () => {
  // 2026 Best Practice: Use specific mock types to avoid 'any'
  interface MockFileHandle {
    getFile: ReturnType<typeof vi.fn>;
    createWritable: ReturnType<typeof vi.fn>;
  }
  interface MockDirectoryHandle {
    getFileHandle: ReturnType<typeof vi.fn>;
    removeEntry: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  }

  let mockFileHandle: MockFileHandle;
  let mockDirectoryHandle: MockDirectoryHandle;

  beforeEach(() => {
    mockFileHandle = {
      getFile: vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }),
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        abort: vi.fn().mockResolvedValue(undefined),
      }),
    };

    mockDirectoryHandle = {
      getFileHandle: vi.fn().mockResolvedValue(mockFileHandle),
      removeEntry: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockImplementation(() => {
        return (async function* () {
          yield "file1";
          yield "file2";
        })();
      }),
    };

    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn().mockResolvedValue(mockDirectoryHandle),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("should save data correctly using set()", async () => {
    const storage = new OPFSStorage();
    const data = new ArrayBuffer(16);
    await storage.set("test-key", data);

    expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith("test-key", { create: true });
    expect(mockFileHandle.createWritable).toHaveBeenCalled();
  });

  it("should retrieve data correctly using get()", async () => {
    const storage = new OPFSStorage();
    const result = await storage.get("test-key");

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(mockDirectoryHandle.getFileHandle).toHaveBeenCalledWith("test-key");
  });

  it("should return null when get() fails with NotFoundError", async () => {
    mockDirectoryHandle.getFileHandle.mockRejectedValueOnce(
      new DOMException("Not found", "NotFoundError")
    );
    const storage = new OPFSStorage();
    const result = await storage.get("non-existent");

    expect(result).toBeNull();
  });

  it("should return true for has() if file exists", async () => {
    const storage = new OPFSStorage();
    const exists = await storage.has("test-key");
    expect(exists).toBe(true);
  });

  it("should delete entry correctly", async () => {
    const storage = new OPFSStorage();
    await storage.delete("test-key");
    expect(mockDirectoryHandle.removeEntry).toHaveBeenCalledWith("test-key");
  });

  it("should clear all entries correctly", async () => {
    const storage = new OPFSStorage();
    await storage.clear();
    expect(mockDirectoryHandle.removeEntry).toHaveBeenCalledTimes(2);
  });
});
