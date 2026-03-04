// @ts-check
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Shared ESLint configuration for React packages.
 *
 * Provides:
 * - @eslint-react recommended-typescript rules (TypeScript-first, 4-7x faster)
 * - eslint-plugin-react-hooks recommended rules
 *
 * Usage in package eslint.config.mjs:
 * ```js
 * import rootConfig from "../../eslint.config.mjs";
 * import reactConfig from "@multi-game-engines/eslint-config-react";
 *
 * export default [...rootConfig, ...reactConfig];
 * ```
 */

const reactFiles = ["**/*.ts", "**/*.tsx"];

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ...eslintReact.configs["recommended-typescript"],
    files: reactFiles,
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: reactFiles,
  },
];

export default config;
