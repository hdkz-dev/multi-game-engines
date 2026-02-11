import { ICapabilities, IFileStorage } from "../types";
import { OPFSStorage } from "./OPFSStorage";
import { IndexedDBStorage } from "./IndexedDBStorage";

/**
 * 環境の能力に応じて、最適なストレージ実装を作成します。
 * 
 * @param capabilities CapabilityDetector によって診断された環境の能力
 * @returns 抽象化されたストレージインスタンス
 */
export function createFileStorage(capabilities: ICapabilities): IFileStorage {
  if (capabilities.opfs) {
    return new OPFSStorage();
  }
  return new IndexedDBStorage();
}

export * from "./OPFSStorage";
export * from "./IndexedDBStorage";
