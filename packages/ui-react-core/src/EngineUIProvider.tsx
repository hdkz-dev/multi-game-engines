"use client";

import React, { createContext, useContext, useMemo } from "react";
import { EngineUIStrings, createUIStrings } from "@multi-game-engines/ui-core";
import { commonLocales } from "@multi-game-engines/i18n-common";

const defaultStrings = createUIStrings(commonLocales.ja);

interface EngineUIContextValue {
  strings: EngineUIStrings;
}

const EngineUIContext = createContext<EngineUIContextValue | undefined>(
  undefined,
);

export interface EngineUIProviderProps {
  /**
   * Raw locale data object (e.g. from @multi-game-engines/i18n-common).
   * Must be serializable (no functions) to pass from Server Components.
   */
  localeData?: unknown;
  children: React.ReactNode;
}

/**
 * UI コンポーネントの設定（i18n 等）を集中管理するプロバイダー。
 * Next.js App Router (RSC) からのデータ渡しに対応するため、
 * シリアライズ可能な localeData を受け取り、内部で createUIStrings を実行します。
 */
export const EngineUIProvider: React.FC<EngineUIProviderProps> = ({
  localeData,
  children,
}) => {
  const strings = useMemo(
    () => createUIStrings(localeData ?? commonLocales.ja),
    [localeData],
  );

  const value = useMemo(() => ({ strings }), [strings]);
  return <EngineUIContext value={value}>{children}</EngineUIContext>;
};

/**
 * UI 設定を取得するカスタムフック
 */
export const useEngineUI = () => {
  const context = useContext(EngineUIContext);
  if (!context) {
    // プロバイダーがない場合はデフォルト（日本語）を返す
    return { strings: defaultStrings };
  }
  return context;
};
