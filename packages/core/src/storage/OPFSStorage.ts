import { IFileStorage } from "../types.js";

export class OPFSStorage implements IFileStorage {
  async get(_key: string): Promise<ArrayBuffer | null> {
    // Mock implementation
    return null;
  }
  async set(_key: string, _data: ArrayBuffer): Promise<void> {}
  async delete(_key: string): Promise<void> {}
  async has(_key: string): Promise<boolean> {
    return false;
  }
  async clear(): Promise<void> {}
}
