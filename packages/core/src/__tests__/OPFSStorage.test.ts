import { describe, it, expect } from "vitest";
import { OPFSStorage } from "../storage/OPFSStorage.js";

describe("OPFSStorage", () => {
  it("should be instantiable", () => {
    const storage = new OPFSStorage();
    expect(storage).toBeDefined();
  });
});
