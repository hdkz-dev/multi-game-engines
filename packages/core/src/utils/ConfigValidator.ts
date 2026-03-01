import { EngineError } from "../errors/EngineError.js";
import { EngineErrorCode, IEngineConfig, IEngineSourceConfig } from "../types.js";
import { createI18nKey } from "../protocol/ProtocolValidator.js";

/**
 * エンジンのソース設定を結合・検証し、必須となる "main" ソースの存在を保証します。
 * 複数のアダプターファクトリ間でロジックを共有するために使用されます。
 * (2026 Zenith Tier: Centralized Validation)
 *
 * @param registrySources レジストリから取得したデフォルトのリソース設定
 * @param config ユーザーから渡されたエンジン設定
 * @param defaultEngineId IDが指定されなかった場合のフォールバックID
 * @returns 検証済みで必須の sources.main を含むリソース設定
 */
export function normalizeAndValidateSources(
  registrySources: Record<string, IEngineSourceConfig> | null | undefined,
  config: IEngineConfig,
  defaultEngineId: string,
): NonNullable<IEngineConfig["sources"]> {
  const sources = {
    ...(registrySources || {}),
    ...(config.sources || {}),
  };

  if (!sources.main) {
    const engineId = config.id || defaultEngineId;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: `[createEngine] Engine "${engineId}" requires a "main" source, but it was not found in the registry or config.`,
      engineId,
      i18nKey: createI18nKey("factory.requiresMainSource"),
      i18nParams: { id: engineId },
    });
  }

  return sources as NonNullable<IEngineConfig["sources"]>;
}
