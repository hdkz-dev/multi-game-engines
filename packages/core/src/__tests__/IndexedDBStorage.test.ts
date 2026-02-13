import { describe, it, expect } from "vitest";
import { IndexedDBStorage } from "../storage/IndexedDBStorage.js";

describe("IndexedDBStorage", () => {
  it("should be instantiable", () => {
    const storage = new IndexedDBStorage();
    expect(storage).toBeDefined();
  });
});
