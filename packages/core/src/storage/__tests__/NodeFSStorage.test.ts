import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NodeFSStorage } from "../NodeFSStorage.js";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";

describe("NodeFSStorage", () => {
  const testDir = path.join(
    os.tmpdir(),
    "mge-test-cache-" + Math.random().toString(36).slice(2),
  );
  let storage: NodeFSStorage;

  beforeEach(() => {
    storage = new NodeFSStorage(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("should store and retrieve data from the filesystem", async () => {
    const data = new TextEncoder().encode("hello world").buffer;
    await storage.set("test.bin", data);

    expect(await storage.has("test.bin")).toBe(true);

    const retrieved = await storage.get("test.bin");
    expect(retrieved).not.toBeNull();
    expect(new Uint8Array(retrieved!)).toEqual(new Uint8Array(data));
  });

  it("should handle deletions", async () => {
    await storage.set("killme", new ArrayBuffer(4));
    await storage.delete("killme");
    expect(await storage.has("killme")).toBe(false);
  });

  it("should clear the directory", async () => {
    await storage.set("f1", new ArrayBuffer(4));
    await storage.set("f2", new ArrayBuffer(4));
    await storage.clear();
    expect(await storage.has("f1")).toBe(false);
  });

  it("should return the physical path", async () => {
    await storage.set("path-test", new ArrayBuffer(0));
    const physicalPath = await storage.getPhysicalPath("path-test");
    expect(physicalPath).toContain(testDir);
  });
});
