import { IFileStorage } from "../types.js";

/**
 * Node.js/Bun 環境での OS ファイルシステムを用いた永続ストレージ。
 */
export class NodeFSStorage implements IFileStorage {
  private cacheDir: string | null = null;
  private customPath?: string | undefined;

  constructor(customPath?: string) {
    if (customPath !== undefined) {
      this.customPath = customPath;
    }
  }

  private async getModules() {
    // 2026: Hide from static bundlers like Next.js Turbopack and Vite
    const fsName = "node:fs/promises";
    const pathName = "node:path";
    const osName = "node:os";
    const fs = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ fsName
    );
    const path = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ pathName
    );
    const os = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ osName
    );
    return { fs, path, os };
  }

  private async getDir(): Promise<string> {
    if (this.cacheDir) return this.cacheDir;
    const { path, os } = await this.getModules();
    this.cacheDir =
      this.customPath ||
      path.join(os.homedir(), ".multi-game-engines", "cache");
    return this.cacheDir as string;
  }

  private async ensureDir(): Promise<void> {
    try {
      const { fs } = await this.getModules();
      const dir = await this.getDir();
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Ignore
    }
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    try {
      const { fs } = await this.getModules();
      const filePath = await this.getFilePath(key);
      const buffer = await fs.readFile(filePath);
      return buffer.buffer as ArrayBuffer;
    } catch {
      return null;
    }
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    await this.ensureDir();
    const { fs } = await this.getModules();
    const filePath = await this.getFilePath(key);
    await fs.writeFile(filePath, Buffer.from(data));
  }

  async delete(key: string): Promise<void> {
    try {
      const { fs } = await this.getModules();
      const filePath = await this.getFilePath(key);
      await fs.unlink(filePath);
    } catch {
      // Ignore
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const { fs } = await this.getModules();
      const filePath = await this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const { fs } = await this.getModules();
      const dir = await this.getDir();
      await fs.rm(dir, { recursive: true, force: true });
      await this.ensureDir();
    } catch {
      // Ignore
    }
  }

  async getQuota(): Promise<{ usage: number; quota: number }> {
    // 2026 Zenith: Simple stat for disk usage.
    // (Note: In Node.js, accurate quota is OS dependent, return safe values)
    return { usage: 0, quota: 10 * 1024 * 1024 * 1024 }; // 10GB safe quota
  }

  async getPhysicalPath(key: string): Promise<string | null> {
    return await this.getFilePath(key);
  }

  private async getFilePath(key: string): Promise<string> {
    // 2026: URL-safe filename encoding
    const { path } = await this.getModules();
    const dir = await this.getDir();
    const safeName = encodeURIComponent(key).substring(0, 255);
    return path.join(dir, safeName);
  }
}
