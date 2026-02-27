import { I18nKey } from "@multi-game-engines/core";

/**
 * ダッシュボード UI 固有キー (dashboard)
 */
export type DashboardKey = `dashboard.${string}` | `engine.${string}`;

/**
 * ブランド型との互換性を保つための型ヘルパー。
 */
export type ModularDashboardKey = (DashboardKey | (string & I18nKey)) &
  (I18nKey | Record<string, never>);
