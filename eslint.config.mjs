import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import storybook from "eslint-plugin-storybook";
import lit from "eslint-plugin-lit";
import wc from "eslint-plugin-wc";
import importX from "eslint-plugin-import-x";
import promise from "eslint-plugin-promise";
import unicorn from "eslint-plugin-unicorn";
import { unicornRules } from "./eslint-unicorn-policy.mjs";
import tsdoc from "eslint-plugin-tsdoc";
import noOnlyTests from "eslint-plugin-no-only-tests";
import vitest from "@vitest/eslint-plugin";

export default [
  {
    ignores: [
      "**/dist/**",
      "docs/api/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/.next/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.config.js",
      "**/next-env.d.ts",
      "fixtures/shared-mocks/**",
      "**/.storybook/**",
      "**/coverage/**",
      "**/scripts/**",
      "**/tsup.config.bundled_*",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: [".pnpmfile.cjs", "scripts/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
  },
  lit.configs["flat/recommended"],
  wc.configs["flat/recommended"],
  // Import-x Configuration
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    settings: {
      "import-x/resolver": {
        typescript: true,
      },
    },
  },
  // Promise Configuration
  {
    ...promise.configs["flat/recommended"],
    rules: {
      ...promise.configs["flat/recommended"].rules,
      "promise/always-return": "off",
    },
  },
  // Reviewed project policy is independent of upstream style-preset changes.
  {
    languageOptions: unicorn.configs.recommended.languageOptions,
    plugins: { unicorn },
    rules: unicornRules,
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "tsdoc/syntax": "warn",
      "import-x/no-unresolved": "off",
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
      "import-x/default": "off",
      "promise/param-names": "off",
    },
  },
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    plugins: {
      storybook,
    },
    rules: {
      "storybook/no-renderer-packages": "off",
    },
  },
  {
    files: ["**/*.{test,spec}.ts", "**/*.{test,spec}.tsx"],
    plugins: {
      vitest,
      "no-only-tests": noOnlyTests,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "no-only-tests/no-only-tests": "error",
      "vitest/no-conditional-expect": "off",
      "vitest/no-commented-out-tests": "warn",
      "vitest/expect-expect": "off",
    },
  },
];
