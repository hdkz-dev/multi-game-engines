import { describe, it, expect, vi, beforeEach } from "vitest";
import { OPFSStorage } from "../storage/OPFSStorage.js";

describe("OPFSStorage", () => {
  let storage: OPFSStorage;
  const mockFileHandle = {
    getFile: vi.fn(),
    createWritable: vi.fn(),
  };
  const mockDirHandle = {
    getFileHandle: vi.fn(),
    removeEntry: vi.fn(),
    keys: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new OPFSStorage();

    // navigator.storage.getDirectory のグローバルモック
    vi.stubGlobal("navigator", {
      storage: {
        getDirectory: vi.fn().mockResolvedValue(mockDirHandle),
      },
    });
  });

  it("should get data from OPFS", async () => {
    const mockData = new Uint8Array([1, 2, 3]).buffer;
    const mockFile = {
      arrayBuffer: vi.fn().mockResolvedValue(mockData),
    };
    mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    mockFileHandle.getFile.mockResolvedValue(mockFile);

    const result = await storage.get("test-key");
    expect(result).toBe(mockData);
    expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith("test-key");
  });

  it("should return null if file is not found", async () => {
    mockDirHandle.getFileHandle.mockRejectedValue(new Error("File not found"));
    const result = await storage.get("non-existent");
    expect(result).toBeNull();
  });

  it("should set data to OPFS", async () => {
    const mockData = new Uint8Array([4, 5, 6]).buffer;
    const mockWritable = {
      write: vi.fn(),
      close: vi.fn(),
    };
    mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    mockFileHandle.createWritable.mockResolvedValue(mockWritable);

    await storage.set("test-key", mockData);
    expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith("test-key", {
      create: true,
    });
    expect(mockWritable.write).toHaveBeenCalledWith(mockData);
    expect(mockWritable.close).toHaveBeenCalled();
  });

  it("should abort if write fails", async () => {
    const mockData = new Uint8Array([4, 5, 6]).buffer;
    const mockWritable = {
      write: vi.fn().mockRejectedValue(new Error("Write error")),
      close: vi.fn(),
      abort: vi.fn(),
    };
    mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    mockFileHandle.createWritable.mockResolvedValue(mockWritable);

    await expect(storage.set("test-key", mockData)).rejects.toThrow(
      "Write error",
    );
    expect(mockWritable.abort).toHaveBeenCalled();
    expect(mockWritable.close).not.toHaveBeenCalled();
  });

  it("should abort if write fails and abort fails", async () => {
    const mockData = new Uint8Array([4, 5, 6]).buffer;
    const mockWritable = {
      write: vi.fn().mockRejectedValue(new Error("Write error")),
      close: vi.fn(),
      abort: vi.fn().mockRejectedValue(new Error("Abort error")),
    };
    mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    mockFileHandle.createWritable.mockResolvedValue(mockWritable);

    await expect(storage.set("test-key", mockData)).rejects.toThrow(
      "Write error",
    );
    expect(mockWritable.abort).toHaveBeenCalled();
    expect(mockWritable.close).not.toHaveBeenCalled();
  });

  it("should delete entry from OPFS", async () => {
    await storage.delete("test-key");
    expect(mockDirHandle.removeEntry).toHaveBeenCalledWith("test-key");
  });

  it("should check if file exists", async () => {
    mockDirHandle.getFileHandle.mockResolvedValue(mockFileHandle);
    const result = await storage.has("test-key");
    expect(result).toBe(true);
  });

  it("should clear all entries", async () => {
    mockDirHandle.keys.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield "file1";
        yield "file2";
      },
    });

    await storage.clear();
    expect(mockDirHandle.removeEntry).toHaveBeenCalledWith("file1", {
      recursive: true,
    });
    expect(mockDirHandle.removeEntry).toHaveBeenCalledWith("file2", {
      recursive: true,
    });
  });
});
