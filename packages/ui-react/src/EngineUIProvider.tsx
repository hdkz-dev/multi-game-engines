import React, { createContext, useContext, useMemo } from "react";
import { EngineUIStrings, jaStrings } from "@multi-game-engines/ui-core";

interface EngineUIContextValue {
  strings: EngineUIStrings;
}

const EngineUIContext = createContext<EngineUIContextValue | undefined>(
  undefined,
);

export interface EngineUIProviderProps {
  strings?: EngineUIStrings;
  children: React.ReactNode;
}

/**
 * UI コンポーネントの設定（i18n 等）を集中管理するプロバイダー。
 */
export const EngineUIProvider: React.FC<EngineUIProviderProps> = ({
  strings = jaStrings,
  children,
}) => {
  const value = useMemo(() => ({ strings }), [strings]);
  return (
    <EngineUIContext.Provider value={value}>
      {children}
    </EngineUIContext.Provider>
  );
};

/**
 * UI 設定を取得するカスタムフック
 */
export const useEngineUI = () => {
  const context = useContext(EngineUIContext);
  if (!context) {
    // プロバイダーがない場合はデフォルト（日本語）を返す
    return { strings: jaStrings };
  }
  return context;
};
