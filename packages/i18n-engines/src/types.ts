import { I18nKey } from "@multi-game-engines/core";

/**
 * エンジン・レジストリ関連キー (engines)
 */
export type EnginesKey =
  | "ensemble.errors.noResults"
  | "ensemble.weighted.initialized"
  | "ensemble.weighted.noWeight"
  | "registry.invalidManifest"
  | "registry.fetchFailed"
  | "registry.invalidFormat"
  | "registry.timeout"
  | "registry.sriMismatch"
  | "registry.invalidSriFormat"
  | "registry.unsupportedAlgorithm"
  | "registry.notLoaded";

/**
 * ブランド型との互換性を保つための型ヘルパー。
 */
export type ModularEnginesKey = (EnginesKey | (string & I18nKey)) &
  (I18nKey | Record<string, never>);
