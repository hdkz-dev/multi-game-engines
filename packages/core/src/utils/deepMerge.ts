/**
 * シンプルなディープマージユーティリティ。
 * 2026 Best Practice: 外部ライブラリへの依存を避け、必要な機能のみを軽量に実装。
 * プロトタイプ汚染対策済みの安全な実装。
 */
export function deepMerge<T extends object>(
  target: T,
  source: Partial<T> | undefined,
): T {
  if (!source) return target;

  const output = { ...target } as Record<string, unknown>;

  for (const key in source) {
    // 2026 Best Practice: プロトタイプ汚染（__proto__, constructor, prototype）の防止
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = (source as Record<string, unknown>)[key];
      const targetValue = (target as Record<string, unknown>)[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(targetValue as object, sourceValue as object);
      } else if (sourceValue !== undefined) {
        output[key] = sourceValue;
      }
    }
  }

  return output as T;
}
