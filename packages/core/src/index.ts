/**
 * @multi-game-engines/core
 * 2026年 Web 標準準拠のゲームエンジン・ブリッジ・ライブラリ。
 */

// 公開インターフェースと型定義
export * from "./types.js";

// メインエントリーポイント
export { EngineBridge, EngineFacade } from "./bridge/index.js";

// アダプター開発者向け基盤
export { BaseAdapter } from "./adapters/index.js";
export { WorkerCommunicator } from "./workers/index.js";

// ユーティリティ
export { CapabilityDetector, SecurityAdvisor } from "./capabilities/index.js";
export { EngineError } from "./errors/index.js";
export { ProtocolValidator } from "./protocol/index.js";
export { deepMerge } from "./utils/index.js";
export { truncateLog } from "./utils/Sanitizer.js";
export {
  createMove,
  createPositionString,
} from "./protocol/ProtocolValidator.js";

// 標準ミドルウェア
export * from "./middlewares/index.js";
