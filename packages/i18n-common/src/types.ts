import { I18nKey } from "@multi-game-engines/core";

/**
 * 共通 i18n キー (common)
 */
export type CommonKey =
  | "engine.status"
  | "engine.depth"
  | "engine.nodes"
  | "engine.nps"
  | "engine.npsUnit"
  | "engine.time"
  | "engine.score"
  | "engine.visits"
  | "engine.visitsUnit"
  | "engine.mateIn"
  | "engine.advantage"
  | "engine.retry"
  | "engine.reloadResources"
  | "engine.errorTitle"
  | "engine.errorDefaultRemediation"
  | "engine.timeUnitSeconds"
  | "engine.noMove"
  | "engine.standard"
  | "engine.errors.initializationFailed"
  | "engine.errors.workerError"
  | "engine.errors.timeout"
  | "engine.errors.disposed"
  | "engine.errors.nestedTooDeep"
  | "engine.errors.illegalCharacters"
  | "engine.errors.networkError"
  | "engine.errors.securityViolation"
  | "engine.errors.sriMismatch"
  | "engine.errors.bridgeDisposed"
  | "engine.errors.notReady"
  | "engine.errors.loaderRequired"
  | "engine.errors.missingSources"
  | "engine.errors.missingMainEntryPoint"
  | "engine.errors.invalidMoveFormat"
  | "engine.errors.injectionDetected"
  | "engine.errors.invalidPositionString"
  | "engine.errors.invalidEngineId"
  | "engine.errors.insecureConnection"
  | "engine.errors.sriRequired"
  | "engine.errors.adapterFactoryInvalidReturn"
  | "engine.errors.adapterNotFound"
  | "engine.errors.resourceLoadUnknown"
  | "engine.errors.invalidShogiMove"
  | "engine.errors.invalidMahjongMove"
  | "engine.errors.invalidGOBoard"
  | "engine.errors.invalidGOMove"
  | "engine.errors.invalidReversiBoard"
  | "engine.errors.invalidReversiMove"
  | "engine.errors.invalidBackgammonBoard"
  | "engine.errors.invalidBackgammonMove"
  | "engine.errors.invalidCheckersBoard"
  | "engine.errors.invalidCheckersMove"
  | "parsers.generic.invalidOptionValue"
  | "parsers.generic.parseError";

/**
 * ブランド型との互換性を保つための型ヘルパー。
 */
export type ModularCommonKey = (CommonKey | (string & I18nKey)) &
  (I18nKey | Record<string, never>);
