import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFileStorage } from "../index.js";
import { OPFSStorage } from "../OPFSStorage.js";
import { IndexedDBStorage } from "../IndexedDBStorage.js";
import { NodeFSStorage } from "../NodeFSStorage.js";
import { ICapabilities } from "../../types.js";

describe("createFileStorage factory", () => {
  let originalProcess: NodeJS.Process;

  beforeEach(() => {
    originalProcess = global.process;
  });

  afterEach(() => {
    global.process = originalProcess;
  });

  it("should return NodeFSStorage in Node.js environment", () => {
    // Already in Node.js environment
    const caps: ICapabilities = { opfs: true } as ICapabilities;
    const storage = createFileStorage(caps);
    expect(storage).toBeInstanceOf(NodeFSStorage);
  });

  it("should return OPFSStorage when OPFS is available in browser", () => {
    // Mock browser environment by removing process.versions
    Object.defineProperty(global, "process", { value: { versions: {} }, writable: true });
    const caps: ICapabilities = {
      opfs: true,
      wasmThreads: false,
      wasmSimd: false,
      webNN: false,
      webGPU: false,
      webTransport: false,
    };
    const storage = createFileStorage(caps);
    expect(storage).toBeInstanceOf(OPFSStorage);
  });

  it("should return IndexedDBStorage when OPFS is not available in browser", () => {
    Object.defineProperty(global, "process", { value: { versions: {} }, writable: true });
    const caps: ICapabilities = {
      opfs: false,
      wasmThreads: false,
      wasmSimd: false,
      webNN: false,
      webGPU: false,
      webTransport: false,
    };
    const storage = createFileStorage(caps);
    expect(storage).toBeInstanceOf(IndexedDBStorage);
  });
});
