import { describe, it, expect } from "vitest";
import { MemoryStorage } from "../MemoryStorage.js";

describe("MemoryStorage", () => {
  it("should store and retrieve data", async () => {
    const storage = new MemoryStorage();
    const data = new TextEncoder().encode("test data").buffer;

    await storage.set("key1", data);
    const retrieved = await storage.get("key1");

    expect(retrieved).not.toBeNull();
    expect(new Uint8Array(retrieved!)).toEqual(new Uint8Array(data));
  });

  it("should handle missing keys", async () => {
    const storage = new MemoryStorage();
    expect(await storage.get("non-existent")).toBeNull();
    expect(await storage.has("non-existent")).toBe(false);
  });

  it("should delete data", async () => {
    const storage = new MemoryStorage();
    const data = new TextEncoder().encode("test").buffer;
    await storage.set("key1", data);
    expect(await storage.has("key1")).toBe(true);

    await storage.delete("key1");
    expect(await storage.has("key1")).toBe(false);
  });

  it("should clear all data", async () => {
    const storage = new MemoryStorage();
    await storage.set("k1", new ArrayBuffer(4));
    await storage.set("k2", new ArrayBuffer(4));

    await storage.clear();
    expect(await storage.has("k1")).toBe(false);
    expect(await storage.has("k2")).toBe(false);
  });

  it("should report quota and usage", async () => {
    const storage = new MemoryStorage();
    const data = new ArrayBuffer(1024);
    await storage.set("k1", data);

    const quota = await storage.getQuota();
    expect(quota.usage).toBe(1024);
    expect(quota.quota).toBeGreaterThan(0);
  });
});
