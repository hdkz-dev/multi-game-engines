/**
 * \@multi-game-engines/core
 * 2026年 Web 標準準拠のゲームエンジン・ブリッジ・ライブラリ。
 */

// 公開インターフェースと型定義
export * from "./types.js";

// メインエントリーポイント
export {
  EngineBridge,
  EngineFacade,
  EngineBatchAnalyzer,
} from "./bridge/index.js";

// アダプター開発者向け基盤
export { BaseAdapter } from "./adapters/index.js";
// ICommunicator is a type-only export — safe for all runtimes.
// NativeCommunicator, resolveRuntime and RuntimeConfig are Node.js-only:
// import them from "@multi-game-engines/core/node" instead.
export type { ICommunicator } from "./workers/index.js";
export { WorkerCommunicator } from "./workers/index.js";
// isNodeEnvironment contains no Node.js API calls and is safe for browsers.
export { isNodeEnvironment } from "./workers/resolveRuntime.js";

// 能力検出とリソース管理
export {
  CapabilityDetector,
  SecurityAdvisor,
  EnvironmentDetector,
  ResourceGovernor,
} from "./capabilities/index.js";

// ユーティリティ
export * from "./errors/index.js";
export { ProtocolValidator } from "./protocol/index.js";
export {
  deepMerge,
  ScoreNormalizer,
  truncateLog,
  normalizeAndValidateSources,
} from "./utils/index.js";
export {
  createMove,
  createPositionString,
  createPositionId,
  createI18nKey,
} from "./protocol/ProtocolValidator.js";

// ストレージ
export {
  createFileStorage,
  NodeFSStorage,
  MemoryStorage,
  OPFSStorage,
  IndexedDBStorage,
} from "./storage/index.js";

// 標準ミドルウェア
export * from "./middlewares/index.js";
