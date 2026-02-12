/**
 * @multi-game-engines/core
 * 2026年 Web 標準準拠のゲームエンジン・ブリッジ・ライブラリ。
 */

// 公開インターフェースと型定義
export * from "./types";

// メインエントリーポイント
export { EngineBridge } from "./bridge";

// アダプター開発者向け基盤
export { BaseAdapter } from "./adapters";
export { WorkerCommunicator } from "./workers";

// プロトコルパーサー
export { UCIParser, USIParser } from "./protocols";

// ユーティリティ (必要に応じて)
export { CapabilityDetector, SecurityAdvisor } from "./capabilities";
export { EngineError } from "./errors";
