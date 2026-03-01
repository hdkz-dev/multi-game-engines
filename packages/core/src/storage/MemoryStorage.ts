import { IFileStorage } from "../types.js";

/**
 * 揮発性のオンメモリストレージ。
 * キャッシュ制限が厳しい環境や、プライベートブラウジング等で使用される。
 */
export class MemoryStorage implements IFileStorage {
  private cache = new Map<string, ArrayBuffer>();

  async get(key: string): Promise<ArrayBuffer | null> {
    const data = this.cache.get(key);
    return data || null;
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    // 2026: Copy the data buffer to avoid mutation
    const copy = data.slice(0);
    this.cache.set(key, copy);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    let usage = 0;
    for (const data of this.cache.values()) {
      usage += data.byteLength;
    }
    // メモリ上限は安全な 128MB 程度
    return { usage, quota: 128 * 1024 * 1024 };
  }
}
