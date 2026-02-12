/**
 * @multi-game-engines/core
 * 2026年 Web 標準準拠のゲームエンジン・ブリッジ・ライブラリ。
 */

// 公開インターフェースと型定義
export * from "./types.js";

// メインエントリーポイント
export { EngineBridge } from "./bridge/index.js";

// アダプター開発者向け基盤
export { BaseAdapter } from "./adapters/index.js";
export { WorkerCommunicator } from "./workers/index.js";

// ユーティリティ
export { CapabilityDetector, SecurityAdvisor } from "./capabilities/index.js";
export { EngineError } from "./errors/index.js";
