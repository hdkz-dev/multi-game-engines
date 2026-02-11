import { ICapabilities, IFileStorage } from "../types";
import { OPFSStorage } from "./OPFSStorage";
import { IndexedDBStorage } from "./IndexedDBStorage";

/**
 * 環境に応じた最適なストレージ実装を生成します。
 */
export function createFileStorage(caps: ICapabilities): IFileStorage {
  if (caps.opfs) {
    return new OPFSStorage();
  }
  return new IndexedDBStorage();
}
