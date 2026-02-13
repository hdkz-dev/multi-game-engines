import { ICapabilities, IFileStorage } from "../types.js";
import { OPFSStorage } from "./OPFSStorage.js";
import { IndexedDBStorage } from "./IndexedDBStorage.js";

/**
 * 実行環境に最適なストレージ実装を作成します。
 */
export function createFileStorage(capabilities: ICapabilities): IFileStorage {
  if (capabilities.opfs) {
    return new OPFSStorage();
  }
  return new IndexedDBStorage();
}
