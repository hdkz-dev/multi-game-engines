import { ICapabilities, IFileStorage } from "../types.js";
import { OPFSStorage } from "./OPFSStorage.js";
import { IndexedDBStorage } from "./IndexedDBStorage.js";
import { NodeFSStorage } from "./NodeFSStorage.js";
import { MemoryStorage } from "./MemoryStorage.js";

/**
 * 実行環境に最適なストレージ実装を作成します。
 */
export function createFileStorage(capabilities: ICapabilities): IFileStorage {
  // Node.js/Bun 環境の場合 (CLI)
  if (
    typeof process !== "undefined" &&
    (process.versions?.node || process.versions?.bun)
  ) {
    try {
      return new NodeFSStorage();
    } catch {
      // フォールバック
    }
  }

  // Web ブラウザ環境
  if (capabilities.opfs) {
    return new OPFSStorage();
  }

  try {
    return new IndexedDBStorage();
  } catch {
    // 最終的なフォールバック
    return new MemoryStorage();
  }
}

export { OPFSStorage, IndexedDBStorage, NodeFSStorage, MemoryStorage };
