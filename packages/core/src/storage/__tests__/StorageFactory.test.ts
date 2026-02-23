import { describe, it, expect } from "vitest";
import { createFileStorage } from "../index.js";
import { OPFSStorage } from "../OPFSStorage.js";
import { IndexedDBStorage } from "../IndexedDBStorage.js";
import { ICapabilities } from "../../types.js";

describe("createFileStorage factory", () => {
  it("should return OPFSStorage when OPFS is available", () => {
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

  it("should return IndexedDBStorage when OPFS is not available", () => {
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
